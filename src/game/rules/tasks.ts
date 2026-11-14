import type { ActionId, ActionSide } from '../art/actions'
import type { CellKey } from '../board/geometry'
import type { Issue } from '../board/palette'
import type { DecisionKind, PendingDecision } from './decisions'
import type { Seat, SiteRef } from './types'

/**
 * An action resolves as a stack of small serializable tasks. A decision task waits for its
 * `seat` (the player who must answer); an auto task runs by itself.
 */
export type DecisionTask =
  | { kind: 'rondelMove'; seat: Seat; purpose: 'address' | 'develop'; side: ActionSide; strength: number }
  | { kind: 'crossPartyFlip'; seat: Seat; slot: number }
  | { kind: 'developExtraRally'; seat: Seat; destination: number; passed: number[] }
  | { kind: 'sitePrepFlip'; seat: Seat; targets: number[] }
  | { kind: 'mediaFlip'; seat: Seat; side: ActionSide }
  | { kind: 'pressCycleRally'; seat: Seat; slots: number[] }
  | { kind: 'leveragePick'; seat: Seat; side: ActionSide; cardIds: number[] }
  | { kind: 'dance'; seat: Seat; side: ActionSide; strength: number }
  | { kind: 'waggleSweep'; seat: Seat; targets: CellKey[]; canTie: boolean }
  | { kind: 'invest'; seat: Seat; side: ActionSide; strength: number }
  | { kind: 'combOverturn'; seat: Seat }
  | { kind: 'longFlight'; seat: Seat }
  | { kind: 'longFlightRally'; seat: Seat; landing: CellKey }
  | { kind: 'dissidentRally'; seat: Seat }
  | { kind: 'speakersFavor'; seat: Seat }
  | { kind: 'wardSweep'; seat: Seat }
  | { kind: 'blueprintRevision'; seat: Seat }
  | { kind: 'reserveDeployment'; seat: Seat }
  | { kind: 'forcedDown'; seat: Seat }
  | { kind: 'forcedUp'; seat: Seat; forbidden: Issue }
  | { kind: 'gavelPass'; seat: Seat }

export type AutoTask =
  | { kind: 'startAction'; seat: Seat; action: ActionId; side: ActionSide; strength: number }
  | { kind: 'gainOnRondelTile'; seat: Seat; slot: number }
  | { kind: 'flipRondelTile'; slot: number }
  | { kind: 'rally'; seat: Seat; site: SiteRef; canTie: boolean; countsAsFour: boolean }
  | { kind: 'adjustTrack'; seat: Seat; issue: Issue; delta: number }
  | { kind: 'swapTracks'; seat: Seat; first: Issue; second: Issue }
  | { kind: 'leverageDraw'; seat: Seat; side: ActionSide; count: number }
  | { kind: 'playCard'; seat: Seat; cardId: number }
  | { kind: 'addPawn'; seat: Seat }
  | { kind: 'gavelOffer'; seat: Seat }

export type Task = DecisionTask | AutoTask

export type TaskOf<K extends DecisionKind> = Extract<DecisionTask, { kind: K }>
export type PendingOf<K extends DecisionKind> = Extract<PendingDecision, { kind: K }>
export type AutoTaskOf<K extends AutoTask['kind']> = Extract<AutoTask, { kind: K }>
