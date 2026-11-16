import { IssueTrack, type TrackPosition } from '../../art/IssueTrack'
import { ISSUES } from '../../board/palette'
import { useBoard } from '../context'
import { Panel } from '../Panel'

const TRACK_CELL_WIDTH_PX = 34

/** The six issue tracks with every player's marker. */
export function TracksPanel() {
  const { state, colorOf } = useBoard()
  return (
    <Panel title="Issue tracks">
      <div className="flex flex-col items-center gap-1.5 overflow-x-auto">
        {ISSUES.map((issue) => {
          const positions: TrackPosition[] = state.track[issue].map((position, seat) => ({ seat, position }))
          return <IssueTrack key={issue} issue={issue} positions={positions} colorOf={colorOf} cellWidth={TRACK_CELL_WIDTH_PX} />
        })}
      </div>
      <p className="mt-2 text-center text-xs text-ink-soft">
        Shifts move between neighbouring tracks in this order; Clay and Mauve are not neighbours.
      </p>
    </Panel>
  )
}
