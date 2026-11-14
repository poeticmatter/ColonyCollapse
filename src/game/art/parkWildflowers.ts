import type { BorderSegment, Point } from '../board/geometry'

/**
 * Wildflower patches along a park strip. Each patch is an imaginary circle
 * centred on one edge of the grass, alternating sides along the border; its
 * dots crowd near the centre and thin out toward the rim, and only dots that
 * land on the grass are kept, so patches never spill onto the cells. Seeded,
 * so every render is identical.
 */

export const PARK_GRASS_WIDTH = 21
const PARK_GRASS_HALF_WIDTH = PARK_GRASS_WIDTH / 2
const PATCH_COLORS = ['#FFF6E5', '#F4A9C8', '#FFD447', '#C7B4F0', '#F28C6B']
const PATCH_RADIUS = 16
/** Neighbouring circles sit on opposite edges; centres this fraction of a diameter apart overlap slightly. */
const PATCH_OVERLAP_SPACING = 0.9
const PATCH_STEP = Math.sqrt((2 * PATCH_RADIUS * PATCH_OVERLAP_SPACING) ** 2 - PARK_GRASS_WIDTH ** 2)
/** Before trimming the dots that fall off the grass. */
const PATCH_DOT_COUNT = 90
/** The solid half-disc at the heart of each patch, on the grass edge. */
const PATCH_CORE_RADIUS = 2.5
const DOT_RADIUS = { heart: 1.4, rim: 0.7 }
/** Raising a uniform 0-1 draw to this power bunches dots toward the centre. */
const DOT_CLUSTERING = 1.6

export interface WildflowerPatch {
  color: string
  /** SVG path data: the core half-disc plus every dot as a tiny circle, in the segment's own frame. */
  path: string
}

export interface SegmentWildflowers {
  origin: Point
  angleDegrees: number
  patches: readonly WildflowerPatch[]
}

/** Mulberry32, a tiny seeded PRNG. */
function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state)
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296
  }
}

interface Dot extends Point {
  radius: number
}

function isOnGrass(dot: Dot, segmentLength: number): boolean {
  return Math.abs(dot.y) <= PARK_GRASS_HALF_WIDTH - dot.radius && dot.x >= 0 && dot.x <= segmentLength
}

/** Dots in the segment's own frame: x runs along the border from its start, y across it from the centre line. */
function buildPatchDots(random: () => number, center: Point, segmentLength: number): Dot[] {
  return Array.from({ length: PATCH_DOT_COUNT }, () => {
    const radiusFraction = random() ** DOT_CLUSTERING
    const angle = random() * 2 * Math.PI
    return {
      x: center.x + Math.cos(angle) * radiusFraction * PATCH_RADIUS,
      y: center.y + Math.sin(angle) * radiusFraction * PATCH_RADIUS,
      radius: DOT_RADIUS.heart + (DOT_RADIUS.rim - DOT_RADIUS.heart) * radiusFraction,
    }
  }).filter((dot) => isOnGrass(dot, segmentLength))
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}

function circlePath({ x, y, radius }: Dot): string {
  const diameter = round(radius * 2)
  return `M${round(x - radius)} ${round(y)}a${round(radius)} ${round(radius)} 0 1 0 ${diameter} 0a${round(radius)} ${round(radius)} 0 1 0 ${-diameter} 0`
}

/** Half disc bulging from the grass edge toward the strip's centre line. */
function coreHalfDiscPath(center: Point, side: -1 | 1): string {
  const sweepFlag = side > 0 ? 1 : 0
  const left = round(center.x - PATCH_CORE_RADIUS)
  const right = round(center.x + PATCH_CORE_RADIUS)
  return `M${left} ${center.y}A${PATCH_CORE_RADIUS} ${PATCH_CORE_RADIUS} 0 0 ${sweepFlag} ${right} ${center.y}Z`
}

export function buildSegmentWildflowers(segment: BorderSegment, segmentIndex: number): SegmentWildflowers {
  const { from, to } = segment
  const random = createSeededRandom(segmentIndex + 1)
  const segmentLength = Math.hypot(to.x - from.x, to.y - from.y)
  const patchCount = Math.floor(segmentLength / PATCH_STEP)
  const firstPatchX = (segmentLength - (patchCount - 1) * PATCH_STEP) / 2

  let previousColorIndex = -1
  const patches = Array.from({ length: patchCount }, (_, patchIndex): WildflowerPatch => {
    const side = patchIndex % 2 === 0 ? -1 : 1
    // Overlapping neighbours never share a colour, or they would merge into one blob.
    const colorOffset = 1 + Math.floor(random() * (PATCH_COLORS.length - 1))
    const colorIndex =
      previousColorIndex < 0
        ? Math.floor(random() * PATCH_COLORS.length)
        : (previousColorIndex + colorOffset) % PATCH_COLORS.length
    previousColorIndex = colorIndex
    const center = { x: firstPatchX + patchIndex * PATCH_STEP, y: side * PARK_GRASS_HALF_WIDTH }
    const dots = buildPatchDots(random, center, segmentLength)
    return {
      color: PATCH_COLORS[colorIndex] ?? PATCH_COLORS[0] ?? '#FFFFFF',
      path: coreHalfDiscPath(center, side) + dots.map(circlePath).join(''),
    }
  })

  return {
    origin: from,
    angleDegrees: (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI,
    patches,
  }
}
