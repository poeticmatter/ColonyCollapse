import type { DecisionKind } from '../../rules/decisions'

interface DecisionLabel {
  /** Said to the player who must answer, as an instruction. */
  forActor: string
  /** Said to everyone else, after "<name> is". */
  forOthers: string
}

/** One line per decision kind. Deliberately says nothing about hidden options. */
export const DECISION_LABELS: Readonly<Record<DecisionKind, DecisionLabel>> = {
  rondelMove: { forActor: 'Move the rondel pawn', forOthers: 'moving the rondel pawn' },
  crossPartyFlip: { forActor: 'Flip the tile first? (Cross-Party Address)', forOthers: 'deciding whether to flip a tile (Cross-Party Address)' },
  developExtraRally: { forActor: 'Rally a tile you passed?', forOthers: 'choosing a passed tile to rally' },
  sitePrepFlip: { forActor: 'Flip tiles before rallying (Site Prep)', forOthers: 'choosing tiles to flip (Site Prep)' },
  mediaFlip: { forActor: 'Flip rondel tiles (Media)', forOthers: 'choosing rondel tiles to flip (Media)' },
  pressCycleRally: { forActor: 'Rally a tile you flipped (Press Cycle)', forOthers: 'choosing a flipped tile to rally (Press Cycle)' },
  leveragePick: { forActor: 'Choose a Leverage card', forOthers: 'choosing a Leverage card' },
  dance: { forActor: 'Choose a Dance destination', forOthers: 'choosing a Dance destination' },
  waggleSweep: { forActor: 'Choose a hex to count as 4 (Waggle Sweep)', forOthers: 'choosing a hex for Waggle Sweep' },
  invest: { forActor: 'Invest: move points between issues', forOthers: 'choosing how to Invest' },
  combOverturn: { forActor: 'Flip rondel tiles (Comb Overturn)', forOthers: 'choosing rondel tiles to flip (Comb Overturn)' },
  longFlight: { forActor: 'Choose a Long Flight destination', forOthers: 'choosing a Long Flight destination' },
  longFlightRally: { forActor: 'Rally a hex next to your pawn', forOthers: 'choosing a hex to rally after Long Flight' },
  dissidentRally: { forActor: 'Take control of any tile', forOthers: 'choosing a tile to take over (Dissident Rally)' },
  speakersFavor: { forActor: 'Give the start player marker', forOthers: "choosing who gets the start player marker" },
  wardSweep: { forActor: 'Choose a district to rally', forOthers: 'choosing a district to rally (Ward Sweep)' },
  blueprintRevision: { forActor: 'Upgrade one of your action tiles', forOthers: 'choosing a tile to upgrade (Blueprint Revision)' },
  reserveDeployment: { forActor: 'Deploy an unprogrammed tile at strength 3', forOthers: 'deploying a tile from reserve' },
  forcedDown: { forActor: 'Choose a player and an issue to push down', forOthers: 'choosing a player to push down (Forced Realignment)' },
  forcedUp: { forActor: 'Choose a different issue to go up on', forOthers: 'choosing an issue to go up on (Forced Realignment)' },
  gavelPass: { forActor: 'Pass the start player marker?', forOthers: 'deciding whether to pass the start player marker' },
}
