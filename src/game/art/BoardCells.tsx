import { BOARD_CELL_FACE_RADIUS, hexPointsAt, type Round } from '../board/geometry'
import {
  GOLD_FILL,
  ISSUE_DEEP,
  ISSUE_FILL,
  ISSUE_INK,
  type Issue,
} from '../board/palette'
import { BeeMark } from './BeeMark'
import { FACE_ICON_RISE_RATIO, FACE_ICON_SIZE_RATIO } from './HexTileFace'
import { IssueSymbol } from './IssueSymbol'

const SLOT_GROUND_COLOR = '#151E2E'
const SLOT_EDGE_COLOR = '#334155'
const SLOT_GUIDE_COLOR = '#3E4C63'
/** A wash of the district's colour: strong enough to read as the same issue, dark enough for the round badge to pop. */
const SLOT_DISTRICT_WASH_OPACITY = 0.34
const HUB_GROUND_COLOR = '#101828'
const HUB_EMBLEM_GROUND_COLOR = '#1E293B'
const HUB_EMBLEM_INNER_COLOR = '#0F172A'
const HUB_EMBLEM_SCALE = 1.5
const ROUND_BADGE_RADIUS = 30
const PIP_RADIUS = 5.5

// Dice pips, not a printed digit: a dot count is recognised at a glance and works without telling colours apart.
const PIP_OFFSET = 13
const PIP_LAYOUTS: Readonly<Record<Round, readonly (readonly [number, number])[]>> = {
  1: [[0, 0]],
  2: [[-PIP_OFFSET, -PIP_OFFSET], [PIP_OFFSET, PIP_OFFSET]],
  3: [[-PIP_OFFSET, -PIP_OFFSET], [0, 0], [PIP_OFFSET, PIP_OFFSET]],
  4: [[-PIP_OFFSET, -PIP_OFFSET], [PIP_OFFSET, -PIP_OFFSET], [-PIP_OFFSET, PIP_OFFSET], [PIP_OFFSET, PIP_OFFSET]],
  5: [
    [-PIP_OFFSET, -PIP_OFFSET],
    [PIP_OFFSET, -PIP_OFFSET],
    [0, 0],
    [-PIP_OFFSET, PIP_OFFSET],
    [PIP_OFFSET, PIP_OFFSET],
  ],
}

// All cell art is drawn around the origin; the caller translates it to the cell.
const FACE_POINTS = hexPointsAt(0, 0, BOARD_CELL_FACE_RADIUS)

/** The printed cell at the head of a district: its issue colour and symbol. */
export function PrintedCellArt({ issue }: { issue: Issue }) {
  const glyphSize = BOARD_CELL_FACE_RADIUS * FACE_ICON_SIZE_RATIO
  const glyphCenterY = -BOARD_CELL_FACE_RADIUS * FACE_ICON_RISE_RATIO
  return (
    <g>
      <polygon points={FACE_POINTS} fill={ISSUE_FILL[issue]} stroke={ISSUE_DEEP[issue]} strokeWidth="4" />
      <polygon
        points={hexPointsAt(0, 0, BOARD_CELL_FACE_RADIUS - 13)}
        fill="none"
        stroke={ISSUE_DEEP[issue]}
        strokeWidth="3.5"
        strokeOpacity="0.6"
      />
      {/* Up near the top point, where a tile's face icon sits. */}
      <g transform={`translate(${-glyphSize / 2}, ${glyphCenterY - glyphSize / 2})`}>
        <IssueSymbol issue={issue} size={glyphSize} />
      </g>
    </g>
  )
}

/** A district slot: dark, washed with the district colour, badged with the round it takes (as dice pips). */
export function SlotCellArt({ issue, round }: { issue: Issue; round: Round }) {
  return (
    <g>
      <polygon points={FACE_POINTS} fill={SLOT_GROUND_COLOR} stroke={SLOT_EDGE_COLOR} strokeWidth="3" />
      <polygon points={FACE_POINTS} fill={ISSUE_FILL[issue]} fillOpacity={SLOT_DISTRICT_WASH_OPACITY} />
      <polygon
        points={hexPointsAt(0, 0, BOARD_CELL_FACE_RADIUS - 19)}
        fill="none"
        stroke={SLOT_GUIDE_COLOR}
        strokeWidth="2.5"
        strokeDasharray="10 9"
      />
      <circle r={ROUND_BADGE_RADIUS} fill={ISSUE_FILL[issue]} stroke={ISSUE_DEEP[issue]} strokeWidth="3" />
      {PIP_LAYOUTS[round].map(([x, y], index) => (
        <circle key={index} cx={x} cy={y} r={PIP_RADIUS} fill={ISSUE_INK[issue]} />
      ))}
    </g>
  )
}

/** The hub carries the deck-back bee, wordless. */
export function HubCellArt() {
  return (
    <g>
      <polygon points={FACE_POINTS} fill={HUB_GROUND_COLOR} stroke={GOLD_FILL} strokeWidth="6" />
      <g transform={`scale(${HUB_EMBLEM_SCALE})`}>
        <polygon
          points="0,-50 43,-25 43,25 0,50 -43,25 -43,-25"
          fill={HUB_EMBLEM_GROUND_COLOR}
          stroke={GOLD_FILL}
          strokeWidth="2"
        />
        <circle r="32" fill={HUB_EMBLEM_INNER_COLOR} stroke={GOLD_FILL} strokeWidth="1.5" />
        <g transform="translate(-24, -25)">
          <BeeMark size={48} bodyColor={GOLD_FILL} stripeColor={HUB_EMBLEM_INNER_COLOR} />
        </g>
      </g>
    </g>
  )
}
