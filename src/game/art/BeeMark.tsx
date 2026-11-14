interface BeeMarkProps {
  size?: number
  bodyColor: string
  stripeColor: string
}

/**
 * The bee glyph used wherever a token or emblem needs to read as "a bee": a
 * rounded body with two banded stripes, no wings or head, centred in a 48x48 box.
 */
export function BeeMark({ size = 48, bodyColor, stripeColor }: BeeMarkProps) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden>
      <g transform="translate(24, 25)">
        <path d="M -15 -5 Q 0 -20 15 -5 Q 10 10 0 15 Q -10 10 -15 -5 Z" fill={bodyColor} />
        {/* Each stripe follows the body's edge at that height and bows gently upward, like a contour line. */}
        <path d="M -12 1.5 Q 0 -1.5 12 1.5" stroke={stripeColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M -8 8 Q 0 5 8 8" stroke={stripeColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  )
}
