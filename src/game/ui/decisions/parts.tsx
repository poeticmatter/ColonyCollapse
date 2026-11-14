import { useCallback, type ReactNode } from 'react'
import { Button } from 'game-kit/turns'
import { IssueSymbol } from '../../art/IssueSymbol'
import type { Issue } from '../../board/palette'
import type { Decision } from '../../rules'
import { useBoard } from '../context'
import { Panel } from '../Panel'

/** Sends the player's answer to the pending decision. */
export function useSendDecision(): (decision: Decision) => void {
  const { onMove } = useBoard()
  return useCallback((decision) => onMove({ type: 'decide', decision }), [onMove])
}

interface DecisionFrameProps {
  title: string
  hint?: string
  children?: ReactNode
}

/** The shell every decision sits in: what is being asked, a hint, then the controls. */
export function DecisionFrame({ title, hint, children }: DecisionFrameProps) {
  return (
    <Panel className="border-accent ring-2 ring-accent">
      <h2 className="text-lg font-black">{title}</h2>
      {hint && <p className="mb-2 text-sm text-ink-soft">{hint}</p>}
      <div className="mt-2 space-y-3">{children}</div>
    </Panel>
  )
}

export function ButtonRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>
}

interface ChoiceButtonProps {
  children: ReactNode
  onClick: () => void
  isSelected?: boolean
  disabled?: boolean
}

/** A choice among several: shows as pressed when it is the current pick. */
export function ChoiceButton({ children, onClick, isSelected = false, disabled = false }: ChoiceButtonProps) {
  return (
    <Button
      tone={isSelected ? 'primary' : 'secondary'}
      aria-pressed={isSelected}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3! py-1.5! text-sm"
    >
      {children}
    </Button>
  )
}

/** The way out of an optional decision. */
export function DeclineButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button tone="secondary" onClick={onClick} className="px-3! py-1.5! text-sm">
      {label}
    </Button>
  )
}

export function ConfirmButton({ label, onClick, disabled = false }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <Button disabled={disabled} onClick={onClick} className="py-2!">
      {label}
    </Button>
  )
}

export function IssueLabel({ issue, suffix }: { issue: Issue; suffix?: string }) {
  return (
    <>
      <IssueSymbol issue={issue} size={16} color="currentColor" />
      {issue}
      {suffix && <span className="opacity-70">{suffix}</span>}
    </>
  )
}
