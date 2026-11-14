# Colony Collapse — rules as implemented (digital build)

Source: `Colony Collapse - Rules v7.1 11-02-26.md`, plus the designer's answers to the build questions (Nov 2026). Where this file and the rules doc differ, this file is what the code does. Items marked **[assumed]** were not asked; they are the build's own call and are worth checking in playtests.

## Components

- **Issues:** Clay, Sage, Periwinkle, Stone, Seafoam, Mauve. This ring order is clockwise. Tracks run from **−2 to +4**, and everyone starts on 0. Moves past either end stop at the end.
- **Board:** 37 hexes: the hub, a centre ring of 6 printed issue hexes (one per district), and 30 tile slots (5 per district). Each slot is numbered by the round it fills in (asset "irregular" layout).
- **Hex tiles:** 30 tiles, 2 copies of each of the 15 colour pairs. A tile's issue is the colour face up. A drawn tile comes up on a random side.
- **Rondel:** 6 slots. Slot *i* belongs to district *i* (ring order). There is one shared rondel pawn, which starts at slot 1 and stays where it was left.
- **Seed cards:** 45 (18 abilities, see `src/game/data/cards.ts`). Each card has 2 issues and is Immediate or Ongoing.
- **Per player:** 7 action tiles (standard / upgraded side), one pawn in the hub, and unlimited control discs.
- **Players:** 2–5, coloured Red, Blue, Green, Violet, Yellow.

## Setup

1. Shuffle the bag and deal 6 tiles into the rondel.
2. Randomly assign 6 of the 7 actions to the 6 issue tracks, once for the whole table. The 7th action is set aside; it can only be upgraded by a card.
3. Deal each player one seed card: they go up 1 on its 1st issue and down 1 on its 2nd, then discard it. (A separate starting deck may come later.)
4. Choose the start player at random.

## Round (×5)

1. **Refill** the rondel to 6 tiles (not needed in round 1).
2. **Programming:** every player at once, secretly, puts 4 *different* tiles of their 7 into slots 1–4. The other 3 are their unprogrammed ("set aside") tiles this round. A plan can be changed until it is sent, and it can't be changed after that.
3. **Resolution:** slots 1→4. Each slot, in clockwise seat order from the start player as of the start of that slot, each player reveals their tile and resolves it at **strength X = slot number**, on the tile's current side.
4. **Polling** (below).
5. **Pass the start player marker** one seat clockwise (not after round 5). **[designer, after simulations]** Without this the same player acts last in every slot all game, and in bot games that seat won about twice its share.

The game ends after round 5's polling.

## Rally

To rally a hex (a tile or a printed hex; never the hub or an empty slot) means comparing yourself with its **disc**:

- **No disc:** you place one if your position on the hex's issue is ≥ 0.
- **Someone else's disc:** you replace it if your position is *higher* than the disc owner's on that issue. Tied is enough with upgraded Dance.
- **Your own disc:** nothing happens.

**[assumed]** Rallying compares you with the **disc owner**, not with a pawn standing on the hex: pawns give only temporary control (below), and rallying changes the disc.

## Pawns and temporary control

- A pawn standing on **any** board hex (tile, printed hex or empty slot) gives its owner control of that hex while it stays there, disc or not. This is the only way besides rallying to control a printed hex.
- A pawn can never enter a hex holding another pawn, even in passing. The hub holds any number of pawns, but once a pawn has left the hub it can never go back.
- **Swift Withdrawal** (Ongoing): your disc still counts for you while an opponent's pawn stands on it.

## The actions (X = strength)

| Action | Standard | Upgraded |
|---|---|---|
| **Address** | Move the rondel pawn **1..X** clockwise. Go up 1 on that tile's issue, then flip the tile. | Then rally the flipped tile. |
| **Develop** | Move the rondel pawn **1..X** clockwise. Rally that tile. | Also rally one tile passed on the way (not the start, not the destination). Optional. |
| **Media** | Flip 0 or 1 rondel tile. | Flip any number of rondel tiles. |
| **Leverage** | Draw X cards and keep 1; the rest are discarded. **Either** resolve its effect and place it in front of you, **or** go up 1 on one of its 2 issues (the card is then discarded). | You may do both: the effect first, then up. |
| **Dance** | Move one of your pawns **1..X** steps, hex to hex. Then rally the hex it lands on and every adjacent hex. | Tied with the disc owner is enough to take control. |
| **Intern** | Resolve the tile in your previous slot at strength 1, standard side. In slot 1 it does nothing. | Same, upgraded side. |
| **Invest** | Choose a track and go down 0..X on it, then go up the same number on an **adjacent** track (ring order, no wrap: Clay and Mauve are not adjacent). | The second track can be any other track. |

