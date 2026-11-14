import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { getPlayerColor } from '../board/palette'
import { ACTION_IDS } from './actions'
import { ActionTile } from './ActionTile'
import { BoardView, BOARD_DISC_SIZE } from './BoardView'
import { Centered } from './Centered'
import { CardFace } from './CardFace'
import { HexTileFace } from './HexTileFace'
import { IssueTrack, getMarkerOffsets } from './IssueTrack'
import { PlayerDisc } from './PlayerDisc'
import { PlayerPawn } from './PlayerPawn'
import { RondelPawn } from './RondelPawn'
import { RondelView, RONDEL_TILE_SIZE } from './RondelView'
import { StartPlayerMarker } from './StartPlayerMarker'

describe('BoardView', () => {
  it('renders the bare board', () => {
    expect(renderToString(<BoardView />)).toContain('<svg')
  })

  it('draws cell content, highlights and click targets', () => {
    const html = renderToString(
      <BoardView
        cellContent={(cellKey) =>
          cellKey === '0,0' ? (
            <Centered size={BOARD_DISC_SIZE}>
              <PlayerDisc color={getPlayerColor(0)} size={BOARD_DISC_SIZE} />
            </Centered>
          ) : null
        }
        onCellClick={() => undefined}
        highlightedCells={new Set(['1,-1'])}
      />,
    )
    expect(html).toContain('Red control disc')
    expect(html).toContain('role="button"')
  })
})

describe('RondelView', () => {
  it('renders every pointer position with slot contents', () => {
    for (let pointerPosition = 0; pointerPosition < 6; pointerPosition += 1) {
      const html = renderToString(
        <RondelView
          pointerPosition={pointerPosition}
          slotContent={() => (
            <Centered size={RONDEL_TILE_SIZE}>
              <HexTileFace face="Clay" back="Mauve" size={RONDEL_TILE_SIZE} />
            </Centered>
          )}
          onSlotClick={() => undefined}
          highlightedSlots={new Set([pointerPosition])}
        />,
      )
      expect(html).toContain('Tile rondel')
    }
  })
})

describe('IssueTrack', () => {
  const positions = [
    { seat: 0, position: 0 },
    { seat: 1, position: 0 },
    { seat: 2, position: 3 },
    { seat: 3, position: -2 },
    { seat: 4, position: 0 },
  ]

  it('renders both orientations with stacked and tied markers', () => {
    for (const orientation of ['horizontal', 'vertical'] as const) {
      const html = renderToString(
        <IssueTrack issue="Seafoam" positions={positions} colorOf={getPlayerColor} orientation={orientation} />,
      )
      expect(html).toContain('Seafoam issue track')
    }
  })

  it('lays out up to five stacked markers without overlap', () => {
    for (let count = 1; count <= 5; count += 1) {
      const offsets = getMarkerOffsets(count)
      expect(new Set(offsets.map(({ x, y }) => `${x},${y}`)).size).toBe(count)
    }
  })
})

describe('pieces', () => {
  it('renders every piece and action tile', () => {
    const html = renderToString(
      <>
        <PlayerPawn color={getPlayerColor(4)} />
        <RondelPawn />
        <StartPlayerMarker />
        <CardFace title="Comb Overturn" type="Immediate" effect="DANCE: move 2." colors={['Clay', 'Sage']} />
        {ACTION_IDS.map((action) => (
          <ActionTile key={action} action={action} side="upgraded" />
        ))}
      </>,
    )
    expect(html).toContain('Comb Overturn')
  })
})
