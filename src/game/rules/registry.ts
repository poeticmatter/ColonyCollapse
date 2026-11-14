import {
  blueprintRevisionHandler,
  combOverturnHandler,
  dissidentRallyHandler,
  forcedDownHandler,
  forcedUpHandler,
  reserveDeploymentHandler,
  speakersFavorHandler,
  wardSweepHandler,
} from './actions/cardDecisions'
import { addPawn, adjustTrack, gavelOffer, gavelPassHandler, playCard, swapTracks } from './actions/cardPlay'
import { danceHandler, longFlightHandler, longFlightRallyHandler, waggleSweepHandler } from './actions/dance'
import { investHandler } from './actions/invest'
import { leverageDraw, leveragePickHandler } from './actions/leverage'
import { mediaFlipHandler, pressCycleRallyHandler } from './actions/media'
import {
  crossPartyFlipHandler,
  developExtraRallyHandler,
  flipRondelTile,
  gainOnRondelTile,
  rally,
  rondelMoveHandler,
  sitePrepFlipHandler,
} from './actions/rondelActions'
import { startAction } from './actions/startAction'
import type { Decision, DecisionKind, PendingDecision } from './decisions'
import type { AutoHandler, AutoHandlers, DecisionHandler, DecisionHandlers } from './handlers'
import type { AutoTask, DecisionTask, Task } from './tasks'
import type { GameState } from './types'

const decisionHandlers: DecisionHandlers = {
  rondelMove: rondelMoveHandler,
  crossPartyFlip: crossPartyFlipHandler,
  developExtraRally: developExtraRallyHandler,
  sitePrepFlip: sitePrepFlipHandler,
  mediaFlip: mediaFlipHandler,
  pressCycleRally: pressCycleRallyHandler,
  leveragePick: leveragePickHandler,
  dance: danceHandler,
  waggleSweep: waggleSweepHandler,
  invest: investHandler,
  combOverturn: combOverturnHandler,
  longFlight: longFlightHandler,
  longFlightRally: longFlightRallyHandler,
  dissidentRally: dissidentRallyHandler,
  speakersFavor: speakersFavorHandler,
  wardSweep: wardSweepHandler,
  blueprintRevision: blueprintRevisionHandler,
  reserveDeployment: reserveDeploymentHandler,
  forcedDown: forcedDownHandler,
  forcedUp: forcedUpHandler,
  gavelPass: gavelPassHandler,
}

const autoHandlers: AutoHandlers = {
  startAction,
  gainOnRondelTile,
  flipRondelTile,
  rally,
  adjustTrack,
  swapTracks,
  leverageDraw,
  playCard,
  addPawn,
  gavelOffer,
}

export function isDecisionTask(task: Task): task is DecisionTask {
  return task.kind in decisionHandlers
}

// The two lookups below index a table of per-kind handlers with a kind taken from a union, which
// TypeScript cannot correlate with the task's own type, so each widens its handler once.

/** The choice a decision task puts to its player, or null if there is nothing to choose. */
export function describeTask(state: GameState, task: DecisionTask): PendingDecision | null {
  const handler = decisionHandlers[task.kind] as DecisionHandler<DecisionKind>
  return handler.describe(state, task)
}

/** Applies an answer to the task it was meant for; the caller has checked the kinds match. */
export function applyDecisionToTask(state: GameState, task: DecisionTask, decision: Decision, pending: PendingDecision): void {
  const handler = decisionHandlers[task.kind] as DecisionHandler<DecisionKind>
  handler.apply(state, task, decision, pending)
}

export function runAutoTask(state: GameState, task: AutoTask): void {
  const handler = autoHandlers[task.kind] as AutoHandler<AutoTask['kind']>
  handler(state, task)
}
