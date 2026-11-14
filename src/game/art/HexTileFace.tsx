import { hexPointsAt } from '../board/geometry'
import { ISSUE_DEEP, ISSUE_FILL, type Issue } from '../board/palette'
import { IssueSymbol } from './IssueSymbol'

const VIEWBOX_SIZE = 300
const CENTER = VIEWBOX_SIZE / 2
const OUTER_RADIUS = 132
const INNER_BORDER_INSET = 9

// The face icon and the reverse-colour badge sit off centre, mirrored across
// it, so a control disc placed in the middle leaves both readable.
const BADGE_CENTER = { x: CENTER, y: 226 }
const BADGE_RADIUS = 38
const BADGE_ICON_SIZE = 34
const FACE_ICON_CENTER = { x: CENTER, y: VIEWBOX_SIZE - BADGE_CENTER.y }
const FACE_ICON_SIZE = 56

/** The icon's height above a hex's centre, as a fraction of its radius, so printed cells can match tiles. */
export const FACE_ICON_RISE_RATIO = (CENTER - FACE_ICON_CENTER.y) / OUTER_RADIUS
export const FACE_ICON_SIZE_RATIO = FACE_ICON_SIZE / OUTER_RADIUS

/** Side of the square HexTileFace needs for its hex to have circumradius `radius`. */
export function hexTileSizeForRadius(radius: number): number {
  return (VIEWBOX_SIZE * radius) / OUTER_RADIUS
}

interface HexTileFaceProps {
  /** The colour showing: the tile's current issue. */
  face: Issue
  /** The colour on the reverse, shown as a small badge. */
  back: Issue
  size?: number
}

/** One side of a double-sided hex tile; the hex's centre is the centre of the square. */
export function HexTileFace({ face, back, size = 120 }: HexTileFaceProps) {
  return (
    <svg viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`} width={size} height={size} className="block select-none">
      <title>{`${face} (reverse: ${back})`}</title>
      <polygon points={hexPointsAt(CENTER, CENTER, OUTER_RADIUS)} fill={ISSUE_FILL[face]} />
      <polygon
        points={hexPointsAt(CENTER, CENTER, OUTER_RADIUS - INNER_BORDER_INSET)}
        fill="none"
        stroke={ISSUE_DEEP[face]}
        strokeWidth="4"
        strokeOpacity="0.55"
      />
      <g transform={`translate(${FACE_ICON_CENTER.x - FACE_ICON_SIZE / 2}, ${FACE_ICON_CENTER.y - FACE_ICON_SIZE / 2})`}>
        <IssueSymbol issue={face} size={FACE_ICON_SIZE} strokeWidth={2.2} />
      </g>
      <polygon
        points={hexPointsAt(BADGE_CENTER.x, BADGE_CENTER.y, BADGE_RADIUS)}
        fill={ISSUE_FILL[back]}
        stroke={ISSUE_DEEP[back]}
        strokeWidth="2.5"
        strokeOpacity="0.6"
      />
      <polygon
        points={hexPointsAt(BADGE_CENTER.x, BADGE_CENTER.y, BADGE_RADIUS - 6)}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeOpacity="0.35"
      />
      <g transform={`translate(${BADGE_CENTER.x - BADGE_ICON_SIZE / 2}, ${BADGE_CENTER.y - BADGE_ICON_SIZE / 2})`}>
        <IssueSymbol issue={back} size={BADGE_ICON_SIZE} strokeWidth={2.4} />
      </g>
    </svg>
  )
}
