import { PlayerPawn } from '../art/PlayerPawn'
import type { Seat } from '../rules'
import { useBoard } from './context'

interface SeatLabelProps {
  seat: Seat
  /** Adds "(you)" after the viewer's own name. */
  marksViewer?: boolean
}

/** A player's pawn in their colour followed by their name. */
export function SeatLabel({ seat, marksViewer = true }: SeatLabelProps) {
  const { nameOf, colorOf, viewerSeat } = useBoard()
  return (
    <span className="inline-flex items-center gap-1.5 font-semibold">
      <PlayerPawn color={colorOf(seat)} size={20} />
      <span>{nameOf(seat)}</span>
      {marksViewer && seat === viewerSeat && <span className="font-normal text-ink-soft">(you)</span>}
    </span>
  )
}
