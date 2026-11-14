import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { BoardProps, Seating } from 'game-kit/turns'
import { getPlayerColor, type PlayerColor } from '../board/palette'
import type { GameState, Move, Seat } from '../rules'
import { seatsFromViewer, viewerSeatOf } from './seating'

/** What every part of the board needs, provided once so it never has to be drilled through props. */
interface BoardContextValue {
  state: GameState
  /** The seat this browser plays, or null when watching. */
  viewerSeat: Seat | null
  seating: Seating
  /** Seats from the viewer's own, round the table. */
  seatsFromViewer: Seat[]
  onMove: (move: Move) => void
  nameOf: (seat: Seat) => string
  /** The colour to draw a seat's pieces in; always goes through GameKit's `lookOf`. */
  colorOf: (seat: Seat) => PlayerColor
}

const BoardContext = createContext<BoardContextValue | null>(null)

export function useBoard(): BoardContextValue {
  const value = useContext(BoardContext)
  if (!value) throw new Error('useBoard must be used inside a BoardProvider')
  return value
}

interface BoardProviderProps {
  boardProps: BoardProps<GameState, Move>
  children: ReactNode
}

export function BoardProvider({ boardProps, children }: BoardProviderProps) {
  const { state, role, players, onMove, seating, lookOf } = boardProps
  const value = useMemo<BoardContextValue>(() => {
    const viewerSeat = viewerSeatOf(role)
    return {
      state,
      viewerSeat,
      seating,
      seatsFromViewer: seatsFromViewer(state.playerCount, viewerSeat),
      onMove,
      nameOf: (seat) => players[seat]?.name || getPlayerColor(lookOf(seat)).name,
      colorOf: (seat) => getPlayerColor(lookOf(seat)),
    }
  }, [state, role, players, onMove, seating, lookOf])
  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>
}
