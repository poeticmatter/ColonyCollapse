# Bot-vs-bot simulations (Nov 2026)

About 9,000 games between bots, with no search: every seat is the shipped heuristic bot (`src/game/bot`) or a simple variant of it. The bot looks one or two decisions ahead and plans from fixed per-slot preferences, so these results describe how *this bot* plays the game. Treat them as pointers for playtesting, not proof.

Run them again with `npm run sim -- <experiment> <games>`; experiments are `baseline`, `ladder`, `bans`, `marker`, `contest`, `actions` (optionally `actions 300 dance` for one action) (code in `scripts/sim/`). Findings 2–7 were measured before the start player started passing between rounds. A game takes 0.1–0.3 s. With 400 games, a win rate is good to about ±5 points; with 300, ±5.5.

## Findings

### 1. The last seat in turn order wins far too often

**Adopted:** the start player marker now passes clockwise between rounds (see digital-rules.md). The table below is from before that change. After it, every position is within noise of fair: 50/50 with 2 players, 34/32/34 with 3, 23–28% with 4, and 17–25% with 5.

Win rate by position, where 0 is the first start player and the last position acts last in every slot (400 games per player count):

| players | pos 0 | pos 1 | pos 2 | pos 3 | pos 4 | fair |
|---|---|---|---|---|---|---|
| 2 | 33% | **67%** | | | | 50% |
| 3 | 23% | 29% | **48%** | | | 33% |
| 4 | 15% | 20% | 30% | **37%** | | 25% |
| 5 | 14% | 15% | 19% | 19% | **34%** | 20% |

The marker almost never moves: only Speaker's Favor and Deferred Gavel move it (0.1 changes per game). So the same player acts last in all 20 slots. Acting last means answering every rally with your own, after which no one can take the hex back before polling.

**Variant tested:** passing the marker clockwise after every round removes the effect. The 2 player split becomes 50/50, the 3 player split 34/32/34, and every cell is within noise of fair. Score margins and every other statistic barely change.

The tie rule ("closer to the start player wins") favours the opposite end of the table. It only decides 2–6% of games, though, so it doesn't balance this out.

### 2. Dance is by far the strongest action; Media in slot 1 is the weakest choice

In one test seat per game, the bot never plays a given action; the next unused action takes its slot instead. These are 3 player games against two normal bots, 300 each:

| banned | banning seat wins (fair 33%) |
|---|---|
| Dance | **1%** |
| Address | 42% |
| Develop | 58% |
| Media | **66%** |
| Leverage, Intern, Invest | 33–35% (no effect) |

- **Dance:** losing it is close to losing the game. One Dance rallies up to 7 hexes, and the pawn then holds its hex outright.
- **Media:** a bot that swaps its slot 1 Media for Leverage wins two games in three. Banning Develop and Address helps too, because their replacement is also Leverage.
- **Bot vs game:** these are as much about the bot's plan preferences (Media early, Develop late) as about the game. Even so, the Dance gap is large enough to point at the action itself.

### 2a. Media: where it goes, and whether to play it at all (after the start player change)

**Adopted:** Media is meant to be a niche action, played only when a flip changes a lot, so the bot no longer programs it at all. The `media` experiment that produced this table was removed with that change.

One seat moves its Media to another slot, keeping its other tiles in order, against normal bots (3 players, 300 games each):

| test seat | wins (fair 33%) | mean VP |
|---|---|---|
| Media in slot 1 (as shipped) | 32% | 28.8 |
| Media in slot 2 | 44% | 31.0 |
| Media in slot 3 | 42% | 30.7 |
| Media in slot 4 | 35% | 29.5 |
| no Media (Leverage in slot 1) | **74%** | 40.3 |

- **Why slot 1:** the bot picks it from a hand-written table. Media ignores X, so it was given a negative per-strength value and goes where strength is cheapest.
- **Slot 1 flips get undone:** when slot 1 Media fires, the bot does flip a tile (97% of the time). But every bot plays Address in slot 2, and Address flips a tile too, so a slot 1 flip is soon overwritten.
- **Later is better:** slots 2–3 avoid that and are worth about 10 points of win rate.
- **Slot 4 is worse:** Media there pushes Dance or Develop out of the strongest slot.
- **Media itself is the bigger issue:** dropping it for Leverage (one card: a permanent issue bump, or an effect) is far stronger than moving it anywhere.

### 3. The bot's plans hardly vary, and its planning is its weak point

**Update:** without Media, the bot's plans beat random plans 71% to 33% (it was 40% before), and it beats random play in 100% of 300 games.

- **Plan variety:** only 25 of the 840 possible plans ever appear, and Media → Address → Develop → Dance is 40% of all plans. Intern is almost never programmed (0.3%), and Invest rarely (8%).
- **Planning vs random:** the heuristic beats random plans by only 40% to 33% when both have the same decision-making. Its decision-making, by contrast, beats random play 96% to 4%.

**Consequence:** the statistics about actions and cards reflect a narrow style of play. Fixing the plan heuristic should come before trusting any balance number about Intern, Invest or Media.

