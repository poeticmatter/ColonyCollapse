import type { KeyboardEvent, ReactNode } from 'react'
import {
  BOARD_CELLS,
  BOARD_CELL_FACE_RADIUS,
  BOARD_VIEWBOX,
  getCellInfo,
  hexPointsAt,
  type CellInfo,
  type CellKey,
} from '../board/geometry'
import { GOLD_FILL } from '../board/palette'
import { HubCellArt, PrintedCellArt, SlotCellArt } from './BoardCells'
import { hexTileSizeForRadius } from './HexTileFace'
import { ParkBorders } from './ParkBorders'

const BOARD_GROUND_COLOR = '#0F1626'
const HIGHLIGHT_OUTSET = 5
const HIGHLIGHT_FILL_OPACITY = 0.16

/** Side of the square a HexTileFace needs to fill a board cell; wrap it in `Centered` to place it. */
export const BOARD_TILE_SIZE = hexTileSizeForRadius(BOARD_CELL_FACE_RADIUS)
/** A control disc sits in the middle of a tile, clear of its face icon and badge. */
export const BOARD_DISC_SIZE = 64
export const BOARD_PAWN_SIZE = 56

function describeCell(info: CellInfo): string {
  if (info.kind === 'hub') return 'Hub'
  if (info.kind === 'printed') return `${info.district} centre hex`
  return `${info.district} district, round ${info.round} slot`
}

function CellArt({ info }: { info: CellInfo }) {
  if (info.kind === 'hub') return <HubCellArt />
  if (info.kind === 'printed') return <PrintedCellArt issue={info.district} />
  return <SlotCellArt issue={info.district} round={info.round} />
}

function activateOnEnterOrSpace(event: KeyboardEvent, activate: () => void) {
  if (event.key !== 'Enter' && event.key !== ' ') return
  event.preventDefault()
  activate()
}

interface BoardViewProps {
  /**
   * Pieces drawn on a cell, as SVG, around the cell's centre (use `Centered` to
   * place a sized piece in the middle). Drawn above the printed cell and the park borders.
   */
  cellContent?: (cellKey: CellKey) => ReactNode
  onCellClick?: (cellKey: CellKey) => void
  highlightedCells?: ReadonlySet<CellKey>
  className?: string
}

/** The hex board. Scales to its container's width; the height follows the board's aspect ratio. */
export function BoardView({ cellContent, onCellClick, highlightedCells, className }: BoardViewProps) {
  const centerX = BOARD_VIEWBOX.width / 2
  const centerY = BOARD_VIEWBOX.height / 2
  return (
    <svg
      viewBox={`0 0 ${BOARD_VIEWBOX.width} ${BOARD_VIEWBOX.height}`}
      className={`block h-auto w-full select-none ${className ?? ''}`}
      role="group"
      aria-label="Colony board"
    >
      <rect width={BOARD_VIEWBOX.width} height={BOARD_VIEWBOX.height} fill={BOARD_GROUND_COLOR} />
      <g transform={`translate(${centerX}, ${centerY})`}>
        {BOARD_CELLS.map((cell) => (
          <g key={cell.key} transform={`translate(${cell.x}, ${cell.y})`}>
            <CellArt info={getCellInfo(cell.key)} />
          </g>
        ))}

        <ParkBorders />

        {cellContent &&
          BOARD_CELLS.map((cell) => (
            <g key={cell.key} transform={`translate(${cell.x}, ${cell.y})`}>
              {cellContent(cell.key)}
            </g>
          ))}

        {highlightedCells &&
          BOARD_CELLS.filter((cell) => highlightedCells.has(cell.key)).map((cell) => (
            <polygon
              key={cell.key}
              points={hexPointsAt(cell.x, cell.y, BOARD_CELL_FACE_RADIUS + HIGHLIGHT_OUTSET)}
              fill={GOLD_FILL}
              fillOpacity={HIGHLIGHT_FILL_OPACITY}
              stroke={GOLD_FILL}
              strokeWidth="6"
              strokeLinejoin="round"
              pointerEvents="none"
            />
          ))}

        {onCellClick &&
          BOARD_CELLS.map((cell) => (
            <polygon
              key={cell.key}
              points={hexPointsAt(cell.x, cell.y, BOARD_CELL_FACE_RADIUS)}
              fill="transparent"
              className="cursor-pointer outline-none focus-visible:stroke-white focus-visible:stroke-[4px]"
              role="button"
              tabIndex={0}
              aria-label={describeCell(getCellInfo(cell.key))}
              onClick={() => onCellClick(cell.key)}
              onKeyDown={(event) => activateOnEnterOrSpace(event, () => onCellClick(cell.key))}
            />
          ))}
      </g>
    </svg>
  )
}
