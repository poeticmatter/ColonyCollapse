import type { Issue } from '../board/palette'

export type AbilityId =
  | 'combOverturn'
  | 'longFlight'
  | 'dissidentRally'
  | 'speakersFavor'
  | 'wardSweep'
  | 'blueprintRevision'
  | 'reserveDeployment'
  | 'forcedRealignment'
  | 'secondDancer'
  | 'deferredGavel'
  | 'echoingDecree'
  | 'crossPartyAddress'
  | 'sitePrep'
  | 'policyTrade'
  | 'waggleSweep'
  | 'extraHands'
  | 'pressCycle'
  | 'swiftWithdrawal'

export type CardType = 'Immediate' | 'Ongoing'

export type IssuePair = readonly [Issue, Issue]

export interface AbilityInfo {
  id: AbilityId
  title: string
  type: CardType
  /** Rules wording from docs/digital-rules.md. */
  effect: string
  flavor: string
  /** One card is printed per pair. */
  colorPairs: readonly IssuePair[]
}

export interface Card {
  /** Unique within the deck, 1..45. */
  id: number
  ability: AbilityId
  /** The seed card at setup goes up on the first issue and down on the second. */
  issues: IssuePair
}

/** The 18 abilities in the prototype's order. */
export const ABILITY_LIST: readonly AbilityInfo[] = [
  {
    id: 'combOverturn',
    title: 'Comb Overturn',
    type: 'Immediate',
    effect: "Flip any number of rondel tiles. The Media lock doesn't apply.",
    colorPairs: [['Clay', 'Sage'], ['Periwinkle', 'Stone'], ['Seafoam', 'Mauve']],
    flavor: 'A coordinated push through the trading comb turns every open cell face up.',
  },
  {
    id: 'longFlight',
    title: 'Long Flight',
    type: 'Immediate',
    effect:
      'Move one of your pawns to any hex except the hub that has no other pawn on it, then rally one hex adjacent to it.',
    colorPairs: [['Periwinkle', 'Stone'], ['Seafoam', 'Mauve'], ['Clay', 'Sage']],
    flavor: 'Scouts range far beyond the usual foraging paths to stake a distant claim.',
  },
  {
    id: 'dissidentRally',
    title: 'Dissident Rally',
    type: 'Immediate',
    effect: 'Take control of any one tile, ignoring the comparison.',
    colorPairs: [['Seafoam', 'Mauve'], ['Clay', 'Sage'], ['Periwinkle', 'Stone']],
    flavor: 'Even the back benches can summon support when the moment calls for it.',
  },
  {
    id: 'speakersFavor',
    title: "Speaker's Favor",
    type: 'Immediate',
    effect: 'Give the start player marker to any player, including yourself. It takes effect from the next slot.',
    colorPairs: [['Clay', 'Periwinkle'], ['Sage', 'Seafoam'], ['Stone', 'Mauve']],
    flavor: 'A well-placed favor buys more influence than the gavel itself.',
  },
  {
    id: 'wardSweep',
    title: 'Ward Sweep',
    type: 'Immediate',
    effect: 'Rally every hex in one district.',
    colorPairs: [['Sage', 'Seafoam'], ['Stone', 'Mauve'], ['Clay', 'Periwinkle']],
    flavor: 'One motion carries the whole district, cell by cell, all at once.',
  },
  {
    id: 'blueprintRevision',
    title: 'Blueprint Revision',
    type: 'Immediate',
    effect: 'Upgrade one of your action tiles, including the set-aside action.',
    colorPairs: [['Stone', 'Mauve'], ['Clay', 'Periwinkle'], ['Sage', 'Seafoam']],
    flavor: 'Revised plans catch on fast among colonies eager for an edge.',
  },
  {
    id: 'reserveDeployment',
    title: 'Reserve Deployment',
    type: 'Immediate',
    effect: 'Resolve one of your 3 unprogrammed tiles this round at strength 3, on its current side.',
    colorPairs: [['Clay', 'Stone'], ['Sage', 'Mauve'], ['Periwinkle', 'Seafoam']],
    flavor: 'What was shelved for later proves useful sooner than expected.',
  },
  {
    id: 'forcedRealignment',
    title: 'Forced Realignment',
    type: 'Immediate',
    effect: 'Choose another player and an issue: they go down 1 on it, then they choose a different issue to go up 1.',
    colorPairs: [['Clay', 'Seafoam'], ['Sage', 'Stone'], ['Periwinkle', 'Mauve']],
    flavor: 'Push a rival off their platform and watch them scramble for another.',
  },
  {
    id: 'secondDancer',
    title: 'Second Dancer',
    type: 'Immediate',
    effect: 'Add a second pawn of yours to the hub. When you Dance or Long Flight, move one of your pawns.',
    colorPairs: [['Clay', 'Mauve'], ['Sage', 'Periwinkle'], ['Stone', 'Seafoam']],
    flavor: 'Two dancers cover twice the comb.',
  },
  {
    id: 'deferredGavel',
    title: 'Deferred Gavel',
    type: 'Ongoing',
    effect:
      'At the end of any of your actions, if you hold the start player marker, you may pass it to the next player clockwise. It takes effect from the next slot.',
    colorPairs: [['Clay', 'Stone'], ['Sage', 'Mauve']],
    flavor: "Leading first isn't always leading best; some delegates prefer to watch and wait.",
  },
  {
    id: 'echoingDecree',
    title: 'Echoing Decree',
    type: 'Ongoing',
    effect: "When you resolve an Immediate card's effect, resolve it a second time, then discard this card.",
    colorPairs: [['Clay', 'Stone'], ['Periwinkle', 'Seafoam']],
    flavor: 'A powerful proclamation reverberates throughout the entire hive structure.',
  },
  {
    id: 'crossPartyAddress',
    title: 'Cross-Party Address',
    type: 'Ongoing',
    effect: 'ADDRESS: You may flip the tile before going up.',
    colorPairs: [['Sage', 'Mauve'], ['Periwinkle', 'Seafoam']],
    flavor: 'A quick change of colors before the speech wins over the other side.',
  },
  {
    id: 'sitePrep',
    title: 'Site Prep',
    type: 'Ongoing',
    effect: 'DEVELOP: You may flip the tile(s) before rallying.',
    colorPairs: [['Clay', 'Seafoam'], ['Sage', 'Stone']],
    flavor: 'Groundwork laid ahead of schedule keeps the dial turning smoothly.',
  },
  {
    id: 'policyTrade',
    title: 'Policy Trade',
    type: 'Ongoing',
    effect:
      "LEVERAGE: Instead of going up on one of the card's issues, you may swap your positions on its two issues.",
    colorPairs: [['Clay', 'Seafoam'], ['Periwinkle', 'Mauve']],
    flavor: 'Why give ground on one issue when you can simply trade places?',
  },
  {
    id: 'waggleSweep',
    title: 'Waggle Sweep',
    type: 'Ongoing',
    effect: 'DANCE: You may count as being on 4 of the issue for one of the hexes Dance rallies.',
    colorPairs: [['Sage', 'Stone'], ['Periwinkle', 'Mauve']],
    flavor: 'One well-danced signal can sway an entire ward.',
  },
  {
    id: 'extraHands',
    title: 'Extra Hands',
    type: 'Ongoing',
    effect: 'INTERN: Strength 2 instead of 1.',
    colorPairs: [['Clay', 'Mauve'], ['Sage', 'Periwinkle']],
    flavor: 'Two apprentices accomplish what one alone could not.',
  },
  {
    id: 'pressCycle',
    title: 'Press Cycle',
    type: 'Ongoing',
    effect: 'MEDIA: Rally one tile you flipped with that action.',
    colorPairs: [['Clay', 'Mauve'], ['Stone', 'Seafoam']],
    flavor: "A good headline doesn't just inform the hive, it rouses it.",
  },
  {
    id: 'swiftWithdrawal',
    title: 'Swift Withdrawal',
    type: 'Ongoing',
    effect: "Your discs still count for you while an opponent's pawn stands on them.",
    colorPairs: [['Sage', 'Periwinkle'], ['Stone', 'Seafoam']],
    flavor: "A rival on the doorstep doesn't change how the house votes.",
  },
]

export const ABILITIES: Readonly<Record<AbilityId, AbilityInfo>> = Object.fromEntries(
  ABILITY_LIST.map((ability) => [ability.id, ability]),
) as Record<AbilityId, AbilityInfo> // Every AbilityId has an entry in the list that defines the ids.

/** The 45 seed cards: one per colour pair of each ability. */
export const CARDS: readonly Card[] = ABILITY_LIST.flatMap((ability) =>
  ability.colorPairs.map((issues) => ({ ability: ability.id, issues })),
).map((card, index) => ({ ...card, id: index + 1 }))

export function cardById(id: number): Card {
  const card = CARDS[id - 1]
  if (!card) throw new RangeError(`No card ${id}`)
  return card
}
