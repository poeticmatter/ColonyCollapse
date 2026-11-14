import { useBoard } from '../context'
import { Panel } from '../Panel'
import { OtherPlayerRow } from './OtherPlayerRow'
import { OwnBoard } from './OwnBoard'

/** Everyone at the table, the viewer first with their own board. Spectators see public information only. */
export function PlayersPanel() {
  const { seatsFromViewer, viewerSeat } = useBoard()
  return (
    <Panel title="Players">
      <div className="grid gap-2.5 md:grid-cols-2">
        {seatsFromViewer.map((seat) =>
          seat === viewerSeat ? (
            <div key={seat} className="md:col-span-2">
              <OwnBoard seat={seat} />
            </div>
          ) : (
            <OtherPlayerRow key={seat} seat={seat} />
          ),
        )}
      </div>
    </Panel>
  )
}
