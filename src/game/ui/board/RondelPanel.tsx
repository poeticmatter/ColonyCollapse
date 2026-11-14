import { Lock } from 'lucide-react'
import { BOARD_DISC_SIZE } from '../../art/BoardView'
import { Centered } from '../../art/Centered'
import { PlayerDisc } from '../../art/PlayerDisc'
import { RONDEL_TILE_SIZE, RondelView } from '../../art/RondelView'
import { GOLD_DEEP, GOLD_FILL, GOLD_INK } from '../../board/palette'
import { hexPointsAt } from '../../board/geometry'
import { RONDEL_HEX_RADIUS } from '../../board/rondel'
import { isTileMediaLocked } from '../../rules'
import { useBoard } from '../context'
import { Panel } from '../Panel'
import { useSpatialSelection } from '../spatial'
import { TileFace } from './tileFaces'

const LOCK_BADGE_RADIUS = 17
const LOCK_BADGE_CENTER = { x: 52, y: -52 }
const LOCK_ICON_SIZE = 20
const SELECTED_STROKE = '#FFFFFF'

function MediaLockBadge() {
  return (
    <g transform={`translate(${LOCK_BADGE_CENTER.x}, ${LOCK_BADGE_CENTER.y})`}>
      <title>Flipped by Media this slot: Media can't flip it again</title>
      <circle r={LOCK_BADGE_RADIUS} fill={GOLD_FILL} stroke={GOLD_DEEP} strokeWidth="3" />
      <g transform={`translate(${-LOCK_ICON_SIZE / 2}, ${-LOCK_ICON_SIZE / 2})`}>
        <Lock size={LOCK_ICON_SIZE} color={GOLD_INK} strokeWidth={2.5} aria-hidden />
      </g>
    </g>
  )
}

/** The tile rondel with its pointer, discs, Media-locked marks and whatever the active decision highlights. */
export function RondelPanel() {
  const { state, colorOf } = useBoard()
  const selection = useSpatialSelection()

  const handleSlotClick = selection.onSlotClick
  const onSlotClick = handleSlotClick
    ? (slot: number) => {
        if (selection.clickableSlots.has(slot)) handleSlotClick(slot)
      }
    : undefined

  const renderSlot = (slot: number) => {
    const tile = state.rondel[slot]
    if (!tile) return null
    return (
      <>
        <Centered size={RONDEL_TILE_SIZE}>
          <TileFace tile={tile} size={RONDEL_TILE_SIZE} />
        </Centered>
        {tile.disc !== null && (
          <Centered size={BOARD_DISC_SIZE}>
            <PlayerDisc color={colorOf(tile.disc)} size={BOARD_DISC_SIZE} />
          </Centered>
        )}
        {isTileMediaLocked(state, tile) && <MediaLockBadge />}
        {selection.selectedSlots.has(slot) && (
          <polygon
            points={hexPointsAt(0, 0, RONDEL_HEX_RADIUS - 8)}
            fill="none"
            stroke={SELECTED_STROKE}
            strokeWidth="7"
            strokeLinejoin="round"
            pointerEvents="none"
          />
        )}
      </>
    )
  }

  return (
    <Panel title="Rondel">
      <RondelView
        slotContent={renderSlot}
        pointerPosition={state.rondelPawn}
        highlightedSlots={selection.clickableSlots}
        onSlotClick={onSlotClick}
        className="mx-auto max-w-[420px]"
      />
    </Panel>
  )
}
