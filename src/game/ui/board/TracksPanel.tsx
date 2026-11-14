import { ACTIONS } from '../../art/actions'
import { IssueTrack, type TrackPosition } from '../../art/IssueTrack'
import { ISSUES } from '../../board/palette'
import { useBoard } from '../context'
import { Panel } from '../Panel'

const TRACK_CELL_WIDTH_PX = 34

/** The six issue tracks with every player's marker, plus the action no track upgrades. */
export function TracksPanel() {
  const { state, colorOf } = useBoard()
  const setAside = ACTIONS[state.setAsideAction]
  return (
    <Panel title="Issue tracks">
      <div className="flex flex-col items-center gap-1.5 overflow-x-auto">
        {ISSUES.map((issue) => {
          const positions: TrackPosition[] = state.track[issue].map((position, seat) => ({ seat, position }))
          return (
            <IssueTrack
              key={issue}
              issue={issue}
              positions={positions}
              colorOf={colorOf}
              upgradeIcon={ACTIONS[state.trackAction[issue]].Icon}
              cellWidth={TRACK_CELL_WIDTH_PX}
            />
          )
        })}
      </div>
      <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-ink-soft">
        Reaching +3 upgrades the shown action. Set aside, no track upgrades it:
        <setAside.Icon size={14} aria-hidden />
        <b className="text-ink">{setAside.name}</b>
      </p>
    </Panel>
  )
}