**Media lock:** a tile flipped by Media can't be flipped by Media again during this slot's resolution, by anyone. Other flips (Address, cards) ignore the lock.

**Down then up:** with Invest you go up only as many spaces as you actually went down, after stopping at −2.

**Optional actions:** an action can be partly or fully declined (flip nothing, invest 0, skip the optional rally). Rondel moves and Dance must move at least 1.

**Upgrades:** the first time a player reaches space 3 on a track, their tile for that track's action flips to upgraded at once. If that tile is programmed in a later slot this round, it resolves upgraded. Going back to 3 again gives nothing, and neither does reaching 3 when the tile is already upgraded.

**Intern + tiles:** each player has one Intern, so Intern never copies Intern. **[assumed]** Intern copies what is printed on the previous slot's tile, not whatever that tile did (for example, it doesn't copy what an earlier Intern copied).

## Cards (as implemented)

**Immediate**

| Card | Effect |
|---|---|
| Comb Overturn | Flip any number of rondel tiles. The Media lock doesn't apply. |
| Long Flight | Move one of your pawns to any hex except the hub that has no other pawn on it, then rally one hex adjacent to it. |
| Dissident Rally | Take control of any one tile, ignoring the comparison. **[assumed]** Rondel and board tiles qualify; printed hexes don't, since the card says "tile". |
| Speaker's Favor | Give the start player marker to any player, including yourself. It takes effect from the next slot. |
| Ward Sweep | Rally every hex in one district. **[assumed]** That includes its printed hex. |
| Blueprint Revision | Upgrade one of your action tiles, including the set-aside action. |
| Reserve Deployment | Resolve one of your 3 unprogrammed tiles this round at strength 3, on its current side. **[assumed]** Once played, the card is spent. Intern resolved this way copies the tile in the slot before the current one. |
| Forced Realignment | Choose another player and an issue: they go down 1 on it, then *they* choose a different issue to go up 1. |
| Second Dancer | Add a second pawn of yours to the hub. When you Dance or Long Flight, move one of your pawns. |

**Ongoing** (they stay active in front of you)

| Card | Effect |
|---|---|
| Deferred Gavel | At the end of any of your actions, if you hold the start player marker, you may pass it to the next player clockwise. It takes effect from the next slot. |
| Echoing Decree | When you resolve an Immediate card's effect, resolve it a second time, then discard Echoing Decree. **[assumed]** It triggers only if you choose the effect, not "go up". |
| Cross-Party Address | ADDRESS: you may flip the tile before going up. |
| Site Prep | DEVELOP: you may flip the tile(s) before rallying. |
| Policy Trade | LEVERAGE: instead of going up on one of the card's issues, you may swap your positions on its two issues. |
| Waggle Sweep | DANCE: you may count as being on 4 of the issue for one of the hexes Dance rallies. |
| Extra Hands | INTERN: strength 2 instead of 1. |
| Press Cycle | MEDIA: rally one tile you flipped with that action. |
| Swift Withdrawal | Your discs still count for you while an opponent's pawn stands on them. |

## Polling (end of each round)

1. **Placing tiles:** rondel slot *i*'s tile goes to district *i*, on the slot for this round. If that slot is taken, it goes to the next higher-numbered free slot, wrapping to the lower ones **[assumed: wrap]**. If the district is full, it tries the next district clockwise the same way.
2. **Tiles without a disc** take one from the leader of their issue: the single highest position, which must be ≥ 0. If there is a tie for the lead or no one is on 0 or above, the tile stays uncontrolled.
3. **Scoring each district:** each player counts the hexes they control there (tiles and the printed hex), with pawns giving temporary control. The most hexes earns **R VP in round R** (1/2/3/4/5). A tie goes to whichever tied player controls the printed hex. If none of them does, nobody scores.

## Game end

Most VP wins. Ties go to the most control discs on the board, then to whoever is earliest in clockwise order from the final start player (round 5's, since the marker doesn't pass after the last round).

## Digital-only

- Plans are hidden by the board but stored in the shared game record. That's fine for playtests.
- A tile is revealed when its owner starts that action, so the previous player's screen never shows it early.
- Undo works within your own turn, except a move that draws (Leverage's cards, or the end of the round's tile refill). The kit warns before such a move and sends the turn at once.
- **Bots:** the lobby can fill seats with bots in async and live games. They see only what their seat could, and they pass the start player marker whenever a card lets them, so they act last.
