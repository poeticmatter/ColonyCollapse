import { useMemo } from 'react'
import { Button } from 'game-kit/turns'
import { HUB_CELL_KEY } from '../../board/geometry'
import { ACTION_COST, dialTile, isDialOnLastSlot, pawnOf, tileIssue, type Seat } from '../../rules'
import { useBoard } from '../context'
import { Panel } from '../Panel'
import { spatialSelection, useRegisterSpatialSelection } from '../spatial'
import { ActionPointPips } from '../ActionPointPips'
import { TileFace } from '../board/tileFaces'
import { ActionButton, IssueLabel } from './ActionButton'
import { ShiftPicker } from './ShiftPicker'
import { turnOptions } from './turnOptions'

const DIAL_TILE_SIZE_PX = 56

function hexCount(count: number): string {
  return `${count} ${count === 1 ? 'hex' : 'hexes'}`
}

function stopLabel(actionPoints: number): string {
  if (actionPoints === 0) return 'Stop here'
  return `Stop here (${actionPoints} unspent ${actionPoints === 1 ? 'point is' : 'points are'} lost)`
}

/** Shows the pawn's steps (clickable) and what rallying around it would take (dashed) on the board. */
function usePawnSelection(seat: Seat, pawnSteps: readonly string[], rallyGains: readonly string[]) {
  const { state, onMove } = useBoard()
  const pawnCell = pawnOf(state, seat).cell
  const selection = useMemo(
    () =>
      spatialSelection({
        clickableCells: new Set(pawnSteps),
        selectedCells: new Set([pawnCell]),
        previewCells: new Set(rallyGains),
        onCellClick: (to) => onMove({ type: 'movePawn', to }),
      }),
    [pawnSteps, rallyGains, pawnCell, onMove],
  )
  useRegisterSpatialSelection(selection)
}

function DialTileActions({ canRally, canAddress }: { canRally: boolean; canAddress: boolean }) {
  const { state, onMove } = useBoard()
  const tile = dialTile(state)
  const issue = tileIssue(tile)
  const flipsTo = tile.faces[tile.side === 0 ? 1 : 0]
  return (
    <div className="flex gap-3">
      <div className="shrink-0" aria-label="The dial tile">
        <TileFace tile={tile} size={DIAL_TILE_SIZE_PX} />
      </div>
      <div className="flex-1 space-y-1.5">
        <ActionButton cost={ACTION_COST.rallyDial} disabled={!canRally} onClick={() => onMove({ type: 'rallyDial' })}>
          Rally the dial tile (<IssueLabel issue={issue} />)
        </ActionButton>
        <ActionButton cost={ACTION_COST.address} disabled={!canAddress} onClick={() => onMove({ type: 'address' })}>
          Address: up on <IssueLabel issue={issue} />, flip to <IssueLabel issue={flipsTo} />
        </ActionButton>
      </div>
    </div>
  )
}

/** The viewer's turn: every action with its cost, enabled when it is legal now. */
export function TurnPanel({ seat }: { seat: Seat }) {
  const { state, onMove } = useBoard()
  const options = useMemo(() => turnOptions(state), [state])
  usePawnSelection(seat, options.pawnSteps, options.rallyGains)
  const { actionPoints } = state.turn
  const isPawnInHub = pawnOf(state, seat).cell === HUB_CELL_KEY
  const isTurningPastMark = isDialOnLastSlot(state)

  return (
    <Panel title="Your turn" className="border-accent ring-2 ring-accent">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <ActionPointPips points={actionPoints} /> {actionPoints} action {actionPoints === 1 ? 'point' : 'points'} left
      </p>
      <div className="space-y-2">
        <DialTileActions canRally={options.canBuy.has('rallyDial')} canAddress={options.canBuy.has('address')} />
        <ShiftPicker seat={seat} shiftsByUp={options.shiftsByUp} />
        <p className="rounded-xl border border-rule px-3 py-2 text-sm">
          <b>Move your pawn</b> ({ACTION_COST.movePawn}): {options.pawnSteps.length > 0 ? 'click a highlighted hex next to it.' : 'no free hex next to it.'}
        </p>
        <ActionButton cost={ACTION_COST.rallyAround} disabled={!options.canBuy.has('rallyAround')} onClick={() => onMove({ type: 'rallyAround' })}>
          {isPawnInHub
            ? 'Rally around your pawn (not from the hub)'
            : `Rally around your pawn: takes ${hexCount(options.rallyGains.length)} (dashed)`}
        </ActionButton>
        <ActionButton cost={ACTION_COST.turnDial} disabled={!options.canBuy.has('turnDial')} onClick={() => onMove({ type: 'turnDial' })}>
          {isTurningPastMark ? 'Turn the dial past the mark: ends your turn and the round' : 'Turn the dial one step'}
        </ActionButton>
        <Button tone="secondary" className="w-full py-2! text-sm" onClick={() => onMove({ type: 'endTurn' })}>
          {stopLabel(actionPoints)}
        </Button>
      </div>
    </Panel>
  )
}
