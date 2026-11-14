import { useBoard } from '../context'
import type { DistrictStanding } from '../../rules'
import type { Round } from '../../board/geometry'

const BADGE_OFFSET_Y = 58
const BADGE_HALF_WIDTH = 30
const BADGE_HEIGHT = 26
const NEUTRAL_FILL = '#334155'
const NEUTRAL_INK = '#E2E8F0'

/** Who would win this district if the round ended now, and the VP they would take. Sits under the printed hex's symbol. */
export function DistrictBadge({ standing, round }: { standing: DistrictStanding; round: Round }) {
  const { colorOf, nameOf } = useBoard()
  const leader = standing.winner
  const fill = leader === null ? NEUTRAL_FILL : colorOf(leader).fill
  const ink = leader === null ? NEUTRAL_INK : colorOf(leader).ink
  const label = leader === null ? 'Nobody leads' : `${nameOf(leader)} leads`
  return (
    <g transform={`translate(0, ${BADGE_OFFSET_Y})`} pointerEvents="none">
      <title>{`${standing.issue}: ${label}, ${round} VP at stake this round`}</title>
      <rect
        x={-BADGE_HALF_WIDTH}
        y={-BADGE_HEIGHT / 2}
        width={BADGE_HALF_WIDTH * 2}
        height={BADGE_HEIGHT}
        rx={BADGE_HEIGHT / 2}
        fill={fill}
        stroke="#0F1626"
        strokeWidth="3"
      />
      <text textAnchor="middle" dominantBaseline="central" fontSize="17" fontWeight="800" fill={ink}>
        {leader === null ? '—' : `+${round}`}
      </text>
    </g>
  )
}
