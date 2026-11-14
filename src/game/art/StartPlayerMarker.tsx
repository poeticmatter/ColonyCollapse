import { Gavel } from 'lucide-react'
import { GOLD_DEEP, GOLD_FILL, GOLD_INK } from '../board/palette'
import { CenteredGlyph, DiscToken } from './DiscToken'

const GAVEL_SIZE = 120

interface StartPlayerMarkerProps {
  size?: number
}

/** The start player token: gold like every neutral marker, with a gavel for "who has the floor". */
export function StartPlayerMarker({ size = 48 }: StartPlayerMarkerProps) {
  return (
    <DiscToken fill={GOLD_FILL} deep={GOLD_DEEP} size={size} label="Start player">
      <CenteredGlyph size={GAVEL_SIZE}>
        <Gavel size={GAVEL_SIZE} strokeWidth={2.3} color={GOLD_INK} aria-hidden />
      </CenteredGlyph>
    </DiscToken>
  )
}
