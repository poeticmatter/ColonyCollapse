# Colony Collapse v7.1 — open questions for the digital build

Each question has my **proposed answer**. Reply "all proposals OK except …", or edit this file inline (write your answer under the question).

Data source assumption: the asset project (C:\Code\assets\ColonyCollapseAssets) is current for v7.1 — 6 issue colours, 7 actions, board layout, issue tracks −3..+4, 45 seed cards.

## Components and data

1. **Hex tiles.** The rules say 30 tiles; the assets define 15 double-sided tiles (one per colour pair = 30 faces). 30 tiles × 6 per round × 5 rounds fills exactly the 30 district slots.
   **Proposed:** 30 tiles = 2 copies of each of the 15 colour pairs. A tile drawn from the bag comes up on a random side.
2. **Seed cards.** You said you'd provide the cards. Is the asset list (18 abilities, 45 cards: Comb Overturn, Long Flight, Dissident Rally, Speaker's Favor, …) current? Several of its Ongoing cards use the old action text (e.g. "LEVERAGE: swap positions", "INTERN: N = 2", "DANCE: rally as if on level 4", "Reserve Deployment: use a set aside action tile at strength 3").
   **Proposed:** you send the current list (a file in this folder). Until then I'll use the asset list as is, implementing the card text literally.
   Answer: I am not sure what the issue is.
3. **Starting seed cards** (the note for Claude). **Proposed:** not now; setup deals one card from the deck to each player (up on its 1st colour, down on its 2nd, then discard), as written. The data model will allow a separate starting deck later.
4. **Board layout.** The assets have two district layouts: the default "irregular" one and "triangle districts". **Proposed:** the default irregular layout.
5. **Players.** The assets have 4 player colours plus a reserved 5th. **Proposed:** 2–5 players, colours Red, Blue, Green, Violet, Yellow.

## Rondel and polling

6. **Rondel ↔ districts.** **Proposed:** rondel slot *i* is the slot matching district *i*'s colour (as the asset display board draws it), and in round *r* the tile goes onto the district cell with *r* pips.
   Answer: If it is taken, the tile goes into r+1. If all slots in the district are taken, it is placed in the next district in clockwise order.
7. **Rondel pawn.** **Proposed:** one shared rondel pawn. It starts pointing at slot 1 and stays where it was left between rounds.
8. **"Move up to X"** (Address, Develop). **Proposed:** 0..X spaces clockwise, so 0 targets the tile it already points at. 
   Answer: 1-X. must move.
