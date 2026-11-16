import { splitLogText } from '../rules'
import { useBoard } from './context'
import { Panel } from './Panel'
import { SeatLabel } from './SeatLabel'

const VISIBLE_ENTRY_COUNT = 15

/** The latest events, newest first. */
export function LogPanel() {
  const { state } = useBoard()
  const entries = state.log.slice(-VISIBLE_ENTRY_COUNT).reverse()
  return (
    <Panel>
      <details open>
        <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-ink-soft">Log</summary>
        <ol className="mt-2 space-y-1 text-sm">
          {entries.map((entry, index) => (
            <li key={`${state.log.length - index}`} className={index === 0 ? 'font-semibold' : 'text-ink-soft'}>
              <span className="mr-1.5 text-xs text-ink-faint">
                R{entry.round}
              </span>
              <LogText text={entry.text} />
            </li>
          ))}
        </ol>
      </details>
    </Panel>
  )
}

/** Log text with each named seat drawn as that seat looks to this viewer. */
function LogText({ text }: { text: string }) {
  return (
    <>
      {splitLogText(text).map((part, index) =>
        part.kind === 'seat' ? <SeatLabel key={index} seat={part.seat} marksViewer={false} /> : <span key={index}>{part.text}</span>,
      )}
    </>
  )
}
