import type { ReactNode } from 'react'

export const DISC_TOKEN_VIEWBOX_SIZE = 240
const CENTER = DISC_TOKEN_VIEWBOX_SIZE / 2
const RIM_INSET = 8
const GUIDE_RING_INSET = 22
/** How far a halo pushes the disc inwards. */
const HALO_INSET = 6
export const DISC_GLYPH_SIZE = 128

interface DiscTokenProps {
  fill: string
  deep: string
  size: number
  /** Optional ring drawn around the rim, so a pawn stands out over a disc beneath it. */
  haloColor?: string
  /** Drawn in the token's 240x240 coordinate space. */
  children: ReactNode
  label?: string
}

/** The one disc shape every token shares: a flat colour, a deep rim and a faint guide ring. */
export function DiscToken({ fill, deep, size, haloColor, children, label }: DiscTokenProps) {
  const inset = haloColor ? HALO_INSET : 0
  return (
    <svg
      viewBox={`0 0 ${DISC_TOKEN_VIEWBOX_SIZE} ${DISC_TOKEN_VIEWBOX_SIZE}`}
      width={size}
      height={size}
      className="block select-none"
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
    >
      {label && <title>{label}</title>}
      {haloColor && <circle cx={CENTER} cy={CENTER} r={CENTER - 2} fill="none" stroke={haloColor} strokeWidth="8" />}
      <circle cx={CENTER} cy={CENTER} r={CENTER - RIM_INSET - inset} fill={fill} stroke={deep} strokeWidth="10" />
      <circle
        cx={CENTER}
        cy={CENTER}
        r={CENTER - GUIDE_RING_INSET - inset}
        fill="none"
        stroke={deep}
        strokeWidth="2.5"
        strokeOpacity="0.45"
      />
      {children}
    </svg>
  )
}

interface CenteredGlyphProps {
  size?: number
  children: ReactNode
}

/** Places a glyph of `size` in the middle of the disc's coordinate space. */
export function CenteredGlyph({ size = DISC_GLYPH_SIZE, children }: CenteredGlyphProps) {
  const offset = (DISC_TOKEN_VIEWBOX_SIZE - size) / 2
  return <g transform={`translate(${offset}, ${offset})`}>{children}</g>
}
