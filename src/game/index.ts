import type { GameModule } from 'game-kit/turns'
import { PLAYER_COLORS } from './board/palette'
import { ColonyBoard } from './Board'
import { colonyRules } from './rules'
import type { GameState, Move, Settings } from './rules'
import { ColonySettingsForm } from './SettingsForm'

const MIN_PLAYERS = 2

/** The game plugged into GameKit. */
export const game: GameModule<Settings, GameState, Move> = {
  rules: colonyRules,
  minPlayers: MIN_PLAYERS,
  maxPlayers: PLAYER_COLORS.length,
  defaultSettings: {},
  playerAppearance: (index) => {
    const { name, fill } = PLAYER_COLORS[index]
    return { name, color: fill }
  },
  SettingsForm: ColonySettingsForm,
  Board: ColonyBoard,
}
