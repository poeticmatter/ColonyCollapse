import { Triangle, type LucideIcon } from 'lucide-react'
import {
  GOLD_DEEP,
  GOLD_FILL,
  GOLD_INK,
  ISSUE_DEEP,
  ISSUE_FILL,
  ISSUE_INK,
  ISSUE_MID,
  type Issue,
  type PlayerColor,
} from '../board/palette'
import {
  TRACK_SPACES,
  TRACK_START,
  TRACK_UPGRADE_SPACE,
  clampToTrack,
  formatTrackSpace,
  isRedZoneSpace,
} from '../board/track'
import { BeeMark } from './BeeMark'
import { IssueSymbol } from './IssueSymbol'

export interface TrackPosition {
  seat: number
  position: number
}

export type TrackOrientation = 'horizontal' | 'vertical'

// One space is CELL_WIDTH x CELL_HEIGHT design units: a label band on top, markers below.
const CELL_WIDTH = 64
const CELL_HEIGHT = 72
const BAND_HEIGHT = 28
const BADGE_RADIUS = 11
const BADGE_INSET = BADGE_RADIUS + 5
const MARKER_RADIUS = 8.5
const MARKER_SPACING = 19
const RED_ZONE_COLOR = '#B3261E'
const RED_ZONE_TINT_OPACITY = 0.35
const RED_RULE_WIDTH = 4
const NUMERAL_COLOR = '#FBF3E4'
const HEADER_ICON_SIZE = 36
const UPGRADE_ICON_SIZE = 14
const DEFAULT_CELL_WIDTH_PX = 40

interface Offset {
  x: number
  y: number
}

/** Marker centres, relative to the middle of the marker area, for `count` stacked markers (rows of up to 3). */
export function getMarkerOffsets(count: number): Offset[] {
  const columns = Math.ceil(Math.sqrt(count))
  const rowCount = Math.ceil(count / columns)
  return Array.from({ length: count }, (_, index) => {
    const row = Math.floor(index / columns)
    const markersInRow = Math.min(columns, count - row * columns)
    const column = index % columns
    return {
      x: (column - (markersInRow - 1) / 2) * MARKER_SPACING,
      y: (row - (rowCount - 1) / 2) * MARKER_SPACING,
    }
  })
}

function getSpaceFill(issue: Issue, space: number): string {
  return space % 2 === 0 ? ISSUE_FILL[issue] : ISSUE_MID[issue]
}

interface SpaceBadgeProps {
  issue: Issue
  space: number
  upgradeIcon?: LucideIcon
}

/** The small badge in a space's label band: the bee at the start, the upgrade spot. */
function SpaceBadge({ issue, space, upgradeIcon: UpgradeIcon }: SpaceBadgeProps) {
  if (space === TRACK_UPGRADE_SPACE) {
    return (
      <g>
        <circle r={BADGE_RADIUS} fill={GOLD_FILL} stroke={GOLD_DEEP} strokeWidth="1.5" />
        <g transform={`translate(${-UPGRADE_ICON_SIZE / 2}, ${-UPGRADE_ICON_SIZE / 2})`}>
          {UpgradeIcon ? (
            <UpgradeIcon size={UPGRADE_ICON_SIZE} color={GOLD_INK} strokeWidth={2.4} aria-hidden />
          ) : (
            <Triangle size={UPGRADE_ICON_SIZE} fill={GOLD_INK} color={GOLD_INK} strokeWidth={0} aria-hidden />
          )}
        </g>
      </g>
    )
  }
  if (space === TRACK_START) {
    return (
      <g transform={`translate(${-BADGE_RADIUS}, ${-BADGE_RADIUS})`}>
        <BeeMark size={BADGE_RADIUS * 2} bodyColor={ISSUE_INK[issue]} stripeColor={getSpaceFill(issue, space)} />
      </g>
    )
  }
  return null
}

interface TrackSpaceProps extends SpaceBadgeProps {
  origin: Offset
  occupants: readonly TrackPosition[]
  colorOf: (seat: number) => PlayerColor
}