9. **Empty rondel slots.** Can a slot be empty during a round? (Only if the bag runs out, which can't happen with 30 tiles.) **Proposed:** no special handling.
10. **Tiles controlled while still in the rondel** (via Address upgrade / Develop) keep their disc when they move to their district at polling. **Proposed:** yes, only uncontrolled tiles check the track leader on entering play.

## Issue tracks

11. **Range.** Tracks run −3..+4 and everyone starts on 0. The asset marks −3 as "only reachable with upgraded action tiles". That isn't in v7.1. **Proposed:** a hard floor of −3 and ceiling of +4 for everyone. Moves past the end are lost: you stop at the end, and Invest moves up only as many spaces as it actually moved down.
    Answer: Hard floor of -2 for now.
12. **Space 3 upgrade.** **Proposed:** each player, the first time *they* reach 3 on a track, flips their own copy of that track's action tile, immediately (it applies even to a tile programmed in a later slot this round). Dropping below 3 and coming back gives nothing. The track for the set-aside action never upgrades it.
    Answer: Yes, and there is one upgrade that is left set aside and can only be upgraded using cards.
13. **Same random track→action assignment for all players?** **Proposed:** yes, one shared assignment, visible to everyone.
    Answer: Unclear what the question is.
14. **Ties for the track lead when a tile enters play.** Rules: tie → enters uncontrolled. **Proposed:** the "lead" is the highest position among all players; a lead of below 0 still counts. *Or* does the leader need ≥ 0, as for rallying?
    Answer Must have at least 0.

## Actions

15. **Programming.** **Proposed:** 4 different tiles of your 7, hidden from others until each slot is revealed. You may change your plan until you confirm it. Once everyone has confirmed, resolution starts.
16. **Address.** Bump up 1 on the colour currently face up on the target tile, then flip it. The upgrade rallies it after the flip, using the *new* colour. **Proposed:** as written.
17. **Develop upgrade:** "also rally one tile along the way (not the one you started on)". **Proposed:** any one tile strictly between the start and the destination, chosen by the player, and optional.
18. **Media.** "Cannot be flipped by a Media action again this turn": the lock lasts until the end of the current slot's resolution for everyone. **Proposed:** as written. Upgrade: choose any subset, including none.
19. **Leverage.** Draw X cards, keep one. **Proposed:** the others go to a discard pile, and the deck reshuffles from the discards if it runs out. "Go up one of the indicated tracks" = +1 on one of the card's two colours. Upgraded "do both" = resolve the effect *and* go up. The kept card stays in front of you (Ongoing effects stay active, Immediate cards are spent but kept for show).
20. **Dance.** **Proposed:** exactly X steps (not "up to"). Any hex counts, including the centre hub, printed centre-ring hexes and empty slots. You may revisit hexes, and other pawns don't block. Then rally the landing hex and its neighbours, which includes printed centre-ring hexes but not empty slots or the hub.
    Answer: 1-x steps. Can't go back into the center after leaving.
21. **Printed centre-ring hexes.** **Proposed:** they can be controlled (by rallying), carry a disc, count as a disc in their district for polling, and break ties. Can they be controlled any other way?
    Answer: By standing on them.
22. **Intern.** Resolves your own previous slot's tile at strength 1 (standard, or upgraded if Intern is upgraded, whatever the side of the copied tile). **Proposed:** Intern in slot 1 does nothing. Intern copying Intern copies the one before that? Or does nothing?
    Answer: slot 1 does nothing. You can't have 2 interns.
23. **Invest.** "Adjacent track": **Proposed:** neighbours in the track order Clay–Sage–Periwinkle–Stone–Seafoam–Mauve, *not* wrapping (Clay and Mauve are not adjacent). Or does it wrap?
    Answer: Doesn't wrap.
24. **Optional actions.** **Proposed:** every action can be partially or fully declined (move 0, flip nothing, invest 0) except the reveal itself.

## Control, pawns and polling

25. **Pawn on a disc.** "A player pawn standing on a control disc temporarily assumes control." **Proposed:** while there, the pawn's owner counts as the controller for polling and for rally comparisons. A pawn on an *uncontrolled* tile gives no control. If two pawns share a hex, neither assumes control (the disc's owner keeps it).
26. **Rallying your own tile** does nothing. **Rallying needs a disc:** **Proposed:** 15 discs per player. With none left you can't take control of new tiles. Or move one of your discs from elsewhere?
    Answer: Discs should not be limited.
27. **Polling count.** **Proposed:** the most controlled hexes in the district (centre-ring hex included) wins 1/2/3/4/5 VP by round. On a tie, the player controlling the centre-ring hex wins *if they are among the tied*; otherwise nobody scores.
28. **End-game tiebreak** "closer to the start player": **Proposed:** the start player at game end, then clockwise.

## Turn order

29. **Initiative changes mid-round.** In v7.1 only cards move the start player marker (Speaker's Favor; Deferred Gavel lets you pass it). **Proposed:** the new start player applies from the next slot onward; the current slot finishes in its original order. *Alternative:* it applies at once, and the rest of the current slot goes clockwise from the new start player, skipping anyone who has already acted. Which?
30. **"Clockwise"** = seat order. **Proposed:** yes.

## Digital-only decisions

31. **Hidden plans.** In async play the plans are stored in the shared game record and the board just doesn't show them. A determined player could peek through the browser's dev tools. **Proposed:** fine for playtesting.
32. **Undo.** **Proposed:** you can undo within your own action until you end your turn, except where the action draws cards (Leverage), which is final.
