import type { ReactNode } from 'react'

interface CenteredProps {
  /** Side length of the square being centred. */
  size: number
  children: ReactNode
}

/**
 * Shifts a size x size piece (a tile, disc or pawn) so its centre sits on the
 * origin. BoardView and RondelView draw cell content around the cell's centre,
 * so wrap pieces in this to place them in the middle of the cell.
 */
export function Centered({ size, children }: CenteredProps) {
  return <g transform={`translate(${-size / 2}, ${-size / 2})`}>{children}</g>
}
