/**
 * The Colony Collapse palette, ported from the physical prototype's assets.
 * Issue colours are deliberately chalky and low-chroma so they never read as a
 * washed-out player colour; player colours are vivid and saturated.
 */

/** Ring order for the board: warm neutrals, greens and purples each sit opposite their nearest neighbour. */
export const ISSUES = ['Clay', 'Sage', 'Periwinkle', 'Stone', 'Seafoam', 'Mauve'] as const

export type Issue = (typeof ISSUES)[number]

export const ISSUE_FILL: Readonly<Record<Issue, string>> = {
  Clay: '#D69A78',
  Sage: '#B3BE7C',
  Periwinkle: '#99A0D6',
  Stone: '#C2B8A9',
  Seafoam: '#7FB8B2',
  Mauve: '#C193AF',
}

/** One step deeper than the fill: rims and borders. */
export const ISSUE_DEEP: Readonly<Record<Issue, string>> = {
  Clay: '#A85F3C',
  Sage: '#7D8A45',
  Periwinkle: '#5C64A6',
  Stone: '#8B8172',
  Seafoam: '#47857E',
  Mauve: '#8E5B79',
}

/** Between fill and deep: the alternating cells of an issue track. */
export const ISSUE_MID: Readonly<Record<Issue, string>> = {
  Clay: '#C4855F',
  Sage: '#A2AE68',
  Periwinkle: '#858DC8',
  Stone: '#B0A493',
  Seafoam: '#68A69F',
  Mauve: '#B07E9C',
}

/** Chalk fields are light, so every glyph and label on them is dark ink. */
export const ISSUE_INK: Readonly<Record<Issue, string>> = {
  Clay: '#4A2416',
  Sage: '#3A401C',
  Periwinkle: '#262C5E',
  Stone: '#3F382E',
  Seafoam: '#17403C',
  Mauve: '#45203A',
}

export const ISSUE_TAGLINE: Readonly<Record<Issue, string>> = {
  Clay: 'Climate & Energy',
  Sage: 'Growth & Forage',
  Periwinkle: 'Expansion & Flight',
  Stone: 'Democracy & Law',
  Seafoam: 'Water & Health',
  Mauve: 'Bloom & Pollination',
}

/** The neutral gold of everything that belongs to no player and no issue: markers, locks, highlights. */
export const GOLD_FILL = '#F5B301'
export const GOLD_MID = '#D6A23A'
export const GOLD_DEEP = '#8A5A00'
export const GOLD_INK = '#3F2D07'

/** Neutral pewter of the shared rondel pawn and dial, which belong to no one. */
export const PEWTER_FILL = '#C7CDD9'
export const PEWTER_DEEP = '#5C6578'
export const PEWTER_INK = '#1F2937'

export type PlayerColorName = 'Red' | 'Blue' | 'Green' | 'Violet' | 'Yellow'

export interface PlayerColor {
  name: PlayerColorName
  fill: string
  deep: string
  /** Glyph colour on the fill; yellow is too light for white. */
  ink: string
}

/** Seat order: seat 0 is Red, seat 1 is Blue, and so on. */
export const PLAYER_COLORS: readonly PlayerColor[] = [
  { name: 'Red', fill: '#E11D2E', deep: '#8C0F1C', ink: '#FFFFFF' },
  { name: 'Blue', fill: '#1073E6', deep: '#0A4B96', ink: '#FFFFFF' },
  { name: 'Green', fill: '#10B95A', deep: '#0B7A3C', ink: '#FFFFFF' },
  { name: 'Violet', fill: '#7B2FF7', deep: '#511C9E', ink: '#FFFFFF' },
  { name: 'Yellow', fill: '#FFC400', deep: '#A66E00', ink: '#4A3200' },
]

export function getPlayerColor(seat: number): PlayerColor {
  const color = PLAYER_COLORS[seat]
  if (!color) throw new RangeError(`No player colour for seat ${seat}; seats run 0..${PLAYER_COLORS.length - 1}`)
  return color
}
