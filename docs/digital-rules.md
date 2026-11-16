# Colony Collapse — rules as implemented (digital build, action-point branch)

This branch (`explore/action-tension`) drops the action-tile programming of Rules v7.1. Players instead spend action points on their own turn. This file is what the code does. Items marked **[assumed]** are the build's own call; check them in playtests.

## Components

- **Issues:** Clay, Sage, Periwinkle, Stone, Seafoam, Mauve. This ring order is clockwise. Tracks run from **−2 to +4**, and everyone starts on 0. A move past either end stops at the end.
- **Board:** 37 hexes: the hub, a centre ring of 6 printed issue hexes (one per district), and 30 tile slots (5 per district). Each slot is numbered by the round it fills in (asset "irregular" layout).
- **Hex tiles:** 30 tiles, 2 copies of each of the 15 colour pairs. A tile's issue is the colour face up. A drawn tile comes up on a random side.
- **Rondel:** 6 slots. Slot *i* belongs to district *i* (ring order). A **dial** points at one slot. A **mark** sits between slot 6 and slot 1.
- **Per player:** one pawn in the hub and unlimited control discs.
- **Players:** 2–5, coloured Red, Blue, Green, Violet, Yellow.

No cards and no action tiles.

## Setup

1. Shuffle the bag and deal 6 tiles into the rondel.
2. The dial points at slot 1.
3. Everyone starts on 0 on every track.
4. A random player takes the first turn.

## Turns

Players take turns clockwise. On your turn you have **5 action points**, and you can spend them in any order, on any mix of actions, as many times as you like:

| Cost | Action |
|---|---|
| 1 | **Turn the dial** one more step. |
| 1 | **Move your pawn** one hex. |
| 1 | **Rally the dial tile**: the tile the dial points at. |
| 1 | **Address the dial tile**: go up 1 on its issue, then flip it. |
| 1 | **Shift**: go up 1 on one track and down 1 on an adjacent track. |
| 3 | **Rally around your pawn**: the hex it stands on and every adjacent hex. Not while it is in the hub. |

Your turn ends when you have spent all your points or choose to stop. Unspent points are lost. Then **the dial turns one step**.

### The mark ends the round

The round ends when the dial passes the mark (from slot 6 to slot 1):

- **By the end-of-turn step:** Polling happens right away.
- **By a paid step:** your turn ends at once, and your remaining points are lost. Polling happens right away, and there is no end-of-turn step.

So a round is one lap of the dial: at most 6 turns shared across the table, and fewer if anyone pays to turn the dial. After Polling, the next player clockwise takes the first turn of the new round, with the dial on slot 1.

### Action details

- **Move your pawn:** to an adjacent hex. A pawn can never enter a hex holding another pawn. The hub holds any number of pawns, but once a pawn has left the hub it can never go back.
- **Address:** going up stops at +4; the tile is flipped either way.
- **Shift:** the two tracks must be neighbours in ring order (no wrap: Clay and Mauve are not adjacent). You can't use a track that is at −2 to go down, or a track at +4 to go up **[assumed: mirrors the −2 ruling]**.
- **Rallies that would change nothing can't be bought** **[assumed]**: rallying the dial tile needs it to change hands, and rallying around your pawn needs at least one hex to change hands.

## Rally

To rally a hex (a tile or a printed hex; never the hub or an empty slot) means comparing yourself with its **disc**:

- **No disc:** you place one if your position on the hex's issue is ≥ 0.
- **Someone else's disc:** you replace it if your position is *higher* than the disc owner's on that issue.
- **Your own disc:** nothing happens.

A disc placed on a rondel tile travels with the tile to the board.

## Pawns and temporary control

A pawn standing on **any** board hex (tile, printed hex or empty slot) gives its owner control of that hex while it stays there, disc or not. Rallying compares you with the disc owner, not with a pawn standing on the hex.

## Polling (when the round ends)

1. **Placing tiles:** all 6 rondel tiles go to the board: slot *i*'s tile goes to district *i*, on the slot for this round. If that slot is taken, it goes to the next higher-numbered free slot, wrapping to the lower ones **[assumed: wrap]**. If the district is full, it tries the next district clockwise the same way.
2. **Tiles without a disc** take one from the leader of their issue: the single highest position, which must be ≥ 0. If there is a tie for the lead or no one is on 0 or above, the tile stays uncontrolled.
3. **Scoring each district:** each player counts the hexes they control there (tiles and the printed hex), with pawns giving temporary control. The most hexes earns **R VP in round R** (1/2/3/4/5). A tie goes to whichever tied player controls the printed hex. If none of them does, nobody scores.
4. Refill the rondel with 6 tiles. The dial is on slot 1.

## Game end

The game ends after round 5's Polling. Most VP wins. Ties go to the most control discs on the board, then to whoever is earliest in clockwise order from the player who took the first turn of round 5 **[assumed]**.

## Digital-only

- Undo works within your own turn, except a move that ends the round (it draws new tiles). The kit warns before such a move and sends the turn at once.
- **Bots:** the lobby can fill seats with bots. A bot plans its whole turn by searching sequences of actions and scoring where each one leaves the board. It sees only public information: the bag order stays hidden from it.