function TrackSpace({ issue, space, upgradeIcon, origin, occupants, colorOf }: TrackSpaceProps) {
  const markerOffsets = getMarkerOffsets(occupants.length)
  const markerAreaCenter = { x: CELL_WIDTH / 2, y: BAND_HEIGHT + (CELL_HEIGHT - BAND_HEIGHT) / 2 }
  return (
    <g transform={`translate(${origin.x}, ${origin.y})`}>
      <rect
        width={CELL_WIDTH}
        height={CELL_HEIGHT}
        fill={getSpaceFill(issue, space)}
        stroke={ISSUE_DEEP[issue]}
        strokeOpacity="0.4"
      />
      {isRedZoneSpace(space) && (
        <rect width={CELL_WIDTH} height={CELL_HEIGHT} fill={RED_ZONE_COLOR} opacity={RED_ZONE_TINT_OPACITY} />
      )}
      <circle cx={BADGE_INSET} cy={BAND_HEIGHT / 2} r={BADGE_RADIUS} fill={ISSUE_DEEP[issue]} />
      <text
        x={BADGE_INSET}
        y={BAND_HEIGHT / 2 + 4.5}
        textAnchor="middle"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontSize="13"
        fontWeight="800"
        fill={NUMERAL_COLOR}
      >
        {formatTrackSpace(space)}
      </text>
      <g transform={`translate(${CELL_WIDTH - BADGE_INSET}, ${BAND_HEIGHT / 2})`}>
        <SpaceBadge issue={issue} space={space} upgradeIcon={upgradeIcon} />
      </g>
      {occupants.map(({ seat }, index) => {
        const offset = markerOffsets[index] ?? { x: 0, y: 0 }
        const color = colorOf(seat)
        return (
          <g key={seat} transform={`translate(${markerAreaCenter.x + offset.x}, ${markerAreaCenter.y + offset.y})`}>
            <title>{`${color.name} (seat ${seat + 1}) at ${formatTrackSpace(space)}`}</title>
            <circle r={MARKER_RADIUS} fill={color.fill} stroke={color.deep} strokeWidth="2" />
            <text
              y="4"
              textAnchor="middle"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
              fontSize="11"
              fontWeight="800"
              fill={color.ink}
            >
              {seat + 1}
            </text>
          </g>
        )
      })}
    </g>
  )
}

function groupBySpace(positions: readonly TrackPosition[]): Map<number, TrackPosition[]> {
  const occupantsBySpace = new Map<number, TrackPosition[]>()
  for (const entry of positions) {
    const space = clampToTrack(entry.position)
    const occupants = [...(occupantsBySpace.get(space) ?? []), entry].sort((a, b) => a.seat - b.seat)
    occupantsBySpace.set(space, occupants)
  }
  return occupantsBySpace
}

interface IssueTrackProps {
  issue: Issue
  /** Where each player's marker is. Players on the same space are stacked. */
  positions: readonly TrackPosition[]
  colorOf: (seat: number) => PlayerColor
  orientation?: TrackOrientation
  /** The icon of the action tile that the +3 spot upgrades; a plain triangle when omitted. */
  upgradeIcon?: LucideIcon
  /** Rendered width of one space in pixels. */
  cellWidth?: number
}

/**
 * A compact strip for one issue's track, -2 to +4. Horizontal runs left to
 * right from -2; vertical runs top to bottom from +4, like the printed board.
 */
export function IssueTrack({
  issue,
  positions,
  colorOf,
  orientation = 'horizontal',
  upgradeIcon,
  cellWidth = DEFAULT_CELL_WIDTH_PX,
}: IssueTrackProps) {
  const isHorizontal = orientation === 'horizontal'
  const spacesInReadingOrder = isHorizontal ? TRACK_SPACES : [...TRACK_SPACES].reverse()
  // The issue header takes the first cell.
  const cellCount = spacesInReadingOrder.length + 1
  const viewWidth = isHorizontal ? cellCount * CELL_WIDTH : CELL_WIDTH
  const viewHeight = isHorizontal ? CELL_HEIGHT : cellCount * CELL_HEIGHT
  const scale = cellWidth / CELL_WIDTH
  const occupantsBySpace = groupBySpace(positions)

  const originOfCell = (cellIndex: number): Offset =>
    isHorizontal ? { x: cellIndex * CELL_WIDTH, y: 0 } : { x: 0, y: cellIndex * CELL_HEIGHT }

  // The red rule runs along the boundary between the start space and the red zone below it:
  // the start space's left edge when horizontal, its bottom edge when vertical.
  const startCellIndex = spacesInReadingOrder.indexOf(TRACK_START) + 1
  const ruleOffset = isHorizontal ? startCellIndex * CELL_WIDTH : (startCellIndex + 1) * CELL_HEIGHT
  const rule = isHorizontal
    ? { x1: ruleOffset, y1: 0, x2: ruleOffset, y2: CELL_HEIGHT }
    : { x1: 0, y1: ruleOffset, x2: CELL_WIDTH, y2: ruleOffset }

  return (
    <svg
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      width={viewWidth * scale}
      height={viewHeight * scale}
      className="block select-none"
      role="img"
      aria-label={`${issue} issue track`}
    >
      <title>{`${issue} track`}</title>
      <rect width={CELL_WIDTH} height={CELL_HEIGHT} fill={ISSUE_FILL[issue]} stroke={ISSUE_DEEP[issue]} strokeWidth="2" />
      <g transform={`translate(${(CELL_WIDTH - HEADER_ICON_SIZE) / 2}, ${(CELL_HEIGHT - HEADER_ICON_SIZE) / 2})`}>
        <IssueSymbol issue={issue} size={HEADER_ICON_SIZE} />
      </g>
      {spacesInReadingOrder.map((space, index) => (
        <TrackSpace
          key={space}
          issue={issue}
          space={space}
          upgradeIcon={upgradeIcon}
          origin={originOfCell(index + 1)}
          occupants={occupantsBySpace.get(space) ?? []}
          colorOf={colorOf}
        />
      ))}
      <line {...rule} stroke={RED_ZONE_COLOR} strokeWidth={RED_RULE_WIDTH} />
    </svg>
  )
}