### 4. Upgrades come late and don't pay off

**Outdated on track heights:** since the bot stopped programming Media it climbs much higher; see finding 9. The upgrade timing and value figures below haven't been re-measured.

- **Timing:** upgrades happen around round 4 on average. A track action ends the game upgraded in 12–22% of seat-games.
- **Value:** more upgrades go with *fewer* wins: 35% with 0 upgrades, 27% with 3. Climbing a track to 3 costs tempo that the upgrade doesn't repay in the rounds left.
- **The set-aside action:** it was never upgraded. The bot almost never plays Blueprint Revision's effect (2% of the times it keeps the card).
- **Tracks:** at game end only 15% of a seat's tracks are on 3, 2% on 4, and 7% below 0.

### 5. Nearly every district scores every round, and the scores aren't close

- **Districts:** 5.4–6 of 6 districts score each round, and 96–98% of the 90 available VP is awarded. A district where nobody scores is rare.
- **Margins:** winning margins are large with few players (17.8 VP with 2 players, 6.5 with 5). The leader after round 4 goes on to win 85% of 2 player games and 63% of 5 player games.

### 6. Cards: the bot mostly takes the issue, not the effect

- **Immediate cards:** the bot plays an Immediate card's effect only 1–15% of the time. Otherwise it takes the issue bump, because a one-ply evaluation can't see what Ward Sweep or Second Dancer will be worth later.
- **Ongoing cards:** their effects are played 40–74% of the time.
- **Which cards win:** the takers' win rates differ by card, from 23% (Cross-Party Address, Extra Hands) to 44% (Speaker's Favor), but each figure is ±7–9 points. Speaker's Favor's "wins" come from its issue bump, not its effect. No card stands out yet.

### 7. Keeping the start marker doesn't matter in practice

