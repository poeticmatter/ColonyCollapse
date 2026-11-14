import { GOLD_DEEP, GOLD_FILL, PEWTER_DEEP, PEWTER_FILL, PEWTER_INK } from '../board/palette'
import { BeeMark } from './BeeMark'

const TOKEN_SIZE = 240
const CENTER = TOKEN_SIZE / 2
const DISC_RADIUS = 80
const GLYPH_SIZE = 96

// The pointer is a diamond straddling the rim: its outer tip aims at the slot,
// its inner tip reaches over the disc towards the bee.
const NOSE_TIP_Y = CENTER - DISC_RADIUS - 30
const NOSE_WIDEST_Y = CENTER - DISC_RADIUS + 4
const NOSE_INNER_TIP_Y = CENTER - DISC_RADIUS + 30
const NOSE_HALF_WIDTH = 22

/** The token's disc radius in its own 240-unit space, for scaling it to a socket. */
export const DIAL_TOKEN_DISC_RADIUS = DISC_RADIUS
export const DIAL_TOKEN_VIEWBOX_SIZE = TOKEN_SIZE

interface DialTokenProps {
  size?: number
  /** Clockwise turn about the centre; 0 points straight up. */
  rotationDegrees?: number
}

/** The dial that sits in the rondel's central socket and rotates to point at the active slot. */
export function DialToken({ size = TOKEN_SIZE, rotationDegrees = 0 }: DialTokenProps) {
  return (
    <svg viewBox={`0 0 ${TOKEN_SIZE} ${TOKEN_SIZE}`} width={size} height={size} className="block select-none" aria-hidden>
      <g transform={`rotate(${rotationDegrees}, ${CENTER}, ${CENTER})`}>
        <circle cx={CENTER} cy={CENTER} r={DISC_RADIUS} fill={PEWTER_FILL} stroke={PEWTER_DEEP} strokeWidth="10" />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={DISC_RADIUS - 16}
          fill="none"
          stroke={PEWTER_DEEP}
          strokeWidth="2.5"
          strokeOpacity="0.4"
        />
        <polygon
          points={`${CENTER},${NOSE_TIP_Y} ${CENTER + NOSE_HALF_WIDTH},${NOSE_WIDEST_Y} ${CENTER},${NOSE_INNER_TIP_Y} ${CENTER - NOSE_HALF_WIDTH},${NOSE_WIDEST_Y}`}
          fill={GOLD_FILL}
          stroke={GOLD_DEEP}
          strokeWidth="6"
          strokeLinejoin="round"
        />
        <g transform={`translate(${CENTER - GLYPH_SIZE / 2}, ${CENTER - GLYPH_SIZE / 2})`}>
          <BeeMark size={GLYPH_SIZE} bodyColor={PEWTER_INK} stripeColor={PEWTER_FILL} />
        </g>
      </g>
    </svg>
  )
}
