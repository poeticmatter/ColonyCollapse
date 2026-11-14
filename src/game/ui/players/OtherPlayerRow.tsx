import { currentTurn, type Seat } from '../../rules'
import { useBoard } from '../context'
import { SeatLabel } from '../SeatLabel'
import { OngoingCardChips } from './OngoingCards'
import { PlanSlots } from './PlanSlots'

/** Another player: VP, a "ready" mark while programming, their slots (face down until revealed) and Ongoing cards. */
export function OtherPlayerRow({ seat }: { seat: Seat }) {
  const { state } = useBoard()
  const player = state.players[seat]
  const turn = currentTurn(state)
  const isActing = turn.actor === seat
  return (
    <div className={`rounded-xl border bg-paper p-2.5 ${isActing ? 'border-accent ring-2 ring-accent' : 'border-rule'}`}>
      <header className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <SeatLabel seat={seat} />
        <span className="flex items-center gap-3 text-sm">
          {turn.phase === 'programming' && (
            <span className={player.plan === null ? 'text-ink-soft' : 'font-bold text-ink'}>
              {player.plan === null ? 'Programming…' : '✓ Ready'}
            </span>
          )}
          <span>
            <b className="text-base">{player.victoryPoints}</b> VP
          </span>
        </span>
      </header>
      <PlanSlots owner={seat} />
      <div className="mt-1.5">
        <OngoingCardChips cardIds={player.ongoing} />
      </div>
    </div>
  )
}
