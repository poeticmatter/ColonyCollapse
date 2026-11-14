import type { ActionId } from '../art/actions'
import type { CellKey } from '../board/geometry'
import type { Issue } from '../board/palette'
import type { Seat, SiteRef } from './types'

/** What a player sends to answer the decision the game is waiting for. `kind` matches the pending decision's. */
export type Decision =
  | { kind: 'rondelMove'; steps: number }
  | { kind: 'crossPartyFlip'; flip: boolean }
  | { kind: 'developExtraRally'; slot: number | null }
  | { kind: 'sitePrepFlip'; slots: number[] }
  | { kind: 'mediaFlip'; slots: number[] }
  | { kind: 'pressCycleRally'; slot: number | null }
  | { kind: 'leveragePick'; cardId: number; playEffect: boolean; up: Issue | 'swap' | null }
  | { kind: 'dance'; pawnId: number; to: CellKey }
  | { kind: 'waggleSweep'; cell: CellKey | null }
  | { kind: 'invest'; transfer: { from: Issue; to: Issue; amount: number } | null }
  | { kind: 'combOverturn'; slots: number[] }
  | { kind: 'longFlight'; pawnId: number; to: CellKey }
  | { kind: 'longFlightRally'; cell: CellKey | null }
  | { kind: 'dissidentRally'; site: SiteRef }
  | { kind: 'speakersFavor'; to: Seat }
  | { kind: 'wardSweep'; district: Issue }
  | { kind: 'blueprintRevision'; action: ActionId }
  | { kind: 'reserveDeployment'; action: ActionId }
  | { kind: 'forcedDown'; target: Seat; issue: Issue }
  | { kind: 'forcedUp'; issue: Issue }
  | { kind: 'gavelPass'; pass: boolean }

export type DecisionKind = Decision['kind']

export interface RondelMoveOption {
  steps: number
  /** The rondel slot the pawn would stop on. */
  destination: number
  /** The rondel slots strictly between the start and the destination. */
  passed: number[]
}

export interface DanceDestination {
  cell: CellKey
  steps: number
  /** The hexes the landing would rally: the landing hex and its neighbours, where something can be rallied. */
  rallies: CellKey[]
}

export interface DancePawnOption {
  pawnId: number
  from: CellKey
  destinations: DanceDestination[]
}

export interface LongFlightPawnOption {
  pawnId: number
  from: CellKey
  destinations: CellKey[]
}

export interface InvestSource {
  from: Issue
  /** The issues the points may go up on. */
  to: Issue[]
}

/**
 * What the game is waiting for, with everything needed to show the choice. `actor` is the seat who
 * must answer; it is usually the player whose action it is. Decisions marked "may decline" accept a
 * null / empty / false answer.
 */
export type PendingDecision =
  | {
      kind: 'rondelMove'
      actor: Seat
      purpose: 'address' | 'develop'
      /** One option per legal step count, 1..strength. */
      options: RondelMoveOption[]
    }
  /** Cross-Party Address: may flip the tile the pawn landed on before going up. */
  | { kind: 'crossPartyFlip'; actor: Seat; slot: number }
  /** Upgraded Develop: may decline (slot null) or pick one passed tile to rally as well. */
  | { kind: 'developExtraRally'; actor: Seat; options: number[] }
  /** Site Prep: may flip any of the tiles about to be rallied. */
  | { kind: 'sitePrepFlip'; actor: Seat; options: number[] }
  /** Media: may flip up to `maxFlips` of the unlocked rondel tiles. */
  | { kind: 'mediaFlip'; actor: Seat; options: number[]; maxFlips: number }
  /** Press Cycle: may rally one of the tiles just flipped. */
  | { kind: 'pressCycleRally'; actor: Seat; options: number[] }
  /** Leverage: keep one of the drawn cards. */
  | {
      kind: 'leveragePick'
      actor: Seat
      cardIds: number[]
      /** Upgraded Leverage may resolve the effect and go up. Otherwise exactly one of the two. */
      canDoBoth: boolean
      /** Policy Trade is in front of the player now (the drawn Policy Trade itself also counts when its effect is played and both are allowed). */
      canSwap: boolean
    }
  | { kind: 'dance'; actor: Seat; canTie: boolean; pawns: DancePawnOption[] }
  /** Waggle Sweep: may count as being on 4 for one of the hexes about to be rallied. */
  | { kind: 'waggleSweep'; actor: Seat; options: CellKey[] }
  /** Invest: may decline (transfer null). Otherwise go down `amount` (1..maxAmount) on `from`, up the same actual amount on `to`. */
  | { kind: 'invest'; actor: Seat; maxAmount: number; sources: InvestSource[] }
  | { kind: 'combOverturn'; actor: Seat; options: number[] }
  | { kind: 'longFlight'; actor: Seat; pawns: LongFlightPawnOption[] }
  /** Long Flight: may decline the rally (cell null). */
  | { kind: 'longFlightRally'; actor: Seat; options: CellKey[] }
  | { kind: 'dissidentRally'; actor: Seat; options: SiteRef[] }
  | { kind: 'speakersFavor'; actor: Seat; options: Seat[] }
  | { kind: 'wardSweep'; actor: Seat; options: Issue[] }
  | { kind: 'blueprintRevision'; actor: Seat; options: ActionId[] }
  | { kind: 'reserveDeployment'; actor: Seat; options: ActionId[] }
  | { kind: 'forcedDown'; actor: Seat; targets: Seat[]; issues: Issue[] }
  /** Chosen by the player who was pushed down; `actor` is that player. */
  | { kind: 'forcedUp'; actor: Seat; options: Issue[] }
  /** Deferred Gavel: may pass the start player marker to `to`. */
  | { kind: 'gavelPass'; actor: Seat; to: Seat }
