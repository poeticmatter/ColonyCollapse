import { RotateCw, Zap } from 'lucide-react'
import { ISSUE_DEEP, ISSUE_FILL, type Issue } from '../board/palette'
import { IssueSymbol } from './IssueSymbol'

export type CardType = 'Immediate' | 'Ongoing'

// Every em size below is relative to a base that is 16px when the card is 280px
// wide and scales with the card's width, so a small card is the full card shrunk.
const DESIGN_WIDTH_PX = 280
const DESIGN_BASE_FONT_PX = 16
const SCALED_FONT_SIZE = `calc(100cqw * ${DESIGN_BASE_FONT_PX} / ${DESIGN_WIDTH_PX})`

const TITLE_BAR_COLOR = '#EDB547'
const TITLE_BAR_INK = '#2B1C02'
const RAIL_COLOR = '#1E293B'
const PAPER_COLOR = '#FBF8F1'
const INK_COLOR = '#1F2937'

// Pointy-top hex inside a 62x70 box, matching the board's hex tiles.
const MEDALLION_VIEWBOX = { width: 62, height: 70 }
const MEDALLION_POINTS = '31,2 59,18 59,52 31,68 3,52 3,18'
const MEDALLION_ICON_SIZE = 32

// Action keywords that open an effect ("ADDRESS:", "INTERN:") are rules terms, set bold like a rulebook would.
const LEADING_KEYWORD_PATTERN = /^([A-Z]+:)\s*/

function HexMedallion({ issue }: { issue: Issue }) {
  const iconOffsetX = (MEDALLION_VIEWBOX.width - MEDALLION_ICON_SIZE) / 2
  const iconOffsetY = (MEDALLION_VIEWBOX.height - MEDALLION_ICON_SIZE) / 2
  return (
    <svg viewBox={`0 0 ${MEDALLION_VIEWBOX.width} ${MEDALLION_VIEWBOX.height}`} className="block h-[4.375em] w-[3.875em]">
      <title>{issue}</title>
      <polygon points={MEDALLION_POINTS} fill={ISSUE_FILL[issue]} stroke={ISSUE_DEEP[issue]} strokeWidth="3.5" strokeLinejoin="round" />
      <g transform={`translate(${iconOffsetX}, ${iconOffsetY})`}>
        <IssueSymbol issue={issue} size={MEDALLION_ICON_SIZE} strokeWidth={2} />
      </g>
    </svg>
  )
}

function EffectText({ effect }: { effect: string }) {
  const keywordMatch = effect.match(LEADING_KEYWORD_PATTERN)
  if (!keywordMatch) return <>{effect}</>
  return (
    <>
      <b className="font-black tracking-[0.04em]">{keywordMatch[1]}</b> {effect.slice(keywordMatch[0].length)}
    </>
  )
}

function CardTypeLine({ type }: { type: CardType }) {
  const isImmediate = type === 'Immediate'
  return (
    <div className="flex items-center gap-[0.5em] border-b border-[#E2DCCD] pb-[0.4em]">
      <span
        className="flex h-[1.5em] w-[1.5em] shrink-0 items-center justify-center rounded-full"
        style={{ background: RAIL_COLOR, color: '#F8F4EA' }}
      >
        {isImmediate ? <Zap size="0.875em" strokeWidth={2.4} fill="currentColor" /> : <RotateCw size="0.875em" strokeWidth={2.4} />}
      </span>
      <span className="text-[0.6875em] font-extrabold uppercase tracking-[0.1em] text-slate-600">
        {isImmediate ? 'Immediate action' : 'Ongoing effect'}
      </span>
    </div>
  )
}

interface CardFaceProps {
  title: string
  type: CardType
  /** May open with an action keyword such as "LEVERAGE:", which is set bold. */
  effect: string
  /** A card belongs equally to both its colours; they show as two medallions on the left rail. */
  colors: readonly [Issue, Issue]
  /** Width in pixels; the card is 5:7. */
  width?: number
}

/** A compact card face for a hand or tableau. The full effect text is also the tooltip. */
export function CardFace({ title, type, effect, colors, width = 168 }: CardFaceProps) {
  return (
    <div
      title={`${title} (${type}): ${effect}`}
      className="overflow-hidden rounded-[0.5em] shadow-md select-none"
      style={{ width, aspectRatio: '5 / 7', containerType: 'inline-size' }}
    >
      <div
        className="grid h-full w-full grid-cols-[2.5em_1fr] grid-rows-[3.625em_1fr]"
        style={{ fontSize: SCALED_FONT_SIZE, background: PAPER_COLOR, color: INK_COLOR }}
      >
        <div
          className="col-span-2 flex items-center justify-center px-[0.875em] text-center"
          style={{ background: TITLE_BAR_COLOR, color: TITLE_BAR_INK }}
        >
          <h3 className="text-[1.1875em] leading-[1.08] font-black tracking-[-0.015em] text-balance">{title}</h3>
        </div>

        <div className="relative" style={{ background: RAIL_COLOR }}>
          <div className="absolute top-[0.75em] left-full z-10 flex -translate-x-1/2 flex-col gap-[0.5em]">
            {colors.map((issue, index) => (
              <HexMedallion key={`${issue}-${index}`} issue={issue} />
            ))}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-[0.625em] pt-[0.75em] pr-[0.875em] pb-[0.625em] pl-[2.625em]">
          <CardTypeLine type={type} />
          <p className="my-auto overflow-hidden text-center text-[0.875em] leading-[1.38] font-semibold text-pretty text-gray-900">
            <EffectText effect={effect} />
          </p>
        </div>
      </div>
    </div>
  )
}
