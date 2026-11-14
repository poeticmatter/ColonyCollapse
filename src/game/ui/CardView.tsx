import { CardFace } from '../art/CardFace'
import { ABILITIES, cardById } from '../data/cards'

/** A seed card face from its id. */
export function CardView({ cardId, width }: { cardId: number; width?: number }) {
  const card = cardById(cardId)
  const ability = ABILITIES[card.ability]
  return <CardFace title={ability.title} type={ability.type} effect={ability.effect} colors={card.issues} width={width} />
}
