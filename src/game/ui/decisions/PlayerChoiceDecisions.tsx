import { useState } from 'react'
import { ACTIONS, type ActionId } from '../../art/actions'
import { ActionTile } from '../../art/ActionTile'
import type { Issue } from '../../board/palette'
import { formatTrackSpace } from '../../board/track'
import type { Seat } from '../../rules'
import type { PendingOf } from '../../rules/tasks'
import { useBoard } from '../context'
import { SeatLabel } from '../SeatLabel'
import { DECISION_LABELS } from './labels'
import { ButtonRow, ChoiceButton, ConfirmButton, DecisionFrame, DeclineButton, IssueLabel, useSendDecision } from './parts'

const ACTION_TILE_SIZE_PX = 84

/** Seats in the order the viewer sees the table, limited to `allowed`. */
function useSeatsInViewOrder(allowed: readonly Seat[]): Seat[] {
  const { seatsFromViewer } = useBoard()
  return seatsFromViewer.filter((seat) => allowed.includes(seat))
}

export function SpeakersFavorView({ pending }: { pending: PendingOf<'speakersFavor'> }) {
  const send = useSendDecision()
  const seats = useSeatsInViewOrder(pending.options)
  return (
    <DecisionFrame title={DECISION_LABELS.speakersFavor.forActor} hint="They hold it from the next slot. You may choose yourself.">
      <ButtonRow>
        {seats.map((seat) => (
          <ChoiceButton key={seat} onClick={() => send({ kind: 'speakersFavor', to: seat })}>
            <SeatLabel seat={seat} />
          </ChoiceButton>
        ))}
      </ButtonRow>
    </DecisionFrame>
  )
}

export function GavelPassView({ pending }: { pending: PendingOf<'gavelPass'> }) {
  const send = useSendDecision()
  const { nameOf } = useBoard()
  return (
    <DecisionFrame title={DECISION_LABELS.gavelPass.forActor} hint="Deferred Gavel: you hold the start player marker, so you may pass it. It takes effect from the next slot.">
      <ButtonRow>
        <ConfirmButton label={`Pass it to ${nameOf(pending.to)}`} onClick={() => send({ kind: 'gavelPass', pass: true })} />
        <DeclineButton label="Keep it" onClick={() => send({ kind: 'gavelPass', pass: false })} />
      </ButtonRow>
    </DecisionFrame>
  )
}

interface ActionChoiceProps {
  title: string
  hint: string
  options: readonly ActionId[]
  verb: string
  onChoose: (action: ActionId) => void
}

/** The player's own tiles to choose from. */
function ActionChoice({ title, hint, options, verb, onChoose }: ActionChoiceProps) {
  const { state, viewerSeat } = useBoard()
  const tiles = viewerSeat === null ? null : state.players[viewerSeat].tiles
  return (
    <DecisionFrame title={title} hint={hint}>
      <ul className="flex flex-wrap gap-2">
        {options.map((action) => (
          <li key={action}>
            <button
              type="button"
              onClick={() => onChoose(action)}
              aria-label={`${verb} ${ACTIONS[action].name}`}
              className="block cursor-pointer rounded-md transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <ActionTile action={action} side={tiles?.[action] ?? 'basic'} size={ACTION_TILE_SIZE_PX} />
            </button>
          </li>
        ))}
      </ul>
    </DecisionFrame>
  )
}

export function BlueprintRevisionView({ pending }: { pending: PendingOf<'blueprintRevision'> }) {
  const send = useSendDecision()
  return (
    <ActionChoice
      title={DECISION_LABELS.blueprintRevision.forActor}
      hint="Pick a tile that is not upgraded yet; it flips to its upgraded side for good. The set-aside action counts too."
      options={pending.options}
      verb="Upgrade"
      onChoose={(action) => send({ kind: 'blueprintRevision', action })}
    />
  )
}

export function ReserveDeploymentView({ pending }: { pending: PendingOf<'reserveDeployment'> }) {
  const send = useSendDecision()
  return (
    <ActionChoice
      title={DECISION_LABELS.reserveDeployment.forActor}
      hint="Pick one of the 3 tiles you did not program this round. It resolves now at strength 3, on its current side."
      options={pending.options}
      verb="Deploy"
      onChoose={(action) => send({ kind: 'reserveDeployment', action })}
    />
  )
}

export function ForcedDownView({ pending }: { pending: PendingOf<'forcedDown'> }) {
  const send = useSendDecision()
  const { state } = useBoard()
  const [target, setTarget] = useState<Seat | null>(null)
  const [issue, setIssue] = useState<Issue | null>(null)
  const targets = useSeatsInViewOrder(pending.targets)
  const canConfirm = target !== null && issue !== null
  return (
    <DecisionFrame title={DECISION_LABELS.forcedDown.forActor} hint="They go down 1 on the issue, then choose a different issue to go up 1 on.">
      <ButtonRow>
        {targets.map((seat) => (
          <ChoiceButton key={seat} isSelected={seat === target} onClick={() => setTarget(seat)}>
            <SeatLabel seat={seat} />
          </ChoiceButton>
        ))}
      </ButtonRow>
      <ButtonRow>
        {pending.issues.map((candidate) => (
          <ChoiceButton key={candidate} isSelected={candidate === issue} onClick={() => setIssue(candidate)}>
            <IssueLabel issue={candidate} suffix={target === null ? undefined : ` ${formatTrackSpace(state.track[candidate][target])}`} />
          </ChoiceButton>
        ))}
      </ButtonRow>
      <ConfirmButton
        label="Push them down"
        disabled={!canConfirm}
        onClick={() => canConfirm && send({ kind: 'forcedDown', target, issue })}
      />
    </DecisionFrame>
  )
}

export function ForcedUpView({ pending }: { pending: PendingOf<'forcedUp'> }) {
  const send = useSendDecision()
  const { state } = useBoard()
  return (
    <DecisionFrame title={DECISION_LABELS.forcedUp.forActor} hint="You were pushed down by Forced Realignment. Go up 1 on a different issue.">
      <ButtonRow>
        {pending.options.map((issue) => (
          <ChoiceButton key={issue} onClick={() => send({ kind: 'forcedUp', issue })}>
            <IssueLabel issue={issue} suffix={` ${formatTrackSpace(state.track[issue][pending.actor])}`} />
          </ChoiceButton>
        ))}
      </ButtonRow>
    </DecisionFrame>
  )
}
