import { useCallback, useEffect, useId, useRef, useState, type PointerEvent, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { ACTIONS, type ActionId, type ActionSide } from '../../art/actions'
import { useBoard } from '../context'
import { placePopover, POPOVER_WIDTH_PX, type PopoverPlacement } from './placement'
import { upgradeSourceText } from './upgradeSource'

/** Hovering shows the help until the pointer leaves; the ? button keeps it open until tapped again or dismissed. */
type OpenedBy = 'hover' | 'button'

const SIDE_LABELS: Readonly<Record<ActionSide, string>> = { basic: 'Standard', upgraded: 'Upgraded' }
const SIDES: readonly ActionSide[] = ['basic', 'upgraded']

interface ActionHelpProps {
  action: ActionId
  /** The side the tile shows, which the help marks. */
  side: ActionSide
  /** The tile, or the button holding it. The ? button sits beside it, never inside it. */
  children: ReactNode
}

/**
 * Explains an action tile: a popover on mouse hover, and a ? button in the tile's corner for
 * touch screens (and keyboards), which have no hover.
 */
export function ActionHelp({ action, side, children }: ActionHelpProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const popoverId = useId()
  const [openedBy, setOpenedBy] = useState<OpenedBy | null>(null)
  const [placement, setPlacement] = useState<PopoverPlacement | null>(null)
  const close = useCallback(() => setOpenedBy(null), [])
  useDismissal(openedBy !== null, wrapperRef, popoverRef, close)

  function open(by: OpenedBy) {
    const tile = wrapperRef.current?.getBoundingClientRect()
    if (!tile) return
    setPlacement(placePopover(tile, { width: window.innerWidth, height: window.innerHeight }))
    setOpenedBy(by)
  }

  // Touch screens send pointer events too; only a real mouse hovers.
  const onPointerEnter = (event: PointerEvent) => {
    if (event.pointerType === 'mouse' && openedBy === null) open('hover')
  }
  const onPointerLeave = () => {
    if (openedBy === 'hover') close()
  }
  const isOpen = openedBy !== null && placement !== null

  return (
    <div ref={wrapperRef} className="relative inline-block" onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave}>
      {children}
      <button
        type="button"
        aria-label={`About ${ACTIONS[action].name}`}
        aria-expanded={openedBy === 'button'}
        aria-controls={popoverId}
        onClick={() => (openedBy === 'button' ? close() : open('button'))}
        // The visible dot is small; the ::before area makes it a comfortable tap target.
        className="absolute -right-1.5 -top-1.5 z-10 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-rule bg-paper text-[11px] font-black leading-none text-ink shadow-sm before:absolute before:-inset-2.5 before:content-[''] hover:bg-slot"
      >
        ?
      </button>
      {isOpen &&
        createPortal(<ActionHelpCard id={popoverId} ref={popoverRef} action={action} side={side} placement={placement} />, document.body)}
    </div>
  )
}

interface ActionHelpCardProps {
  id: string
  ref: RefObject<HTMLDivElement | null>
  action: ActionId
  side: ActionSide
  placement: PopoverPlacement
}

function ActionHelpCard({ id, ref, action, side, placement }: ActionHelpCardProps) {
  const { state } = useBoard()
  const { name, Icon, rules } = ACTIONS[action]
  return (
    <div
      id={id}
      ref={ref}
      role="tooltip"
      className="fixed z-50 overflow-y-auto rounded-xl border border-rule bg-paper p-3 text-left text-sm text-ink shadow-lg"
      style={{ ...placement, width: POPOVER_WIDTH_PX, maxWidth: 'calc(100vw - 16px)' }}
    >
      <h3 className="flex items-center gap-1.5 font-black">
        <Icon size={16} aria-hidden />
        {name}
      </h3>
      <p className="mb-2 text-xs text-ink-soft">X is the strength: the number of the slot it resolves in.</p>
      <dl className="space-y-1.5">
        {SIDES.map((ruleSide) => (
          <div key={ruleSide} className={ruleSide === side ? '' : 'opacity-60'}>
            <dt className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">
              {SIDE_LABELS[ruleSide]}
              {ruleSide === side && ' · this tile'}
            </dt>
            <dd>{rules[ruleSide]}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs text-ink-soft">{upgradeSourceText(state, action)}</p>
    </div>
  )
}

/**
 * Closes the popover on a tap or click outside it and its tile, on Escape, and when the page
 * scrolls or resizes (it is fixed in place, so it would drift off its tile).
 */
function useDismissal(
  isOpen: boolean,
  tileRef: RefObject<HTMLElement | null>,
  popoverRef: RefObject<HTMLElement | null>,
  close: () => void,
) {
  useEffect(() => {
    if (!isOpen) return
    const isInside = (target: EventTarget | null) =>
      target instanceof Node && [tileRef, popoverRef].some((ref) => ref.current?.contains(target))
    const onPointerDown = (event: globalThis.PointerEvent) => {
      if (!isInside(event.target)) close()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    // Scrolling the popover's own text is fine.
    const onScroll = (event: Event) => {
      if (!isInside(event.target)) close()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', close)
    }
  }, [isOpen, tileRef, popoverRef, close])
}
