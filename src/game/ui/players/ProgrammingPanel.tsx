import { useState } from 'react'
import { Button } from 'game-kit/turns'
import { ACTION_IDS, ACTIONS } from '../../art/actions'
import { ActionTile } from '../../art/ActionTile'
import { SLOT_NUMBERS } from '../../rules/constants'
import type { Seat } from '../../rules'
import { useBoard } from '../context'
import { clearSlot, EMPTY_PLAN_DRAFT, slotOfAction, toggleAction, toPlan } from './plan'

const TILE_SIZE_PX = 72

/**
 * The viewer's programming screen: pick tiles into slots 1-4, then send the plan. Remount it
 * (key by round) to start a fresh draft.
 */
export function ProgrammingPanel({ seat }: { seat: Seat }) {
  const { state, onMove } = useBoard()
  const [draft, setDraft] = useState(EMPTY_PLAN_DRAFT)
  const plan = toPlan(draft)
  const { tiles } = state.players[seat]
  const emptySlotCount = draft.filter((entry) => entry === null).length

  return (
    <div className="space-y-3">
      <ol className="flex gap-1.5" aria-label="Your plan">
        {SLOT_NUMBERS.map((slot) => {
          const action = draft[slot - 1]
          return (
            <li key={slot} className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Slot {slot}</span>
              {action ? (
                <button
                  type="button"
                  onClick={() => setDraft(clearSlot(draft, slot - 1))}
                  aria-label={`Clear slot ${slot} (${ACTIONS[action].name})`}
                  className="cursor-pointer rounded-md ring-2 ring-accent hover:opacity-80"
                >
                  <ActionTile action={action} side={tiles[action]} size={TILE_SIZE_PX} />
                </button>
              ) : (
                <span
                  className="flex items-center justify-center rounded-md border-2 border-dashed border-rule text-ink-faint"
                  style={{ width: TILE_SIZE_PX, height: TILE_SIZE_PX }}
                >
                  {slot}
                </span>
              )}
            </li>
          )
        })}
      </ol>

      <div>
        <p className="mb-1 text-xs text-ink-soft">
          Pick a tile to put it in the next empty slot. Pick it again, or click its slot, to take it back.
        </p>
        <ul className="flex flex-wrap gap-2" aria-label="Your action tiles">
          {ACTION_IDS.map((action) => {
            const placedAt = slotOfAction(draft, action)
            const isPlaced = placedAt !== -1
            return (
              <li key={action} className="relative">
                <button
                  type="button"
                  aria-pressed={isPlaced}
                  onClick={() => setDraft(toggleAction(draft, action))}
                  className={`block cursor-pointer rounded-md transition ${isPlaced ? 'opacity-40' : 'hover:-translate-y-0.5 hover:shadow-md'}`}
                >
                  <ActionTile action={action} side={tiles[action]} size={TILE_SIZE_PX} />
                </button>
                {isPlaced && (
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-2xl font-black text-ink">
                    {placedAt + 1}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      <Button disabled={plan === null} onClick={() => plan && onMove({ type: 'program', plan })}>
        {plan === null ? `Choose ${emptySlotCount} more` : 'Send plan'}
      </Button>
    </div>
  )
}
