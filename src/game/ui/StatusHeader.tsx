import { StartPlayerMarker } from '../art/StartPlayerMarker'
import { FINAL_ROUND, SLOT_NUMBERS } from '../rules/constants'
import { currentTurn } from '../rules'
import { useBoard } from './context'
import { Panel } from './Panel'
import { SeatLabel } from './SeatLabel'
import { statusPrompt } from './status'

function SlotChips() {
  const { state } = useBoard()
  const turn = currentTurn(state)
  return (
    <ol className="flex gap-1.5" aria-label="Slots">
      {SLOT_NUMBERS.map((slot) => {
        const isCurrent = turn.slot === slot
        return (
          <li
            key={slot}
            aria-current={isCurrent ? 'step' : undefined}
            className={`rounded-lg border px-2.5 py-1 text-center text-xs leading-tight ${
              isCurrent ? 'border-accent bg-accent text-on-accent' : 'border-rule bg-ground text-ink-soft'
            }`}
          >
            <span className="block font-bold">Slot {slot}</span>
            <span className="block">strength {slot}</span>
          </li>
        )
      })}
    </ol>
  )
}

function TurnOrder() {
  const { state } = useBoard()
  const turn = currentTurn(state)
  if (turn.phase !== 'resolving') return null
  const turnIndex = state.resolution?.orderIndex ?? 0
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm" aria-label="Order this slot">
      <li className="text-xs font-bold uppercase tracking-wider text-ink-soft">Order</li>
      {turn.order.map((seat, index) => (
        <li
          key={seat}
          className={`rounded-md px-1.5 py-0.5 ${seat === turn.turnSeat ? 'bg-slot ring-2 ring-accent' : ''} ${index < turnIndex ? 'opacity-50' : ''}`}
        >
          <SeatLabel seat={seat} marksViewer={false} />
        </li>
      ))}
    </ol>
  )
}

/** Round, slots, start player, this slot's order, and the one-line prompt for the viewer. */
export function StatusHeader() {
  const { state, viewerSeat, nameOf } = useBoard()
  const prompt = statusPrompt(state, viewerSeat ?? 'spectator', nameOf)
  return (
    <Panel>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <p className="text-lg font-black">
          Round {state.round} <span className="font-semibold text-ink-soft">of {FINAL_ROUND}</span>
        </p>
        <SlotChips />
        <div className="flex items-center gap-2 text-sm">
          <StartPlayerMarker size={28} />
          <span className="text-ink-soft">Start player</span>
          <SeatLabel seat={state.startPlayer} marksViewer={false} />
        </div>
        <TurnOrder />
      </div>
      <p className="mt-2 text-base font-semibold" role="status">
        {prompt}
      </p>
    </Panel>
  )
}
