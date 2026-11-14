import type { UserRole } from 'game-kit/turns'
import type { Seat } from '../rules'

/** The seat a viewer plays, or null for a spectator. */
export function viewerSeatOf(role: UserRole): Seat | null {
  return role === 'spectator' ? null : role
}

/** Every seat, starting with the viewer's own so the table reads from where they sit; a spectator sees seat order. */
export function seatsFromViewer(playerCount: number, viewer: Seat | null): Seat[] {
  const first = viewer ?? 0
  return Array.from({ length: playerCount }, (_, offset) => (first + offset) % playerCount)
}

/** "Blue", "Blue and Green", "Red, Blue and Green". */
export function joinNames(names: readonly string[]): string {
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}
