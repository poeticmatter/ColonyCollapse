import { BOARD_DISC_SIZE } from '../../art/BoardView'
import { Centered } from '../../art/Centered'
import { PlayerDisc } from '../../art/PlayerDisc'
import { RONDEL_TILE_SIZE, RondelView } from '../../art/RondelView'
import { useBoard } from '../context'
import { Panel } from '../Panel'
import { TileFace } from './tileFaces'

/** The tile rondel with its dial, the mark that ends the round, and the discs on its tiles. */
export function RondelPanel() {
  const { state, colorOf } = useBoard()

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
      </>
    )
  }

  return (
    <Panel title="Rondel">
      <RondelView slotContent={renderSlot} pointerPosition={state.dial} className="mx-auto max-w-[420px]" />
      <p className="mt-2 text-center text-xs text-ink-soft">
        The dial turns one step after every turn. When it passes the gold mark, the round ends and every tile goes to its district.
      </p>
    </Panel>
  )
}
