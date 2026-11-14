import type { ActionId } from '../art/actions'

/** Weights of the static evaluation, in "victory point" units. */

export const VICTORY_POINT_WEIGHT = 1
/** How much of the later rounds' scoring a hex majority held now is expected to still earn. */
export const FUTURE_ROUND_DISCOUNT = 0.5
/** Partial credit for being ahead of (or behind) the best rival in a district that nobody wins outright yet. */
export const DISTRICT_MARGIN_WEIGHT = 0.4
export const CONTROL_DISC_WEIGHT = 0.3
export const TRACK_POSITION_WEIGHT = 0.3
/** Sitting below 0 on a track means a player can't rally on that issue at all. */
export const NEGATIVE_TRACK_PENALTY = 0.4
export const ONGOING_CARD_WEIGHT = 0.8
/** How much a rival's standing counts against the bot, relative to its own. */
export const RIVAL_WEIGHT = 0.5

/** What an upgraded tile is worth to its owner, by action. */
export const UPGRADED_TILE_VALUE: Readonly<Record<ActionId, number>> = {
  address: 1.2,
  develop: 1.5,
  media: 0.6,
  leverage: 1.2,
  dance: 1.6,
  intern: 0.5,
  invest: 0.8,
}

/** Candidates that look best at first sight and are examined one decision deeper. */
export const LOOKAHEAD_BREADTH = 3
export const LOOKAHEAD_DEPTH = 2
