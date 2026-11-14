import {
  GraduationCap,
  Hammer,
  Handshake,
  Megaphone,
  Newspaper,
  Radio,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'

export const ACTION_IDS = ['address', 'develop', 'media', 'leverage', 'dance', 'intern', 'invest'] as const

export type ActionId = (typeof ACTION_IDS)[number]

export type ActionSide = 'basic' | 'upgraded'

export interface ActionInfo {
  id: ActionId
  name: string
  Icon: LucideIcon
  /** Rules text per side, from Rules v7.1. X is the strength of the slot the action resolves in (1-4). */
  rules: Readonly<Record<ActionSide, string>>
}

/** The seven actions, in the rules' order. The rules document wins over the older prototype assets. */
export const ACTIONS: Readonly<Record<ActionId, ActionInfo>> = {
  address: {
    id: 'address',
    name: 'Address',
    Icon: Megaphone,
    rules: {
      basic:
        "Move the rondel pawn up to X spaces clockwise. Go up 1 space on that tile's issue track, then flip the tile.",
      upgraded:
        "Move the rondel pawn up to X spaces clockwise. Go up 1 space on that tile's issue track, flip the tile, then rally it.",
    },
  },
  develop: {
    id: 'develop',
    name: 'Develop',
    Icon: Hammer,
    rules: {
      basic: 'Move the rondel pawn up to X spaces clockwise. Rally that tile.',
      upgraded:
        'Move the rondel pawn up to X spaces clockwise. Rally that tile, and also rally one tile along the way (not the one you started on).',
    },
  },
  media: {
    id: 'media',
    name: 'Media',
    Icon: Newspaper,
    rules: {
      basic: 'Flip any 1 tile in the rondel. It cannot be flipped by a Media action again this turn.',
      upgraded:
        'Flip any number of tiles in the rondel. They cannot be flipped by a Media action again this turn.',
    },
  },
  leverage: {
    id: 'leverage',
    name: 'Leverage',
    Icon: Handshake,
    rules: {
      basic:
        'Draw X cards and choose one. Resolve any immediate effect on it and place it in front of you, or go up one of its issue tracks.',
      upgraded:
        'Draw X cards and choose one. Resolve any immediate effect on it and place it in front of you, or go up one of its issue tracks; you may do both.',
    },
  },
  dance: {
    id: 'dance',
    name: 'Dance',
    Icon: Radio,
    rules: {
      basic:
        'Move your pawn X spaces on the board, whether or not there is a tile there. Then rally the tile you land on and all adjacent tiles.',
      upgraded:
        'Move your pawn X spaces on the board. Then rally the tile you land on and all adjacent tiles; you need only be tied on the issue track to gain control.',
    },
  },
  intern: {
    id: 'intern',
    name: 'Intern',
    Icon: GraduationCap,
    rules: {
      basic: 'Resolve the action tile in the previous slot at strength 1, standard version.',
      upgraded: 'Resolve the action tile in the previous slot at strength 1, upgraded version.',
    },
  },
  invest: {
    id: 'invest',
    name: 'Invest',
    Icon: TrendingUp,
    rules: {
      basic:
        'Choose an issue track. Go down up to X spaces on it to go up that many spaces on an adjacent track.',
      upgraded:
        'Choose an issue track. Go down up to X spaces on it to go up that many spaces on any other track.',
    },
  },
}
