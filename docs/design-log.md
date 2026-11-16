# Colony Collapse design log

What changed and why, newest first. **Game design** is the game itself: rules, content (board, tiles, cards, numbers) and balance. **Game development** is everything else: the board and UI, the platform, bots, tooling and fixes that don't change the rules. A change that does both has an entry in each. Entries before 2026-11-16 were written afterwards from the git history, so they give a reason only where the commits recorded one.

## Game design

### 2026-11-16: Action points replace programming
On the `explore/action-tension` branch. The actions weren't in tension: in slot 4 they mostly offered more choice or reach, not more effect, so the pull towards slot 4 was just about playing late, and programming left little to plan. Action selection is gone. On your turn you spend 5 action points: turn the dial, move your pawn, rally or address the dial tile, or shift between neighbouring tracks for 1 each, or rally around your pawn for 3. The dial turns after every turn, and the round ends when it passes the mark between slot 6 and slot 1, so turning the dial yourself hurries the scoring along. Seed cards, action tiles and upgrades are gone. Some calls are the build's own, still to check in play: a rally that would change nothing can't be bought, a track at +4 can't go up in a shift, and the last tiebreak counts from whoever started round 5.

### 2026-11-14: Bot simulations of the rules
About 9,000 bot-vs-bot games, measured several ways. Nothing changed in the rules except the start player rule below. What they found, for this bot's style of play:
- **Dance is by far the strongest action.** Never playing it wins 1% of games, and it is the only action that takes much ground from other players.
- **Media loses in every slot.** It's meant as a niche action, played only when a flip changes a lot.
- **Slot matters little for most actions.** Dance wants slot 4 and Address slot 1; Develop is about the same anywhere, and Intern is never worth a slot.
- **Upgrades come late and don't pay off**, around round 4.
- **Discs are mostly taken cheaply:** someone claims a hex while on 0, and a rival higher on that issue picks it off later.

Details in `docs/simulations.md`.

### 2026-11-14: The start player passes clockwise between rounds
Without it, the same player acted last in every slot of the game, and in bot games that seat won about twice its share. Passing the marker one seat clockwise after each round brings every seat within noise of a fair share.

### 2026-11-14: The first playable rules: Rules v7.1
The designer's Rules v7.1, with these calls on the open questions:
- 30 tiles: 2 of each of the 15 issue pairs, each drawn on a random side.
- Tracks run from −2 to +4. Reaching 3 upgrades that track's action; one action is set aside and only a card can upgrade it.
- The rondel pointer and Dance move 1 to X, never 0. A pawn can't go back into the hub once it has left.
- A printed hex is controlled by rallying it or by standing on it. Discs are unlimited.
- A tile whose district slot is taken goes to the next free one, then to the next district clockwise.
- A new tile goes to its issue's leader only if they are on 0 or more.
- Invest's neighbouring tracks don't wrap: Clay and Mauve are not neighbours. Intern in slot 1 does nothing.

The full list is in `docs/build-questions.md` and `docs/digital-rules.md`.

## Game development

### 2026-11-16: The board, bot and simulations follow action points
On the `explore/action-tension` branch. A turn panel lists every action with its cost and greys out what isn't possible now. You move your pawn by clicking a highlighted hex, and the board outlines what rallying around it would take. The rondel shows the gold mark, and the header shows how many turns are left before it. The bot now plans its whole turn by searching sequences of actions. `npm run sim` plays bot games on the new rules and reports seat fairness, round length and which actions get bought. Games saved under the old rules can't be played on this build.

### 2026-11-16: A plain-language rules document and this log
`docs/rules.md` describes the game as it plays now, and this log records changes in two parts. Both are kept up to date with every change.

### 2026-11-14: Simulations of every action in every slot, and of rallies against rivals
New simulation experiments: one seat forced to play an action in a given slot, or never; and mirror games measuring how discs change hands and how players race on the tracks. Run them with `npm run sim`.

### 2026-11-14: Bots no longer program Media
The bot can't judge Media while planning, and in simulations a bot that left it out won far more often. Media is still in the game for players.

### 2026-11-14: Action tiles explained in place
Hovering over an action tile, or pressing its ? button, shows what it does on its current side.

### 2026-11-14: Bots to play against
The lobby can fill seats with bots in async and live games. A bot scores each choice by simulating it, and never reads another player's hidden plan.

### 2026-11-14: The rules engine, board and art for v7.1
The whole game playable in the browser: programming, slot-by-slot resolution, every action and card, polling and scoring. The board, rondel, tracks, tiles and pieces are ported from the physical prototype's art.

### 2026-11-14: Started from the game template
