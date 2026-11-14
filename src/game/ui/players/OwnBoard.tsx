import { ACTION_IDS, ACTIONS } from '../../art/actions'
import { ActionTile } from '../../art/ActionTile'
import type { Seat } from '../../rules'
import { useBoard } from '../context'
import { SeatLabel } from '../SeatLabel'
import { OngoingCardRow } from './OngoingCards'
import { PlanSlots } from './PlanSlots'

const TILE_SIZE_PX = 60

/** All seven of the viewer's tiles on their current side, each marked with its slot once a plan is sent. */
function TileRow({ seat }: { seat: Seat }) {
  const { state } = useBoard()
  const { plan, tiles } = state.players[seat]
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Your action tiles">
      {ACTION_IDS.map((action) => {
        const slotIndex = plan?.indexOf(action) ?? -1
        const caption = plan === null ? ACTIONS[action].name : slotIndex === -1 ? 'Set aside' : `Slot ${slotIndex + 1}`
        return (
          <li key={action} className={`flex flex-col items-center gap-0.5 ${plan !== null && slotIndex === -1 ? 'opacity-60' : ''}`}>
            <ActionTile action={action} side={tiles[action]} size={TILE_SIZE_PX} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">{caption}</span>
          </li>
        )
      })}
    </ul>
  )
}

/** The viewer's own board: VP, plan, tiles and Ongoing cards. */
export function OwnBoard({ seat }: { seat: Seat }) {
  const { state } = useBoard()
  const player = state.players[seat]
  const upgradedCount = ACTION_IDS.filter((action) => player.tiles[action] === 'upgraded').length
  return (
    <div className="rounded-xl border-2 border-accent bg-paper p-3">
      <header className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <SeatLabel seat={seat} />
        <span className="text-sm">
          <b className="text-lg">{player.victoryPoints}</b> VP
          <span className="ml-3 text-ink-soft">{upgradedCount} of 7 tiles upgraded</span>
        </span>
      </header>
      {player.plan !== null && (
        <div className="mb-3">
          <PlanSlots owner={seat} />
        </div>
      )}
      <TileRow seat={seat} />
      <h3 className="mb-1 mt-3 text-xs font-bold uppercase tracking-wider text-ink-soft">Ongoing cards</h3>
      <OngoingCardRow cardIds={player.ongoing} />
    </div>
  )
}
