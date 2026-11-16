import { useBoard } from './context'
import { GameOverPanel } from './GameOverPanel'
import { Panel } from './Panel'
import { statusPrompt } from './status'
import { TurnPanel } from './turn/TurnPanel'

/** Shows what the viewer is waiting for, with no controls. */
function WaitingPanel() {
  const { state, viewerSeat, nameOf } = useBoard()
  return (
    <Panel title="Waiting">
      <p className="text-sm text-ink-soft">{statusPrompt(state, viewerSeat ?? 'spectator', nameOf)}</p>
    </Panel>
  )
}

/** The panel that changes with the game: the viewer's turn controls, a waiting note, or the final ranking. */
export function ActionPanel() {
  const { state, viewerSeat } = useBoard()
  if (state.phase === 'over') return <GameOverPanel />
  if (state.turn.seat === viewerSeat) return <TurnPanel seat={viewerSeat} />
  return <WaitingPanel />
}
