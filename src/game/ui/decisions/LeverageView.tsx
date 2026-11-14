import { useState } from 'react'
import { ABILITIES, cardById } from '../../data/cards'
import type { PendingOf } from '../../rules/tasks'
import { CardView } from '../CardView'
import { DECISION_LABELS } from './labels'
import { ButtonRow, ChoiceButton, ConfirmButton, DecisionFrame, IssueLabel, useSendDecision } from './parts'
import {
  NO_LEVERAGE_CHOICE,
  isLeverageChoiceValid,
  pickCard,
  setPlayEffect,
  setUp,
  toLeverageDecision,
  upOptions,
} from './leverageChoice'

const CARD_WIDTH_PX = 140

function describeEffect(cardId: number): string {
  const ability = ABILITIES[cardById(cardId).ability]
  return ability.type === 'Ongoing' ? 'Place it in front of you' : 'Resolve its effect'
}

/** The drawn cards, then what to do with the one kept. Only ever rendered for the player who drew them. */
export function LeveragePickView({ pending }: { pending: PendingOf<'leveragePick'> }) {
  const send = useSendDecision()
  const [choice, setChoice] = useState(NO_LEVERAGE_CHOICE)
  const decision = toLeverageDecision(choice)
  const isValid = isLeverageChoiceValid(choice, pending)
  const hint = pending.canDoBoth
    ? 'Upgraded: keep one card, then resolve it, go up on one of its issues, or both. The others are discarded.'
    : 'Keep one card: either resolve it or go up on one of its issues. The others are discarded.'

  return (
    <DecisionFrame title={DECISION_LABELS.leveragePick.forActor} hint={hint}>
      <ul className="flex flex-wrap gap-2" aria-label="Drawn cards">
        {pending.cardIds.map((cardId) => (
          <li key={cardId}>
            <button
              type="button"
              aria-pressed={choice.cardId === cardId}
              onClick={() => setChoice(pickCard(cardId))}
              className={`block cursor-pointer rounded-lg transition ${choice.cardId === cardId ? 'ring-4 ring-accent' : 'opacity-90 hover:opacity-100 hover:ring-2 hover:ring-rule'}`}
            >
              <CardView cardId={cardId} width={CARD_WIDTH_PX} />
            </button>
          </li>
        ))}
      </ul>

      {choice.cardId !== null && (
        <div className="space-y-2">
          <ButtonRow>
            <ChoiceButton isSelected={choice.playEffect} onClick={() => setChoice(setPlayEffect(choice, !choice.playEffect, pending.canDoBoth))}>
              {describeEffect(choice.cardId)}
            </ChoiceButton>
          </ButtonRow>
          <ButtonRow>
            {upOptions(choice, pending).map((up) => (
              <ChoiceButton
                key={up}
                isSelected={choice.up === up}
                onClick={() => setChoice(setUp(choice, choice.up === up ? null : up, pending.canDoBoth))}
              >
                {up === 'swap' ? 'Swap your positions on its two issues' : <>Go up on <IssueLabel issue={up} /></>}
              </ChoiceButton>
            ))}
          </ButtonRow>
        </div>
      )}

      <ConfirmButton
        label={choice.cardId === null ? 'Choose a card' : isValid ? 'Keep this card' : 'Choose what to do with it'}
        disabled={!isValid}
        onClick={() => decision && send(decision)}
      />
    </DecisionFrame>
  )
}
