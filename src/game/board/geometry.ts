import { ISSUES, type Issue } from './palette'

/**
 * Board geometry: a hex-of-hexes with a hub and three rings (37 cells), split
 * into six irregular districts. Pointy-top hexes, axial coordinates, ported
 * from the prototype's default "irregular" layout. Pure data, no React.
 */

export interface AxialCoord {
  q: number
  r: number
}

export interface Point {
  x: number
  y: number
}

/** `"q,r"`, the stable identity of a board cell. */
export type CellKey = string

export type Round = 1 | 2 | 3 | 4 | 5

export const ROUNDS: readonly Round[] = [1, 2, 3, 4, 5]

export const BOARD_RINGS = 3

/** Circumradius of one grid cell. */
export const BOARD_CELL_RADIUS = 100

/** Printed faces are inset from their grid cell, leaving a gutter for the park borders. */
export const BOARD_CELL_FACE_RADIUS = BOARD_CELL_RADIUS - 14

export const BOARD_VIEWBOX = { width: 1400, height: 1250 } as const

export const HUB_CELL_KEY: CellKey = '0,0'

/** Edge i of a cell is shared with the neighbour in direction i. */
export const NEIGHBOR_DIRECTIONS: readonly AxialCoord[] = [
  { q: 1, r: -1 },
  { q: 1, r: 0 },
  { q: 0, r: 1 },
  { q: -1, r: 1 },
  { q: -1, r: 0 },
  { q: 0, r: -1 },
]

const HEX_CORNER_COUNT = 6
const HEX_CORNER_DEGREES = 60
/** Pointy-top: the first corner is straight up. */
const FIRST_CORNER_DEGREES = -90

export function toCellKey({ q, r }: AxialCoord): CellKey {
  return `${q},${r}`
}

export function parseCellKey(key: CellKey): AxialCoord {
  const [q, r] = key.split(',').map(Number)
  if (q === undefined || r === undefined || Number.isNaN(q) || Number.isNaN(r)) {
    throw new Error(`Malformed cell key "${key}"; expected "q,r"`)
  }
  return { q, r }
}

export function axialToPixel({ q, r }: AxialCoord, size: number): Point {
  return { x: size * Math.sqrt(3) * (q + r / 2), y: size * 1.5 * r }
}

export function hexDistanceFromHub({ q, r }: AxialCoord): number {
  return Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r))
}

export function neighbours(coord: AxialCoord): AxialCoord[] {
  return NEIGHBOR_DIRECTIONS.map((direction) => ({ q: coord.q + direction.q, r: coord.r + direction.r }))
}

export function hexVerticesAt(centerX: number, centerY: number, radius: number): Point[] {
  return Array.from({ length: HEX_CORNER_COUNT }, (_, index) => {
    const angle = (Math.PI / 180) * (HEX_CORNER_DEGREES * index + FIRST_CORNER_DEGREES)
    return { x: centerX + radius * Math.cos(angle), y: centerY + radius * Math.sin(angle) }
  })
}

/** SVG `points` attribute for a pointy-top hexagon. */
export function hexPointsAt(centerX: number, centerY: number, radius: number): string {
  return hexVerticesAt(centerX, centerY, radius)
    .map(({ x, y }) => `${x.toFixed(2)},${y.toFixed(2)}`)
    .join(' ')
}

type AxialTuple = readonly [q: number, r: number]

interface DistrictLayout {
  issue: Issue
  cells: readonly AxialTuple[]
}

/**
 * The shipped district shapes. Each district holds exactly one inner-ring
 * printed cell and five outer slots. Listed in `ISSUES` order.
 */
export const DISTRICT_LAYOUT: readonly DistrictLayout[] = [
  { issue: 'Clay', cells: [[1, -1], [2, -1], [2, -2], [3, -3], [1, -2], [0, -2]] },
  { issue: 'Sage', cells: [[1, 0], [3, -2], [2, 0], [3, 0], [3, -1], [2, 1]] },
  { issue: 'Periwinkle', cells: [[0, 1], [1, 1], [0, 2], [1, 2], [0, 3], [-1, 3]] },
  { issue: 'Stone', cells: [[-1, 1], [-2, 3], [-2, 1], [-1, 2], [-2, 2], [-3, 3]] },
  { issue: 'Seafoam', cells: [[-1, 0], [-3, 2], [-2, -1], [-2, 0], [-3, 0], [-3, 1]] },
  { issue: 'Mauve', cells: [[0, -1], [2, -3], [-1, -1], [1, -3], [0, -3], [-1, -2]] },
]

export interface BoardCell extends AxialCoord, Point {
  key: CellKey
}

export type CellInfo =
  | { kind: 'hub'; district: null }
  | { kind: 'printed'; district: Issue }
  | { kind: 'slot'; district: Issue; round: Round }

export interface District {
  issue: Issue
  /** The printed centre-ring cell, at distance 1 from the hub. */
  printedCell: CellKey
  /** The five slot cells; index 0 is the round-1 slot. */
  slotCells: readonly CellKey[]
}

export interface BorderSegment {
  from: Point
  to: Point
}

