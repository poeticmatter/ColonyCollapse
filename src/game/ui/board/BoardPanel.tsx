import { useMemo } from 'react'
import { BOARD_DISC_SIZE, BOARD_TILE_SIZE, BoardView } from '../../art/BoardView'
import { Centered } from '../../art/Centered'
import { PlayerDisc } from '../../art/PlayerDisc'
import { PlayerPawn } from '../../art/PlayerPawn'
import { BOARD_CELL_FACE_RADIUS, getCellInfo, hexPointsAt, HUB_CELL_KEY, type CellKey } from '../../board/geometry'
import { cellView, districtStandings, type DistrictStanding } from '../../rules'
import { useBoard } from '../context'
import { Panel } from '../Panel'
import { useSpatialSelection } from '../spatial'
import { pawnOffsets } from './pawnLayout'
import { TileFace } from './tileFaces'
import { DistrictBadge } from './DistrictBadge'

const PAWN_SIZE = 44
const SELECTED_STROKE = '#FFFFFF'

function CellOutline({ dash }: { dash?: string }) {
  return (
    <polygon
      points={hexPointsAt(0, 0, BOARD_CELL_FACE_RADIUS + 2)}
      fill="none"
      stroke={SELECTED_STROKE}
      strokeWidth={dash ? 4 : 7}
      strokeDasharray={dash}
      strokeLinejoin="round"
      pointerEvents="none"
    />
  )
}

/** The hex board with tiles, discs, pawns, district standings and whatever the active decision highlights. */
export function BoardPanel() {
  const { state, colorOf } = useBoard()
  const selection = useSpatialSelection()
  const standings = useMemo(() => districtStandings(state), [state])
  const standingByIssue = useMemo(
    () => new Map<string, DistrictStanding>(standings.map((standing) => [standing.issue, standing])),
    [standings],
  )

  const handleCellClick = selection.onCellClick
  const onCellClick = handleCellClick
    ? (cell: CellKey) => {
        if (selection.clickableCells.has(cell)) handleCellClick(cell)
      }
    : undefined

  const renderCell = (cell: CellKey) => {
    const view = cellView(state, cell)
    const info = getCellInfo(cell)
    const pawns = state.pawns.filter((pawn) => pawn.cell === cell)
    const offsets = pawnOffsets(pawns.length, cell === HUB_CELL_KEY)
    const standing = info.kind === 'printed' ? standingByIssue.get(info.district) : undefined
    return (
      <>
        {view.tile && (
          <Centered size={BOARD_TILE_SIZE}>
            <TileFace tile={view.tile} size={BOARD_TILE_SIZE} />
          </Centered>
        )}
        {view.disc !== null && (
          <Centered size={BOARD_DISC_SIZE}>
            <PlayerDisc color={colorOf(view.disc)} size={BOARD_DISC_SIZE} />
          </Centered>
        )}
        {standing && state.phase !== 'over' && <DistrictBadge standing={standing} round={state.round} />}
        {pawns.map((pawn, index) => (
          <g key={pawn.id} transform={`translate(${offsets[index].x}, ${offsets[index].y})`}>
            <Centered size={PAWN_SIZE}>
              <PlayerPawn color={colorOf(pawn.seat)} size={PAWN_SIZE} />
            </Centered>
          </g>
        ))}
        {selection.previewCells.has(cell) && <CellOutline dash="10 8" />}
        {selection.selectedCells.has(cell) && <CellOutline />}
      </>
    )
  }

  return (
    <Panel title="Board" className="overflow-hidden">
      <BoardView
        cellContent={renderCell}
        highlightedCells={selection.clickableCells}
        onCellClick={onCellClick}
      />
    </Panel>
  )
}
