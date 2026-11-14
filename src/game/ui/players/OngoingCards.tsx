import { IssueSymbol } from '../../art/IssueSymbol'
import { ABILITIES, cardById } from '../../data/cards'
import { CardView } from '../CardView'

const CARD_WIDTH_PX = 124

/** Full faces of the Ongoing cards in front of a player. */
export function OngoingCardRow({ cardIds }: { cardIds: readonly number[] }) {
  if (cardIds.length === 0) return <p className="text-sm text-ink-faint">No Ongoing cards yet.</p>
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Ongoing cards">
      {cardIds.map((cardId) => (
        <li key={cardId}>
          <CardView cardId={cardId} width={CARD_WIDTH_PX} />
        </li>
      ))}
    </ul>
  )
}

/** One-line chips for the Ongoing cards of the other players; the effect is the tooltip. */
export function OngoingCardChips({ cardIds }: { cardIds: readonly number[] }) {
  if (cardIds.length === 0) return null
  return (
    <ul className="flex flex-wrap gap-1" aria-label="Ongoing cards">
      {cardIds.map((cardId) => {
        const card = cardById(cardId)
        const ability = ABILITIES[card.ability]
        return (
          <li
            key={cardId}
            title={`${ability.title}: ${ability.effect}`}
            className="flex items-center gap-1 rounded-md border border-rule bg-ground px-1.5 py-0.5 text-xs"
          >
            {card.issues.map((issue) => (
              <IssueSymbol key={issue} issue={issue} size={12} />
            ))}
            {ability.title}
          </li>
        )
      })}
    </ul>
  )
}
