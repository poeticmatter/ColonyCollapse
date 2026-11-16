import type { KeyboardEvent, ReactNode } from 'react'
import { hexPointsAt } from '../board/geometry'
import { GOLD_DEEP, GOLD_FILL, ISSUE_DEEP, ISSUE_FILL, ISSUE_INK } from '../board/palette'
import {
  RONDEL_BADGE_GAP,
  RONDEL_BADGE_RADIUS,
  RONDEL_DIAL_RADIUS,
  RONDEL_HEX_APOTHEM,
  RONDEL_HEX_RADIUS,
  RONDEL_MARK_ANGLE_DEGREES,
  RONDEL_MARK_OUTER_RADIUS,
  RONDEL_SIZE,
  RONDEL_SLOTS,
  RONDEL_SLOT_COUNT,
  type RondelSlot,
} from '../board/rondel'
import { DIAL_TOKEN_DISC_RADIUS, DIAL_TOKEN_VIEWBOX_SIZE, DialToken } from './DialToken'
import { hexTileSizeForRadius } from './HexTileFace'
import { IssueSymbol } from './IssueSymbol'

const GROUND_COLOR = '#0F1626'
const SLOT_GROUND_COLOR = '#151E2E'
const SLOT_EDGE_COLOR = '#334155'
const GUIDE_COLOR = '#3E4C63'
const NOTCH_COLOR = '#5C6578'
const DIAL_SOCKET_COLOR = '#0F172A'
const DIAL_PIVOT_COLOR = '#0A0F1D'
const DIAL_PIVOT_HUB_COLOR = '#94A3B8'
const HIGHLIGHT_FILL_OPACITY = 0.16
const HIGHLIGHT_OUTSET = 4

const MARK_WIDTH = 7
const MARK_FLAG_RADIUS = 16

const ARROW_CLEARANCE = 9
const ARROW_HEAD = { length: 12, halfWidth: 8 }
const ARROW_SHAFT_HALF_WIDTH = 2

/** Side of the square a HexTileFace needs to fill a rondel slot; wrap it in `Centered` to place it. */
export const RONDEL_TILE_SIZE = hexTileSizeForRadius(RONDEL_HEX_RADIUS - 14)

const DIAL_SCALE = RONDEL_DIAL_RADIUS / DIAL_TOKEN_DISC_RADIUS
const DIAL_SIZE = DIAL_TOKEN_VIEWBOX_SIZE * DIAL_SCALE

function pointOnRay(radius: number, angleDegrees: number) {
  const angle = (angleDegrees * Math.PI) / 180
  return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) }
}

/** An arrow in a slot's own frame (origin at the hex centre, +x pointing outward), spanning the gap to its badge. */
const SLOT_ARROW_POINTS = (() => {
  const tailX = RONDEL_HEX_APOTHEM + ARROW_CLEARANCE
  const tipX = RONDEL_HEX_APOTHEM + RONDEL_BADGE_GAP - ARROW_CLEARANCE
  const headBaseX = tipX - ARROW_HEAD.length
  const vertices: [number, number][] = [
    [tailX, -ARROW_SHAFT_HALF_WIDTH],
    [headBaseX, -ARROW_SHAFT_HALF_WIDTH],
    [headBaseX, -ARROW_HEAD.halfWidth],
    [tipX, 0],
    [headBaseX, ARROW_HEAD.halfWidth],
    [headBaseX, ARROW_SHAFT_HALF_WIDTH],
    [tailX, ARROW_SHAFT_HALF_WIDTH],
  ]
  return vertices.map(([x, y]) => `${x.toFixed(2)},${y}`).join(' ')
})()

function activateOnEnterOrSpace(event: KeyboardEvent, activate: () => void) {
  if (event.key !== 'Enter' && event.key !== ' ') return
  event.preventDefault()
  activate()
}

function SlotBadge({ slot }: { slot: RondelSlot }) {
  const iconSize = RONDEL_BADGE_RADIUS * 0.85
  return (
    <g transform={`translate(${slot.badgeCenter.x}, ${slot.badgeCenter.y})`}>
      <circle r={RONDEL_BADGE_RADIUS} fill={ISSUE_FILL[slot.issue]} stroke={ISSUE_DEEP[slot.issue]} strokeWidth="3.5" />
      <g transform={`translate(${-iconSize / 2}, ${-iconSize / 2})`}>
        <IssueSymbol issue={slot.issue} size={iconSize} color={ISSUE_INK[slot.issue]} />
      </g>
    </g>
  )
}

function DialSocket() {
  return (
    <g>
      <circle r={RONDEL_DIAL_RADIUS} fill={DIAL_SOCKET_COLOR} stroke={SLOT_EDGE_COLOR} strokeWidth="4" />
      <circle r={RONDEL_DIAL_RADIUS - 12} fill="none" stroke={GUIDE_COLOR} strokeWidth="2" strokeDasharray="6 5" />
      {RONDEL_SLOTS.map((slot) => {
        const inner = pointOnRay(RONDEL_DIAL_RADIUS - 20, slot.angleDegrees)
        const outer = pointOnRay(RONDEL_DIAL_RADIUS - 4, slot.angleDegrees)
        return (
          <line
            key={slot.index}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            stroke={NOTCH_COLOR}
            strokeWidth="3"
            strokeLinecap="round"
          />
        )
      })}
      <circle r={14} fill={DIAL_PIVOT_COLOR} stroke={NOTCH_COLOR} strokeWidth="2.5" />
      <circle r={4.5} fill={DIAL_PIVOT_HUB_COLOR} />
    </g>
  )
}

