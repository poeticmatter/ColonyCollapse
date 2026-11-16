import { useState } from 'react'
import { Button } from 'game-kit/turns'
import type { Issue } from '../../board/palette'
import { formatTrackSpace } from '../../board/track'
import { ACTION_COST, type Seat } from '../../rules'
import { useBoard } from '../context'
import { IssueLabel } from './ActionButton'

interface ShiftPickerProps {
  seat: Seat
  shiftsByUp: ReadonlyMap<Issue, Issue[]>
}

/** Shift: pick the issue to go up on, then the neighbour that goes down to pay for it. */
export function ShiftPicker({ seat, shiftsByUp }: ShiftPickerProps) {
  const { state, onMove } = useBoard()
  const [up, setUp] = useState<Issue | null>(null)
  const downs = up === null ? [] : (shiftsByUp.get(up) ?? [])
  const positionOf = (issue: Issue) => formatTrackSpace(state.track[issue][seat])

  if (shiftsByUp.size === 0) return null
  return (
    <div className="rounded-xl border border-rule p-2">
      <p className="mb-1.5 flex justify-between text-sm font-semibold">
        <span>Shift: up 1 on one issue, down 1 on a neighbour</span>
        <span className="rounded-full border border-current px-2 text-xs font-bold">{ACTION_COST.shift}</span>
      </p>
      <p className="mb-1 text-xs text-ink-soft">{up === null ? 'Go up on' : 'Go down on'}</p>
      <div className="flex flex-wrap gap-1.5">
        {up === null
          ? [...shiftsByUp.keys()].map((issue) => (
              <Button key={issue} tone="secondary" className="px-2.5! py-1! text-sm" onClick={() => setUp(issue)}>
                <IssueLabel issue={issue} /> <span className="opacity-70">{positionOf(issue)}</span>
              </Button>
            ))
          : downs.map((down) => (
              <Button
                key={down}
                tone="secondary"
                className="px-2.5! py-1! text-sm"
                onClick={() => {
                  onMove({ type: 'shift', up, down })
                  setUp(null)
                }}
              >
                <IssueLabel issue={down} /> <span className="opacity-70">{positionOf(down)}</span>
              </Button>
            ))}
        {up !== null && (
          <Button tone="secondary" className="px-2.5! py-1! text-sm" onClick={() => setUp(null)}>
            Back
          </Button>
        )}
      </div>
    </div>
  )
}
