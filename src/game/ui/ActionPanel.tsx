import { Button } from 'game-kit/turns'
import { currentTurn, pendingDecision, type Seat } from '../rules'
import { useBoard } from './context'
import { decisionKey } from './decisions/helpers'
import { DecisionView } from './decisions/DecisionView'
import { GameOverPanel } from './GameOverPanel'
import { Panel } from './Panel'
import { ProgrammingPanel } from './players/ProgrammingPanel'
import { joinNames } from './seating'
import { statusPrompt } from './status'

/** Shows what the viewer is waiting for, with no controls. */
function WaitingPanel({ title }: { title: string }) {
  const { state, viewerSeat, nameOf } = useBoard()
  return (
    <Panel title={title}>
      <p className="text-sm text-ink-soft">{statusPrompt(state, viewerSeat ?? 'spectator', nameOf)}</p>
    </Panel>
  )
}

function ProgrammingStage() {
  const { state, viewerSeat, nameOf } = useBoard()
  const { seatsToProgram } = currentTurn(state)
  if (viewerSeat !== null && seatsToProgram.includes(viewerSeat)) {
    return (
      <Panel title="Program your 4 actions" className="border-accent ring-2 ring-accent">
        <ProgrammingPanel key={state.round} seat={viewerSeat} />
      </Panel>
    )
  }
  const ready = state.players.flatMap((_, seat) => (seatsToProgram.includes(seat) ? [] : [nameOf(seat)]))
  return (
    <Panel title="Programming">
      <p className="text-sm text-ink-soft">
        {statusPrompt(state, viewerSeat ?? 'spectator', nameOf)}
        {ready.length > 0 && ` Ready: ${joinNames(ready)}.`}
      </p>
    </Panel>
  )
}

function RevealPanel({ seat }: { seat: Seat }) {
  const { state, onMove, nameOf } = useBoard()
  return (
    <Panel title="Your action" className="border-accent ring-2 ring-accent">
      <p className="mb-2 text-sm text-ink-soft">{statusPrompt(state, seat, nameOf)}</p>
      <Button className="w-full py-4! text-lg" onClick={() => onMove({ type: 'reveal' })}>
        Reveal &amp; resolve
      </Button>
    </Panel>
  )
}

function ResolutionStage() {
  const { state, viewerSeat } = useBoard()
  const pending = pendingDecision(state)
  if (pending !== null) {
    if (pending.actor !== viewerSeat) return <WaitingPanel title="Decision" />
    return <DecisionView key={decisionKey(state, pending)} pending={pending} />
  }
  const { turnSeat } = currentTurn(state)
  if (turnSeat !== null && turnSeat === viewerSeat) return <RevealPanel seat={turnSeat} />
  return <WaitingPanel title="Resolution" />
}

/** The panel that changes with the game: programming, reveal, the decision to make, or the final ranking. */
export function ActionPanel() {
  const { state } = useBoard()
  if (state.phase === 'over') return <GameOverPanel />
  return state.phase === 'programming' ? <ProgrammingStage /> : <ResolutionStage />
}