/** The mark between the last slot and slot 1: the dial passing it ends the round. */
function RoundMark() {
  const inner = pointOnRay(RONDEL_DIAL_RADIUS + 4, RONDEL_MARK_ANGLE_DEGREES)
  const outer = pointOnRay(RONDEL_MARK_OUTER_RADIUS, RONDEL_MARK_ANGLE_DEGREES)
  return (
    <g pointerEvents="none">
      <title>The mark: when the dial passes it, the round ends</title>
      <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke={GOLD_DEEP} strokeWidth={MARK_WIDTH + 3} strokeLinecap="round" />
      <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke={GOLD_FILL} strokeWidth={MARK_WIDTH} strokeLinecap="round" />
      <circle cx={outer.x} cy={outer.y} r={MARK_FLAG_RADIUS} fill={GOLD_FILL} stroke={GOLD_DEEP} strokeWidth="4" />
    </g>
  )
}

interface RondelViewProps {
  /** A piece drawn in a slot, as SVG around the slot's centre (use `Centered` to place a sized piece). */
  slotContent?: (slotIndex: number) => ReactNode
  /** Which slot the dial points at, 0 to 5, clockwise. */
  pointerPosition: number
  onSlotClick?: (slotIndex: number) => void
  highlightedSlots?: ReadonlySet<number>
  className?: string
}

/** The tile rondel: six slots around a dial that points at the active one. Scales to its container's width. */
export function RondelView({ slotContent, pointerPosition, onSlotClick, highlightedSlots, className }: RondelViewProps) {
  const pointerSlot = RONDEL_SLOTS[((pointerPosition % RONDEL_SLOT_COUNT) + RONDEL_SLOT_COUNT) % RONDEL_SLOT_COUNT]
  // The token is drawn pointing up; the slot angles are measured from the +x axis.
  const dialRotationDegrees = (pointerSlot?.angleDegrees ?? 0) + 90
  return (
    <svg
      viewBox={`0 0 ${RONDEL_SIZE} ${RONDEL_SIZE}`}
      className={`block h-auto w-full select-none ${className ?? ''}`}
      role="group"
      aria-label="Tile rondel"
    >
      <rect width={RONDEL_SIZE} height={RONDEL_SIZE} fill={GROUND_COLOR} />
      <g transform={`translate(${RONDEL_SIZE / 2}, ${RONDEL_SIZE / 2})`}>
        {RONDEL_SLOTS.map((slot) => {
          const rayStart = pointOnRay(RONDEL_DIAL_RADIUS, slot.angleDegrees)
          const rayEnd = pointOnRay(Math.hypot(slot.hexCenter.x, slot.hexCenter.y) - RONDEL_HEX_APOTHEM - 4, slot.angleDegrees)
          return (
            <line
              key={slot.index}
              x1={rayStart.x}
              y1={rayStart.y}
              x2={rayEnd.x}
              y2={rayEnd.y}
              stroke={SLOT_EDGE_COLOR}
              strokeWidth="2.5"
              strokeDasharray="4 4"
            />
          )
        })}

        <DialSocket />

        {RONDEL_SLOTS.map((slot) => (
          <g key={slot.index} transform={`translate(${slot.hexCenter.x}, ${slot.hexCenter.y})`}>
            <polygon points={hexPointsAt(0, 0, RONDEL_HEX_RADIUS)} fill={SLOT_GROUND_COLOR} stroke={SLOT_EDGE_COLOR} strokeWidth="4" />
            <polygon
              points={hexPointsAt(0, 0, RONDEL_HEX_RADIUS - 16)}
              fill="none"
              stroke={GUIDE_COLOR}
              strokeWidth="2.5"
              strokeDasharray="10 9"
            />
            <g transform={`rotate(${slot.angleDegrees})`} fill={ISSUE_FILL[slot.issue]}>
              <polygon points={SLOT_ARROW_POINTS} />
            </g>
            {slotContent?.(slot.index)}
          </g>
        ))}

        <RoundMark />

        {RONDEL_SLOTS.map((slot) => (
          <SlotBadge key={slot.index} slot={slot} />
        ))}

        <g transform={`rotate(${dialRotationDegrees})`}>
          <g transform={`translate(${-DIAL_SIZE / 2}, ${-DIAL_SIZE / 2})`}>
            <DialToken size={DIAL_SIZE} />
          </g>
        </g>

        {highlightedSlots &&
          RONDEL_SLOTS.filter((slot) => highlightedSlots.has(slot.index)).map((slot) => (
            <polygon
              key={slot.index}
              points={hexPointsAt(slot.hexCenter.x, slot.hexCenter.y, RONDEL_HEX_RADIUS + HIGHLIGHT_OUTSET)}
              fill={GOLD_FILL}
              fillOpacity={HIGHLIGHT_FILL_OPACITY}
              stroke={GOLD_FILL}
              strokeWidth="6"
              strokeLinejoin="round"
              pointerEvents="none"
            />
          ))}

        {onSlotClick &&
          RONDEL_SLOTS.map((slot) => (
            <polygon
              key={slot.index}
              points={hexPointsAt(slot.hexCenter.x, slot.hexCenter.y, RONDEL_HEX_RADIUS)}
              fill="transparent"
              className="cursor-pointer outline-none focus-visible:stroke-white focus-visible:stroke-[4px]"
              role="button"
              tabIndex={0}
              aria-label={`${slot.issue} rondel slot`}
              onClick={() => onSlotClick(slot.index)}
              onKeyDown={(event) => activateOnEnterOrSpace(event, () => onSlotClick(slot.index))}
            />
          ))}
      </g>
    </svg>
  )
}
