import { useMemo, useState } from 'react'
import type { PendingOf } from '../../rules/tasks'
import { tileIssue } from '../../rules'
import { useBoard } from '../context'
import { spatialSelection, useRegisterSpatialSelection } from '../spatial'
import { rondelMovesByDestination, toggleWithLimit } from './helpers'
import { ButtonRow, ChoiceButton, ConfirmButton, DecisionFrame, DeclineButton, IssueLabel, useSendDecision } from './parts'
import { DECISION_LABELS } from './labels'

function useRondelSlotName(): (slot: number) => string {
  const { state } = useBoard()
  return (slot) => {
    const tile = state.rondel[slot]
    return tile ? `${tileIssue(tile)} tile` : 'empty slot'
  }
}

export function RondelMoveView({ pending }: { pending: PendingOf<'rondelMove'> }) {
  const { state } = useBoard()
  const send = useSendDecision()
  const byDestination = useMemo(() => rondelMovesByDestination(pending.options), [pending])
  const selection = useMemo(
    () =>
      spatialSelection({
        clickableSlots: new Set(byDestination.keys()),
        onSlotClick: (slot) => {
          const option = byDestination.get(slot)
          if (option) send({ kind: 'rondelMove', steps: option.steps })
        },
      }),
    [byDestination, send],
  )
  useRegisterSpatialSelection(selection)
  const hint =
    pending.purpose === 'address'
      ? 'Go up 1 on the tile you stop on, then flip it. Click a highlighted tile on the rondel.'
      : 'Rally the tile you stop on. Click a highlighted tile on the rondel.'
  return (
    <DecisionFrame title={DECISION_LABELS.rondelMove.forActor} hint={hint}>
      <ButtonRow>
        {pending.options.map((option) => {
          const tile = state.rondel[option.destination]
          return (
            <ChoiceButton key={option.steps} onClick={() => send({ kind: 'rondelMove', steps: option.steps })}>
              {option.steps} {option.steps === 1 ? 'step' : 'steps'}
              {tile && <> → <IssueLabel issue={tileIssue(tile)} /></>}
            </ChoiceButton>
          )
        })}
      </ButtonRow>
    </DecisionFrame>
  )
}

export function CrossPartyFlipView({ pending }: { pending: PendingOf<'crossPartyFlip'> }) {
  const send = useSendDecision()
  const slotName = useRondelSlotName()
  const selection = useMemo(() => spatialSelection({ selectedSlots: new Set([pending.slot]) }), [pending.slot])
  useRegisterSpatialSelection(selection)
  return (
    <DecisionFrame title={DECISION_LABELS.crossPartyFlip.forActor} hint={`You are on the ${slotName(pending.slot)}. Flip it before going up?`}>
      <ButtonRow>
        <ConfirmButton label="Flip it first" onClick={() => send({ kind: 'crossPartyFlip', flip: true })} />
        <DeclineButton label="Leave it" onClick={() => send({ kind: 'crossPartyFlip', flip: false })} />
      </ButtonRow>
    </DecisionFrame>
  )
}

interface SingleSlotChoiceProps {
  title: string
  hint: string
  options: readonly number[]
  declineLabel: string
  onChoose: (slot: number | null) => void
}

/** Click one highlighted rondel tile, or decline. */
function SingleSlotChoice({ title, hint, options, declineLabel, onChoose }: SingleSlotChoiceProps) {
  const slotName = useRondelSlotName()
  const selection = useMemo(
    () => spatialSelection({ clickableSlots: new Set(options), onSlotClick: onChoose }),
    [options, onChoose],
  )
  useRegisterSpatialSelection(selection)
  return (
    <DecisionFrame title={title} hint={hint}>
      <ButtonRow>
        {options.map((slot) => (
          <ChoiceButton key={slot} onClick={() => onChoose(slot)}>
            {slotName(slot)}
          </ChoiceButton>
        ))}
        <DeclineButton label={declineLabel} onClick={() => onChoose(null)} />
      </ButtonRow>
    </DecisionFrame>
  )
}

