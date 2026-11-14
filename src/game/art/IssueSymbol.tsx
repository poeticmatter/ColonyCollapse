import { Droplet, Flower, Leaf, Rocket, Scale, Sun, type LucideIcon } from 'lucide-react'
import { ISSUE_INK, type Issue } from '../board/palette'

/**
 * Colour-blind redundancy: one distinct silhouette per issue, never reused.
 * Themed to a bee colony settling a new planet.
 */
export const ISSUE_ICONS: Readonly<Record<Issue, LucideIcon>> = {
  Clay: Sun,
  Sage: Leaf,
  Periwinkle: Rocket,
  Stone: Scale,
  Seafoam: Droplet,
  Mauve: Flower,
}

interface IssueSymbolProps {
  issue: Issue
  size?: number
  strokeWidth?: number
  /** Overrides the issue's ink colour, e.g. for a symbol on a dark background. */
  color?: string
}

export function IssueSymbol({ issue, size = 24, strokeWidth = 2.2, color }: IssueSymbolProps) {
  const Icon = ISSUE_ICONS[issue]
  return <Icon size={size} strokeWidth={strokeWidth} color={color ?? ISSUE_INK[issue]} aria-hidden />
}
