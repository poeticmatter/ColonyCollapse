# Bot-vs-bot simulations (Nov 2026)

About 9,000 games between bots, with no search: every seat is the shipped heuristic bot (`src/game/bot`) or a simple variant of it. The bot looks one or two decisions ahead and plans from fixed per-slot preferences, so these results describe how *this bot* plays the game. Treat them as pointers for playtesting, not proof.

Run them again with `npm run sim -- <experiment> <games>`; experiments are `baseline`, `ladder`, `bans`, `marker` (code in `scripts/sim/`). Findings 2–7 were measured before the start player started passing between rounds. A game takes 0.1–0.3 s. With 400 games, a win rate is good to about ±5 points; with 300, ±5.5.

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

### 3. The bot's plans hardly vary, and its planning is its weak point

- **Plan variety:** only 25 of the 840 possible plans ever appear, and Media → Address → Develop → Dance is 40% of all plans. Intern is almost never programmed (0.3%), and Invest rarely (8%).
- **Planning vs random:** the heuristic beats random plans by only 40% to 33% when both have the same decision-making. Its decision-making, by contrast, beats random play 96% to 4%.

**Consequence:** the statistics about actions and cards reflect a narrow style of play. Fixing the plan heuristic should come before trusting any balance number about Intern, Invest or Media.

### 4. Upgrades come late and don't pay off

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
