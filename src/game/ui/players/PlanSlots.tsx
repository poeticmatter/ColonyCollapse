import { Lock } from 'lucide-react'
import { ActionTile } from '../../art/ActionTile'
import { SLOT_NUMBERS } from '../../rules/constants'
import { currentTurn, visiblePlanSlot } from '../../rules'
import type { Seat } from '../../rules'
import { useBoard } from '../context'
import { ActionHelp } from '../actionHelp/ActionHelp'

const PLAN_TILE_SIZE_PX = 64

/**
 * A player's four slots, as the viewer may see them: the owner sees their whole plan, everyone
 * else only the tiles already revealed. Hidden tiles are face down; nothing is read from a plan
 * except through `visiblePlanSlot`.
 */
export function PlanSlots({ owner }: { owner: Seat }) {
  const { state, viewerSeat } = useBoard()
  const hasPlan = state.players[owner].plan !== null
  const currentSlot = currentTurn(state).slot
  return (
    <ol className="flex gap-1.5" aria-label="Plan">
      {SLOT_NUMBERS.map((slot) => {
        const action = visiblePlanSlot(state, owner, slot, viewerSeat ?? 'spectator')
        return (
          <li key={slot} className={`flex flex-col items-center gap-0.5 rounded-lg p-0.5 ${currentSlot === slot ? 'ring-2 ring-accent' : ''}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Slot {slot}</span>
            {action ? (
              <ActionHelp action={action} side={state.players[owner].tiles[action]}>
                <ActionTile action={action} side={state.players[owner].tiles[action]} size={PLAN_TILE_SIZE_PX} />
              </ActionHelp>
            ) : (
              <div
                aria-label={hasPlan ? 'Face down' : 'Empty'}
                className={`flex items-center justify-center rounded-md border-2 ${
                  hasPlan ? 'border-ink-soft bg-ink-soft text-on-accent' : 'border-dashed border-rule text-ink-faint'
                }`}
                style={{ width: PLAN_TILE_SIZE_PX, height: PLAN_TILE_SIZE_PX }}
              >
                {hasPlan && <Lock size={20} aria-hidden />}
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
