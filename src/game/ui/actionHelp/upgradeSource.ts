import type { ActionId } from '../../art/actions'
import { ISSUES } from '../../board/palette'
import { TRACK_UPGRADE_SPACE } from '../../board/track'
import type { GameState } from '../../rules'

/** How a player gets this action's upgraded side, as one sentence. */
export function upgradeSourceText(state: GameState, action: ActionId): string {
  const issue = ISSUES.find((candidate) => state.trackAction[candidate] === action)
  if (issue === undefined) return 'Set aside this game: only a card (Blueprint Revision) can upgrade it.'
  return `Upgrades the first time you reach ${TRACK_UPGRADE_SPACE} on ${issue}.`
}
