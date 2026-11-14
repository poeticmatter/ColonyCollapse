import { Triangle } from 'lucide-react'
import { ACTIONS, type ActionId, type ActionSide } from './actions'

const TILE_BODY_COLOR = '#F7F2E4'
const TILE_INK_COLOR = '#22304A'
const HEADER_INK_COLOR = '#FFFFFF'

// Basic and upgraded share every interior colour, so only the frame, header and the
// upgrade triangle tell them apart: dark blue for basic, upgrade brown for upgraded.
const SIDE_FRAME_COLORS: Readonly<Record<ActionSide, string>> = {
  basic: '#22304A',
  upgraded: '#8A5A00',
}

// Proportions are fractions of the tile's side, so the tile scales with `size`.
const BORDER_RATIO = 0.015
const RADIUS_RATIO = 0.07
const HEADER_HEIGHT_RATIO = 0.2
const HEADER_ICON_RATIO = 0.11
const NAME_FONT_RATIO = 0.085
const BODY_ICON_RATIO = 0.42

interface ActionTileProps {
  action: ActionId
  side: ActionSide
  /** Side length in pixels. */
  size?: number
}

/** An action tile: the action's icon and name, framed blue (basic) or brown with a triangle (upgraded). Its rules are shown by the board's ActionHelp. */
export function ActionTile({ action, side, size = 96 }: ActionTileProps) {
  const { Icon, name } = ACTIONS[action]
  const frameColor = SIDE_FRAME_COLORS[side]
  const isUpgraded = side === 'upgraded'
  return (
    <div
      className="flex flex-col overflow-hidden select-none"
      style={{
        width: size,
        height: size,
        background: TILE_BODY_COLOR,
        border: `${Math.max(2, size * BORDER_RATIO * 2)}px solid ${frameColor}`,
        borderRadius: size * RADIUS_RATIO,
        color: TILE_INK_COLOR,
      }}
    >
      <div
        className="flex shrink-0 items-center gap-[0.3em] px-[0.4em]"
        style={{ background: frameColor, color: HEADER_INK_COLOR, height: size * HEADER_HEIGHT_RATIO, fontSize: size * NAME_FONT_RATIO }}
      >
        <Icon size={size * HEADER_ICON_RATIO} strokeWidth={2.2} aria-hidden />
        <span className="flex-1 truncate font-black leading-none tracking-tight">{name}</span>
        {isUpgraded && <Triangle size={size * HEADER_ICON_RATIO * 0.8} fill="currentColor" strokeWidth={0} aria-hidden />}
      </div>
      <div className="flex flex-1 items-center justify-center">
        <Icon size={size * BODY_ICON_RATIO} strokeWidth={1.8} aria-hidden />
      </div>
    </div>
  )
}
