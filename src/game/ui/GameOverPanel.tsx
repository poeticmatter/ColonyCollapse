import { useBoard } from './context'
import { Panel } from './Panel'
import { SeatLabel } from './SeatLabel'
import { rankingRows, tiebreakNote } from './gameOver'

/** Final ranking with VP and the tiebreak that decided it, when one did. */
export function GameOverPanel() {
  const { state, nameOf } = useBoard()
  const rows = rankingRows(state)
  const note = tiebreakNote(rows, nameOf)
  return (
    <Panel title="Final ranking" className="border-accent ring-2 ring-accent">
      <ol className="space-y-1.5">
        {rows.map((row) => (
          <li key={row.seat} className={`flex items-center gap-3 rounded-lg px-2 py-1.5 ${row.place === 1 ? 'bg-slot' : ''}`}>
            <span className="w-6 text-center text-lg font-black">{row.place}</span>
            <span className="flex-1">
              <SeatLabel seat={row.seat} />
            </span>
            <span className="text-sm">
              <b className="text-lg">{row.victoryPoints}</b> VP
            </span>
            <span className="w-24 text-right text-xs text-ink-soft">{row.discs} discs</span>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-xs text-ink-soft">
        {note ?? 'Most victory points wins.'} Ties are broken by control discs on the board, then clockwise order from the final start player.
      </p>
    </Panel>
  )
}
