import type { ReactNode } from 'react'
import { Button } from 'game-kit/turns'
import { IssueSymbol } from '../../art/IssueSymbol'
import type { Issue } from '../../board/palette'

interface ActionButtonProps {
  cost: number
  onClick: () => void
  disabled: boolean
  children: ReactNode
}

/** A paid action: what it does, with its cost in action points. */
export function ActionButton({ cost, onClick, disabled, children }: ActionButtonProps) {
  return (
    <Button disabled={disabled} onClick={onClick} className="flex w-full items-center justify-between gap-3 px-3! py-2! text-left text-sm">
      <span className="flex flex-wrap items-center gap-1.5">{children}</span>
      <span className="shrink-0 rounded-full border border-current px-2 text-xs font-bold" aria-label={`costs ${cost}`}>
        {cost}
      </span>
    </Button>
  )
}

export function IssueLabel({ issue }: { issue: Issue }) {
  return (
    <span className="inline-flex items-center gap-1">
      <IssueSymbol issue={issue} size={16} color="currentColor" />
      {issue}
    </span>
  )
}
