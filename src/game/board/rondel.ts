import { BOARD_CELL_RADIUS, type Point } from './geometry'
import { ISSUES, type Issue } from './palette'

/**
 * The tile rondel: six hex slots ringed around a central dial, one per issue,
 * each with a colour badge pointing outward. Slot i matches district i. Pure
 * data, ported from the prototype's display board.
 */

export const RONDEL_SLOT_COUNT = ISSUES.length

/** The dial starts every round on slot 1. */
export const DIAL_START_SLOT = 0
/** The mark sits between the last slot and slot 1: stepping off this slot passes it and ends the round. */
export const LAST_SLOT_BEFORE_MARK = RONDEL_SLOT_COUNT - 1

/** The same radius as a board cell, since a tile has to sit in both. */
export const RONDEL_HEX_RADIUS = BOARD_CELL_RADIUS
export const RONDEL_HEX_APOTHEM = (RONDEL_HEX_RADIUS * Math.sqrt(3)) / 2
const RONDEL_HEX_GAP = 12

/** Neighbouring slots sit flat side to flat side, so the ring radius is two apothems plus the gap. */
export const RONDEL_RING_RADIUS = 2 * RONDEL_HEX_APOTHEM + RONDEL_HEX_GAP

export const RONDEL_BADGE_RADIUS = 40
/** Wide enough for a short arrow from each slot out to its badge. */
export const RONDEL_BADGE_GAP = 46
export const RONDEL_DIAL_RADIUS = 75

const RONDEL_MARGIN = 30
const RONDEL_BADGE_RING_RADIUS = RONDEL_RING_RADIUS + RONDEL_HEX_APOTHEM + RONDEL_BADGE_GAP + RONDEL_BADGE_RADIUS

/** Whole pixels, so the viewBox is a clean size. */
export const RONDEL_SIZE = Math.ceil((RONDEL_BADGE_RING_RADIUS + RONDEL_BADGE_RADIUS + RONDEL_MARGIN) * 2)

/** The ring is turned 30 degrees clockwise from straight up so each slot lines up with its district. */
const RONDEL_ROTATION_DEGREES = 30
const DEGREES_BETWEEN_SLOTS = 60
const STRAIGHT_UP_DEGREES = -90

export interface RondelSlot {
  index: number
  issue: Issue
  /** Direction from the centre, in SVG degrees (0 is right, positive is clockwise on screen). */
  angleDegrees: number
  hexCenter: Point
  badgeCenter: Point
}

function pointOnRing(radius: number, angleDegrees: number): Point {
  const angle = (angleDegrees * Math.PI) / 180
  return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) }
}

/** Positions relative to the rondel's centre. Slots run clockwise from slot 0. */
export const RONDEL_SLOTS: readonly RondelSlot[] = ISSUES.map((issue, index) => {
  const angleDegrees = STRAIGHT_UP_DEGREES + RONDEL_ROTATION_DEGREES + DEGREES_BETWEEN_SLOTS * index
  return {
    index,
    issue,
    angleDegrees,
    hexCenter: pointOnRing(RONDEL_RING_RADIUS, angleDegrees),
    badgeCenter: pointOnRing(RONDEL_BADGE_RING_RADIUS, angleDegrees),
  }
})

/** The mark sits halfway between the last slot and slot 1. */
export const RONDEL_MARK_ANGLE_DEGREES = RONDEL_SLOTS[LAST_SLOT_BEFORE_MARK].angleDegrees + DEGREES_BETWEEN_SLOTS / 2

/** How far out from the centre the mark reaches: past the hexes, up to the badge ring. */
export const RONDEL_MARK_OUTER_RADIUS = RONDEL_BADGE_RING_RADIUS
