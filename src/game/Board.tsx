import type { BoardProps } from 'game-kit/turns'
import type { GameState, Move } from './rules'
import { ActionPanel } from './ui/ActionPanel'
import { BoardPanel } from './ui/board/BoardPanel'
import { RondelPanel } from './ui/board/RondelPanel'
import { TracksPanel } from './ui/board/TracksPanel'
import { BoardProvider } from './ui/context'
import { LogPanel } from './ui/LogPanel'
import { PlayersPanel } from './ui/players/PlayersPanel'
import { SpatialSelectionProvider } from './ui/spatial'
import { StatusHeader } from './ui/StatusHeader'

/** The Colony Collapse screen. The areas are laid out by `.colony-layout` in index.css. */
export function ColonyBoard(props: BoardProps<GameState, Move>) {
  return (
    <BoardProvider boardProps={props}>
      <SpatialSelectionProvider>
        <div className="colony-layout mx-auto max-w-[1500px] p-3">
          <div style={{ gridArea: 'header' }}>
            <StatusHeader />
          </div>
          <div style={{ gridArea: 'action' }}>
            <ActionPanel />
          </div>
          <div style={{ gridArea: 'board' }}>
            <BoardPanel />
          </div>
          <div style={{ gridArea: 'rondel' }}>
            <RondelPanel />
          </div>
          <div style={{ gridArea: 'tracks' }}>
            <TracksPanel />
          </div>
          <div style={{ gridArea: 'players' }}>
            <PlayersPanel />
          </div>
          <div style={{ gridArea: 'log' }}>
            <LogPanel />
          </div>
        </div>
      </SpatialSelectionProvider>
    </BoardProvider>
  )
}
