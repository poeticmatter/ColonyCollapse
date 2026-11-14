import { useState } from 'react'
import { ISSUES, type Issue } from '../../board/palette'
import { formatTrackSpace } from '../../board/track'
import type { PendingOf } from '../../rules/tasks'
import { useBoard } from '../context'
import { DECISION_LABELS } from './labels'
import { previewInvest } from './investPreview'
import { ButtonRow, ChoiceButton, ConfirmButton, DecisionFrame, DeclineButton, IssueLabel, useSendDecision } from './parts'

function Heading({ children }: { children: string }) {
  return <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-ink-soft">{children}</h3>
}

/** Invest: go down on one issue, then up the same amount on another. */
export function InvestView({ pending }: { pending: PendingOf<'invest'> }) {
  const { state } = useBoard()
  const send = useSendDecision()
  const [from, setFrom] = useState<Issue | null>(null)
  const [to, setTo] = useState<Issue | null>(null)
  const [amount, setAmount] = useState(pending.maxAmount)

  const positionOf = (issue: Issue) => state.track[issue][pending.actor]
  const source = pending.sources.find((candidate) => candidate.from === from)
  const amounts = Array.from({ length: pending.maxAmount }, (_, index) => index + 1)
  const canConfirm = from !== null && to !== null && source?.to.includes(to) === true
  const preview = from !== null && to !== null ? previewInvest(positionOf(from), positionOf(to), amount) : null

  return (
    <DecisionFrame
      title={DECISION_LABELS.invest.forActor}
      hint={
        pending.sources.some((entry) => entry.to.length < ISSUES.length - 1)
          ? 'Go down on one issue to go up the same amount on a neighbouring issue (Clay and Mauve are not neighbours).'
          : 'Go down on one issue to go up the same amount on any other issue.'
      }
    >
      <div>
        <Heading>Go down on</Heading>
        <ButtonRow>
          {pending.sources.map((entry) => (
            <ChoiceButton
              key={entry.from}
              isSelected={entry.from === from}
              onClick={() => {
                setFrom(entry.from)
                if (to !== null && !entry.to.includes(to)) setTo(null)
              }}
            >
              <IssueLabel issue={entry.from} suffix={` ${formatTrackSpace(positionOf(entry.from))}`} />
            </ChoiceButton>
          ))}
        </ButtonRow>
      </div>

      <div>
        <Heading>By</Heading>
        <ButtonRow>
          {amounts.map((value) => (
            <ChoiceButton key={value} isSelected={value === amount} onClick={() => setAmount(value)}>
              {value}
            </ChoiceButton>
          ))}
        </ButtonRow>
      </div>

      {source && (
        <div>
          <Heading>Go up on</Heading>
          <ButtonRow>
            {source.to.map((issue) => (
              <ChoiceButton key={issue} isSelected={issue === to} onClick={() => setTo(issue)}>
                <IssueLabel issue={issue} suffix={` ${formatTrackSpace(positionOf(issue))}`} />
              </ChoiceButton>
            ))}
          </ButtonRow>
        </div>
      )}

      {from !== null && to !== null && preview && (
        <p className="text-sm">
          {from} {formatTrackSpace(positionOf(from))} → <b>{formatTrackSpace(preview.fromAfter)}</b>, {to} {formatTrackSpace(positionOf(to))} →{' '}
          <b>{formatTrackSpace(preview.toAfter)}</b>
          {preview.down < amount && <span className="text-ink-soft"> (a track stops at its end, so you move less)</span>}
        </p>
      )}

      <ButtonRow>
        <ConfirmButton
          label="Invest"
          disabled={!canConfirm}
          onClick={() => from && to && send({ kind: 'invest', transfer: { from, to, amount } })}
        />
        <DeclineButton label="Invest nothing" onClick={() => send({ kind: 'invest', transfer: null })} />
      </ButtonRow>
    </DecisionFrame>
  )
}