A seat that never passes the marker (with Deferred Gavel) and never gives it away (with Speaker's Favor) wins 33% with 3 players and 26% with 4, which is fair. The chance comes up too rarely to matter. The bot's habit of always passing it is harmless.

### 8. Every action by slot (after the start player and Media changes)

One test seat always puts a given action in a given slot, or never programs it, against two shipped bots (3 players, 300 games per row, ±4–5.5 points). "Shipped" is how often the bot itself programs the action, and where. The shipped bot's mean is 29.4 VP and 33.3% wins.

How a slot is forced: if the plan already has the action, it moves to that slot and the tiles in between shift along. If not, it **replaces** whatever the bot had there. The bot puts Dance in slot 4 about 55% of the time, so "always slot 4" for any other action often means "lose Dance". Read slot 4 rows for actions other than Dance as partly a Dance ban.

| action | shipped (slot 1 / 2 / 3 / 4) | slot 1 | slot 2 | slot 3 | slot 4 | never |
|---|---|---|---|---|---|---|
| Address | 100% (91 / 9 / 0 / 0) | **32%** | 22% | 25% | 17% | 12% |
| Develop | 100% (0 / 24 / 50 / 27) | **39%** | 36% | 33% | 31% | 29% |
| Media | 0% | 14% | 18% | **24%** | 5% | (shipped) |
| Leverage | 68% (0 / 23 / 27 / 19) | 34% | **38%** | 36% | 18% | 17% |
| Dance | 77% (0 / 0 / 22 / 55) | 18% | 23% | 29% | **46%** | 1% |
| Intern | 2% (0 / 2 / 0 / 0) | 11% | 31% | 19% | 5% | **33%** |
| Invest | 53% (9 / 43 / 2 / 0) | 18% | **36%** | 30% | 20% | 26% |

Mean VP follows the same pattern, from 9.1 (never Dance) to 33.4 (Dance always in slot 4).

- **Dance is the strength action.** It gains the most from a high X: 18% in slot 1, 46% in slot 4. A seat that always plays Dance last beats the shipped bot, which only does so 55% of the time. Dropping it is still fatal (1%).
- **Address wants to go first.** It is best in slot 1, where the bot already plays it, and it's the second most important action: never playing it gives 12%. Going early probably matters because its flip sets up the board before the rallies.
- **Develop barely matters where it goes.** Every slot, and even never playing it, is within about 5 points of fair. If anything earlier is better (39% in slot 1), which is the opposite of the bot's habit of playing it in slot 3. It's the weakest of the core actions.
- **Leverage is worth a slot**, anywhere but the last (34–38% in slots 1–3). Never playing it gives 17%.
- **Invest has one good slot: slot 2** (36%). In slot 1 its X is too small (18%). Without it a seat drops to 26%, so it's worth playing, but only in the right slot.
- **Intern is never worth programming.** At best (slot 2) it breaks even. It does nothing in slot 1 (11%). The bot is right to leave it out.
- **Media loses in every slot**, even against bots that never play it. Slot 3 is its best (24%). This backs up keeping it as a niche action that needs a big flip to pay off, something a fixed-plan bot can't judge.
- **Bot vs game:** these test one seat against a field of shipped bots, with every other choice left to the bot. A rule of thumb for this bot: Address → Invest or Leverage → Leverage or Develop → Dance.

### 9. Rallies against rivals, and races on the tracks (after the start player and Media changes)

Mirror games of the shipped bot, 300 per player count (`contest` experiment).

**Rallying a rival's hex is common, and more so with more players.** Discs a seat gains per game:

| players | onto an empty hex | taken from a rival | given by polling | rallies that take a rival disc |
|---|---|---|---|---|
| 2 | 9.1 | 4.2 | 7.7 | 31% |
| 3 | 7.7 | 5.3 | 4.0 | 41% |
| 4 | 6.8 | 5.8 | 2.1 | 46% |
| 5 | 6.0 | 6.3 | 1.1 | 51% |

- **It's almost all Dance.** Per play, Dance takes 1.26 rival discs and claims 0.67 empty hexes. Develop mostly claims the rondel tile it lands on (0.90 empty, 0.08 rival). Address only rallies when upgraded (0.10). Leverage and Invest never rally. That explains why banning Dance is fatal: it's the only way the bot takes ground from anyone.
- **It builds through the game:** 0.33 rival discs taken per seat in round 1, then 0.93, 1.13, 1.31 and 1.61 in round 5, as tracks rise and more hexes have discs.
- **Polling matters at 2 players:** with fewer rivals, a seat is more often the single leader of a tile's issue, so polling hands it nearly as many discs (7.7) as its own rallies onto empty hexes.

**The bots climb high, to 3 and then stop.** A seat's best track ends on 3.5 on average, and 98% of seats end with a track on 3 or more (about 54% on 4). That's far higher than finding 4 measured with Media in the plans. Their six tracks, best to worst, after each round (3 players):

| after | best | 2nd | 3rd | 4th | 5th | worst |
|---|---|---|---|---|---|---|
| R1 | 1.7 | 0.9 | 0.3 | 0.0 | −0.3 | −1.1 |
| R3 | 2.9 | 1.8 | 0.9 | 0.3 | −0.3 | −1.1 |
| R5 | 3.5 | 2.7 | 1.5 | 0.6 | 0.0 | −0.8 |

At game end the seat-tracks sit on −2/−1/0/1/2/3/4 in 3/10/25/22/**10**/21/10% of cases. The dip at 2 and the bump at 3 are the upgrade pulling tracks up to 3. Each seat goes deep on about two tracks, keeps two near 0 and sinks one (the Invest payment).

**They race on the same track only at 2 players:**

| players | tracks with 2+ seats on 2+ at end | two seats share a favourite track (chance 17%) | track lead changes per game | overtakes per game |
|---|---|---|---|---|
| 2 | 23% | **39%** | 5.1 | 6.0 |
| 3 | 35% | 22% | 6.6 | 12.6 |
| 4 | 51% | 15% | 8.1 | 21.6 |
| 5 | 63% | 15% | 8.9 | 32.9 |

- **2 players:** the two seats' best tracks match twice as often as chance. With only one rival, the bot climbs whatever track it needs to out-rank that rival, so the two end up on the same issues.
- **3+ players:** favourite tracks overlap at about chance, so they don't pick a fight on purpose. Tracks still get crowded, because with more seats there are more seats on 2+ on each track, and overtakes (climbing past a rival on 1+) grow from 6 to 33 a game.
- **Lead changes are rare:** across all six tracks, a track's single leader changes hands only 5–9 times a game, about once per track. Once a seat leads a track, it usually keeps it.

## Proposed next tests

1. **Other turn-order fixes** (clockwise passing is now the rule). Compare it with:
   - rotate *counter-clockwise*, so the last player becomes first;
   - give the marker to the player with the fewest VP after polling;
   - reverse seat order on even slots (a snake order);
   - flip the tie rule to "furthest from the start player".
2. **A better planning bot first.** Score each plan by simulating its own tiles against rivals' *public* information, which is still not a full search, or simply tune the per-slot preferences. Then re-run the action bans. Balance claims about Intern, Invest and Media wait on this.
3. **Dance limits.** Re-run the bans after weakening Dance in a variant: rally only the landing hex plus one adjacent hex, or limit the move to X − 1 hexes. Check whether the 1% / 58% / 66% spread closes.
4. **Upgrade value.** A bot variant that pushes one chosen track to 3 as early as possible, against the normal bot. If it still loses, consider an upgrade space of 2, or a one-off bonus on reaching 3.
5. **Card strength.** Force a test seat to keep a given card and *play its effect*, card by card (18 runs × 300 games). This measures each ability rather than the bot's taste for issue bumps.
6. **Comeback and pacing.** Track the leader's VP lead after each round, and how often the lead changes, under round values 1/2/3/4/5 vs flatter ones (for example 2/3/3/4/4). This shows whether round 5 decides too much or too little.
7. **Player-count specifics.** In 2 player games, check how often one player wins all 6 districts in a round, and whether the board feels too open at 2 players (for example, 5 tile slots per district for only 2 players).
