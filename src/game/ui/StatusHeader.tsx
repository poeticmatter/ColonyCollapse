import { FINAL_ROUND, turnsLeftInRound } from '../rules'
import { ActionPointPips } from './ActionPointPips'
import { useBoard } from './context'
import { Panel } from './Panel'
import { SeatLabel } from './SeatLabel'
import { statusPrompt } from './status'

function RoundClock() {
  const { state } = useBoard()
  if (state.phase === 'over') return null
  const turnsLeft = turnsLeftInRound(state)
  return (
    <span className="text-sm text-ink-soft">
      {turnsLeft === 1 ? 'Last turn before the mark' : `Up to ${turnsLeft} turns before the mark`}
    </span>
  )
}

/** Round, who is on turn with their points, how long the round can last, and the one-line prompt for the viewer. */
export function StatusHeader() {
  const { state, viewerSeat, nameOf } = useBoard()
  const prompt = statusPrompt(state, viewerSeat ?? 'spectator', nameOf)
  return (
    <Panel>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <p className="text-lg font-black">
          Round {state.round} <span className="font-semibold text-ink-soft">of {FINAL_ROUND}</span>
        </p>
        {state.phase === 'playing' && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-ink-soft">On turn</span>
            <SeatLabel seat={state.turn.seat} marksViewer={false} />
            <ActionPointPips points={state.turn.actionPoints} />
          </div>
        )}
        <RoundClock />
      </div>
      <p className="mt-2 text-base font-semibold" role="status">
        {prompt}
      </p>
    </Panel>
  )
}