function buildBoardCells(): BoardCell[] {
  const cells: BoardCell[] = []
  for (let q = -BOARD_RINGS; q <= BOARD_RINGS; q += 1) {
    for (let r = -BOARD_RINGS; r <= BOARD_RINGS; r += 1) {
      if (Math.abs(q + r) > BOARD_RINGS) continue
      cells.push({ q, r, key: toCellKey({ q, r }), ...axialToPixel({ q, r }, BOARD_CELL_RADIUS) })
    }
  }
  return cells
}

export const BOARD_CELLS: readonly BoardCell[] = buildBoardCells()

const cellByKey: ReadonlyMap<CellKey, BoardCell> = new Map(BOARD_CELLS.map((cell) => [cell.key, cell]))

export function getBoardCell(key: CellKey): BoardCell {
  const cell = cellByKey.get(key)
  if (!cell) throw new Error(`No board cell "${key}"`)
  return cell
}

/** Neighbours that lie on the board. */
export function getNeighbourKeys(key: CellKey): CellKey[] {
  return neighbours(parseCellKey(key))
    .map(toCellKey)
    .filter((neighbourKey) => cellByKey.has(neighbourKey))
}

const districtIssueByKey: ReadonlyMap<CellKey, Issue> = new Map(
  DISTRICT_LAYOUT.flatMap((district) =>
    district.cells.map(([q, r]): [CellKey, Issue] => [toCellKey({ q, r }), district.issue]),
  ),
)

/**
 * A slot's round is its rank within the district: middle-ring cells before
 * outer-ring ones, then by angle around the hub, exactly as the printed board
 * numbers them.
 */
function orderSlotsByRound(slots: readonly BoardCell[]): BoardCell[] {
  const angleAroundHub = (cell: BoardCell) => Math.atan2(cell.y, cell.x)
  return [...slots].sort(
    (a, b) => hexDistanceFromHub(a) - hexDistanceFromHub(b) || angleAroundHub(a) - angleAroundHub(b),
  )
}

function buildDistrict(layout: DistrictLayout): District {
  const cells = layout.cells.map(([q, r]) => getBoardCell(toCellKey({ q, r })))
  const printedCells = cells.filter((cell) => hexDistanceFromHub(cell) === 1)
  const [printedCell] = printedCells
  if (printedCells.length !== 1 || !printedCell) {
    throw new Error(`District ${layout.issue} must have exactly one centre-ring cell`)
  }
  const slots = cells.filter((cell) => hexDistanceFromHub(cell) > 1)
  return {
    issue: layout.issue,
    printedCell: printedCell.key,
    slotCells: orderSlotsByRound(slots).map((cell) => cell.key),
  }
}

/** Districts in `ISSUES` order. */
export const DISTRICTS: readonly District[] = DISTRICT_LAYOUT.map(buildDistrict)

export function getDistrict(issue: Issue): District {
  const district = DISTRICTS[ISSUES.indexOf(issue)]
  if (!district) throw new Error(`No district for ${issue}`)
  return district
}

function buildCellInfoLookup(): ReadonlyMap<CellKey, CellInfo> {
  const lookup = new Map<CellKey, CellInfo>([[HUB_CELL_KEY, { kind: 'hub', district: null }]])
  for (const district of DISTRICTS) {
    lookup.set(district.printedCell, { kind: 'printed', district: district.issue })
    district.slotCells.forEach((slotKey, index) => {
      const round = ROUNDS[index]
      if (round === undefined) throw new Error(`District ${district.issue} has more slots than rounds`)
      lookup.set(slotKey, { kind: 'slot', district: district.issue, round })
    })
  }
  return lookup
}

export const CELL_INFO: ReadonlyMap<CellKey, CellInfo> = buildCellInfoLookup()

export function getCellInfo(key: CellKey): CellInfo {
  const info = CELL_INFO.get(key)
  if (!info) throw new Error(`No board cell "${key}"`)
  return info
}

/** The slot cell of `issue`'s district that round `round`'s tile lands on. */
export function getSlotCell(issue: Issue, round: Round): CellKey {
  const slotKey = getDistrict(issue).slotCells[round - 1]
  if (!slotKey) throw new Error(`No slot for round ${round}`)
  return slotKey
}

/**
 * Cell edges that separate a district from another district, the hub or the
 * board's rim: where the park strips are drawn. An edge shared by two
 * districts is seen from both sides; only one copy is kept.
 */
function buildBorderSegments(): BorderSegment[] {
  const segments: BorderSegment[] = []
  for (const cell of BOARD_CELLS) {
    const cellIssue = districtIssueByKey.get(cell.key)
    if (!cellIssue) continue
    const vertices = hexVerticesAt(cell.x, cell.y, BOARD_CELL_RADIUS)
    NEIGHBOR_DIRECTIONS.forEach((direction, edgeIndex) => {
      const neighbourIssue = districtIssueByKey.get(toCellKey({ q: cell.q + direction.q, r: cell.r + direction.r }))
      if (neighbourIssue === cellIssue) return
      const isSharedWithAnotherDistrict = neighbourIssue !== undefined
      const isOtherSidesCopy = edgeIndex >= NEIGHBOR_DIRECTIONS.length / 2
      if (isSharedWithAnotherDistrict && isOtherSidesCopy) return
      const from = vertices[edgeIndex]
      const to = vertices[(edgeIndex + 1) % HEX_CORNER_COUNT]
      if (from && to) segments.push({ from, to })
    })
  }
  return segments
}

export const DISTRICT_BORDER_SEGMENTS: readonly BorderSegment[] = buildBorderSegments()
