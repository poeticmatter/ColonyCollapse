import { ACTION_POINTS_PER_TURN, legalMoveResults, type GameState, type Move, type Seat } from '../rules'
import { evaluateState, type EvaluationContext } from './evaluate'
import { BEAM_WIDTH } from './weights'

/** A partial turn: the moves so far and where they lead. */
interface Line {
  moves: Move[]
  state: GameState
  value: number
}

function hasTurnEnded(state: GameState, root: GameState): boolean {
  return state.phase === 'over' || state.round !== root.round || state.turn.seat !== root.turn.seat
}

/** What decides a position's future: the same signature means the same position, whatever order led there. */
function positionSignature(state: GameState): string {
  return JSON.stringify([state.turn, state.dial, state.track, state.rondel, state.pawns, state.printedDiscs])
}

function keepBest(lines: Line[], width: number): Line[] {
  const seen = new Set<string>()
  const unique = [...lines]
    .sort((first, second) => second.value - first.value)
    .filter((line) => {
      const signature = positionSignature(line.state)
      if (seen.has(signature)) return false
      seen.add(signature)
      return true
    })
  return unique.slice(0, width)
}

function extend(line: Line, seat: Seat, root: GameState): Line[] {
  return legalMoveResults(line.state).map(({ move, next }) => {
    const context: EvaluationContext = { isRondelKnown: next.round === root.round }
    return { moves: [...line.moves, move], state: next, value: evaluateState(next, seat, context) }
  })
}

/**
 * The best whole turn for the player on turn: a beam search that keeps the most promising
 * partial turns at each number of points left, and scores each finished turn by where it
 * leaves the board. Lines are explored in a fixed order, so the result is deterministic.
 */
export function bestTurn(root: GameState): Move[] {
  const seat = root.turn.seat
  const linesByPointsLeft: Line[][] = Array.from({ length: ACTION_POINTS_PER_TURN + 1 }, () => [])
  linesByPointsLeft[root.turn.actionPoints].push({ moves: [], state: root, value: 0 })
  const finished: Line[] = []
  for (let pointsLeft = root.turn.actionPoints; pointsLeft > 0; pointsLeft -= 1) {
    for (const line of keepBest(linesByPointsLeft[pointsLeft], BEAM_WIDTH)) {
      for (const child of extend(line, seat, root)) {
        if (hasTurnEnded(child.state, root)) finished.push(child)
        else linesByPointsLeft[child.state.turn.actionPoints].push(child)
      }
    }
  }
  const [best] = keepBest(finished, 1)
  if (!best) throw new Error('The bot found no way to finish its turn')
  return best.moves
}
