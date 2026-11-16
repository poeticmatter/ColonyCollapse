/** Weights of the static evaluation, in "victory point" units. */

export const VICTORY_POINT_WEIGHT = 1
/** How much of the later rounds' scoring a hex majority held now is expected to still earn. */
export const FUTURE_ROUND_DISCOUNT = 0.5
/** Partial credit for being ahead of (or behind) the best rival in a district, win or not. */
export const DISTRICT_MARGIN_WEIGHT = 0.4
export const CONTROL_DISC_WEIGHT = 0.3
export const TRACK_POSITION_WEIGHT = 0.15
/** Sitting below 0 on a track means a player can't rally on that issue at all. */
export const NEGATIVE_TRACK_PENALTY = 0.4
/** Being ahead of every rival on an issue protects discs and wins new tiles at polling. */
export const TRACK_MARGIN_WEIGHT = 0.25
/** A lead bigger than this protects nothing more. */
export const MAX_COUNTED_TRACK_MARGIN = 2
/** How much a rival's standing counts against the bot, relative to its own. */
export const RIVAL_WEIGHT = 0.5

/** How many partial turns are kept at each number of points left. */
export const BEAM_WIDTH = 16