export function DevelopExtraRallyView({ pending }: { pending: PendingOf<'developExtraRally'> }) {
  const send = useSendDecision()
  return (
    <SingleSlotChoice
      title={DECISION_LABELS.developExtraRally.forActor}
      hint="Upgraded Develop: also rally one tile you passed on the way. Click one, or skip."
      options={pending.options}
      declineLabel="No extra rally"
      onChoose={(slot) => send({ kind: 'developExtraRally', slot })}
    />
  )
}

export function PressCycleRallyView({ pending }: { pending: PendingOf<'pressCycleRally'> }) {
  const send = useSendDecision()
  return (
    <SingleSlotChoice
      title={DECISION_LABELS.pressCycleRally.forActor}
      hint="Rally one of the tiles you just flipped, or skip."
      options={pending.options}
      declineLabel="Skip"
      onChoose={(slot) => send({ kind: 'pressCycleRally', slot })}
    />
  )
}

interface FlipPickerProps {
  title: string
  hint: string
  options: readonly number[]
  maxFlips: number
  onConfirm: (slots: number[]) => void
}

/** Pick up to `maxFlips` rondel tiles to flip, then confirm; confirming with none picked flips nothing. */
function FlipPicker({ title, hint, options, maxFlips, onConfirm }: FlipPickerProps) {
  const [picked, setPicked] = useState<number[]>([])
  const selection = useMemo(
    () =>
      spatialSelection({
        clickableSlots: new Set(options),
        selectedSlots: new Set(picked),
        onSlotClick: (slot) => setPicked((current) => toggleWithLimit(current, slot, maxFlips)),
      }),
    [options, picked, maxFlips],
  )
  useRegisterSpatialSelection(selection)
  return (
    <DecisionFrame title={title} hint={hint}>
      <ButtonRow>
        <ConfirmButton
          label={picked.length === 0 ? 'Choose tiles to flip' : `Flip ${picked.length} ${picked.length === 1 ? 'tile' : 'tiles'}`}
          disabled={picked.length === 0}
          onClick={() => onConfirm(picked)}
        />
        <DeclineButton label="Flip nothing" onClick={() => onConfirm([])} />
      </ButtonRow>
    </DecisionFrame>
  )
}

export function MediaFlipView({ pending }: { pending: PendingOf<'mediaFlip'> }) {
  const send = useSendDecision()
  const limitText = pending.maxFlips === 1 ? 'Pick 1 tile' : `Pick any number of tiles (up to ${pending.maxFlips})`
  return (
    <FlipPicker
      title={DECISION_LABELS.mediaFlip.forActor}
      hint={`${limitText}. Tiles marked with a lock were already flipped by Media this slot.`}
      options={pending.options}
      maxFlips={pending.maxFlips}
      onConfirm={(slots) => send({ kind: 'mediaFlip', slots })}
    />
  )
}

export function SitePrepFlipView({ pending }: { pending: PendingOf<'sitePrepFlip'> }) {
  const send = useSendDecision()
  return (
    <FlipPicker
      title={DECISION_LABELS.sitePrepFlip.forActor}
      hint="You may flip any of the tiles about to be rallied before they are."
      options={pending.options}
      maxFlips={pending.options.length}
      onConfirm={(slots) => send({ kind: 'sitePrepFlip', slots })}
    />
  )
}

export function CombOverturnView({ pending }: { pending: PendingOf<'combOverturn'> }) {
  const send = useSendDecision()
  return (
    <FlipPicker
      title={DECISION_LABELS.combOverturn.forActor}
      hint="Flip any number of rondel tiles. The Media lock does not apply."
      options={pending.options}
      maxFlips={pending.options.length}
      onConfirm={(slots) => send({ kind: 'combOverturn', slots })}
    />
  )
}
