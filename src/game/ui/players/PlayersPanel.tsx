import { countBoardDiscs, type Seat } from '../../rules'
import { useBoard } from '../context'
import { Panel } from '../Panel'
import { SeatLabel } from '../SeatLabel'

function PlayerRow({ seat, discs }: { seat: Seat; discs: number }) {
  const { state } = useBoard()
  const isOnTurn = state.phase === 'playing' && state.turn.seat === seat
  return (
    <li className={`flex items-center justify-between gap-2 rounded-xl border bg-paper px-3 py-2 ${isOnTurn ? 'border-accent ring-2 ring-accent' : 'border-rule'}`}>
      <SeatLabel seat={seat} />
      <span className="flex items-center gap-3 text-sm">
        {isOnTurn && <span className="font-bold text-ink">On turn</span>}
        <span className="text-ink-soft">{discs} discs</span>
        <span>
          <b className="text-base">{state.players[seat].victoryPoints}</b> VP
        </span>
      </span>
    </li>
  )
}

/** Everyone at the table, the viewer first. */
export function PlayersPanel() {
  const { state, seatsFromViewer } = useBoard()
  const discs = countBoardDiscs(state)
  return (
    <Panel title="Players">
      <ul className="grid gap-2 md:grid-cols-2">
        {seatsFromViewer.map((seat) => (
          <PlayerRow key={seat} seat={seat} discs={discs[seat]} />
        ))}
      </ul>
    </Panel>
  )
}
