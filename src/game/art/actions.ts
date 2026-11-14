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
  /** Rules text per side, as this build plays it. X is the strength of the slot the action resolves in (1-4). */
  rules: Readonly<Record<ActionSide, string>>
}

/**
 * The seven actions, in the rules' order. The rules text is what this build does
 * (docs/digital-rules.md), which wins over the rules doc and the older prototype assets.
 */
export const ACTIONS: Readonly<Record<ActionId, ActionInfo>> = {
  address: {
    id: 'address',
    name: 'Address',
    Icon: Megaphone,
    rules: {
      basic: "Move the rondel pawn 1 to X spaces clockwise. Go up 1 on that tile's issue, then flip the tile.",
      upgraded: "Move the rondel pawn 1 to X spaces clockwise. Go up 1 on that tile's issue, flip the tile, then rally it.",
    },
  },
  develop: {
    id: 'develop',
    name: 'Develop',
    Icon: Hammer,
    rules: {
      basic: 'Move the rondel pawn 1 to X spaces clockwise. Rally the tile it stops on.',
      upgraded:
        'Move the rondel pawn 1 to X spaces clockwise. Rally the tile it stops on, and you may also rally one tile it passed on the way.',
    },
  },
  media: {
    id: 'media',
    name: 'Media',
    Icon: Newspaper,
    rules: {
      basic: 'You may flip 1 rondel tile. No Media can flip it again this slot.',
      upgraded: 'Flip any number of rondel tiles. No Media can flip them again this slot.',
    },
  },
  leverage: {
    id: 'leverage',
    name: 'Leverage',
    Icon: Handshake,
    rules: {
      basic:
        'Draw X cards and keep 1. Either play its effect and place it in front of you, or go up 1 on one of its 2 issues.',
      upgraded: 'Draw X cards and keep 1. Play its effect and place it in front of you, then you may also go up 1 on one of its 2 issues.',
    },
  },
  dance: {
    id: 'dance',
    name: 'Dance',
    Icon: Radio,
    rules: {
      basic:
        "Move your pawn 1 to X hexes, never into or through another pawn's hex. Then rally the hex it lands on and every hex next to it.",
      upgraded:
        "Move your pawn 1 to X hexes, never into or through another pawn's hex. Then rally the hex it lands on and every hex next to it; a tie with the disc owner is enough.",
    },
  },
  intern: {
    id: 'intern',
    name: 'Intern',
    Icon: GraduationCap,
    rules: {
      basic: 'Resolve the tile in your previous slot again at strength 1, on its standard side. Does nothing in slot 1.',
      upgraded: 'Resolve the tile in your previous slot again at strength 1, on its upgraded side. Does nothing in slot 1.',
    },
  },
  invest: {
    id: 'invest',
    name: 'Invest',
    Icon: TrendingUp,
    rules: {
      basic: 'Go down 0 to X on one issue, then up the same amount on a neighbouring issue (Clay and Mauve are not neighbours).',
      upgraded: 'Go down 0 to X on one issue, then up the same amount on any other issue.',
    },
  },
}
