# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # dev server at http://localhost:3000
npm run lint       # TypeScript type checking (tsc --noEmit)
npm test           # vitest
npm run build      # production build
npm run deploy     # build and publish to GitHub Pages
npm run init-game -- <repo-name> <game-id> "<Title>"   # one-time rename of a fresh template copy
```

## Architecture

A browser game for 2–5 players taking turns in order, with no backend of its own. It is part of the game lab (poeticmatter/game-lab); each game lives in its own repo created from poeticmatter/game-template-turns. (Two-player games where both choose at the same time start from poeticmatter/game-template instead.)

The multiplayer platform (lobby, seats, transports, status screens) is **GameKit**'s `game-kit/turns`, a package pinned in `package.json` to a release tag of poeticmatter/GameKit (local copy: `C:\Code\GameKit`).

- `src/game/`: the game, Colony Collapse. `index.ts` exports `game: GameModule`.
  - `rules/`: the pure rules engine (`colonyRules`), its selectors, and tests. Resolution runs on a JSON stack of tasks; a task waiting for a choice is a `PendingDecision`, answered by a `decide` move. `rules/testing/` has scenario helpers and a bot that plays whole games.
  - `bot/`: the computer opponent (`chooseBotMove`, GameKit's `GameModule.bot`): simulates each answer a decision allows and scores the result (`evaluate.ts`, weights in `weights.ts`); plans are scored heuristically (`plan.ts`). Pure and deterministic, and it never reads a rival's hidden plan.
  - `data/`: the 45 seed cards and 30 hex tiles.
  - `board/`: pure board geometry, palette, rondel and track constants.
  - `art/`: SVG pieces ported from the physical prototype's asset project (C:\Codessets\ColonyCollapseAssets).
  - `ui/`: the board screen; `ui/decisions/` has one view per decision kind.
- `docs/digital-rules.md` is the authoritative rules spec for this build (the designer's rulings on top of the v7.1 rules doc). Change it together with the engine.
- `src/game.config.ts`: `GAME_CONFIG`: the game id, title, tagline, and Supabase settings read from `.env.local`.
- `src/App.tsx`: renders `<TurnBasedGameApp config={GAME_CONFIG} game={game} />`. GameKit routes on the URL (`?room=CODE[&mode=async]`); solo playtests have no URL.
- `src/index.css`: Tailwind, GameKit's theme (`game-kit/theme.css`), and any colour token overrides.

### Rules contract

- `createInitialState({ settings, playerCount, seed })` and `applyMove(state, move)` must be pure and deterministic. Keep randomness in the game state, seeded from `seed`, and draw with GameKit's `nextIndex` / `nextRandom`, so every client gets the same results.
- `activePlayers(state)` lists the seats whose moves the game accepts: every seat still programming during the simultaneous programming phase, otherwise the one seat on turn (or whoever a decision is waiting for). `activePlayer` is the first of them, null once over. `applyMove(state, move, player)` is told who moved; moves don't name their seat.
- Plans and Leverage draws are hidden by the board only (they're in the shared state). Always read plans through `visiblePlanSlot`, and draw seat colours and names through `lookOf` (the log stores `{seat:N}` tokens for this reason).
- `applyMove` throws GameKit's `IllegalMoveError` for a move that breaks the rules; GameKit catches it and leaves the state alone.

### Seats and transports (in GameKit)

- Seats fill in join order; the creator is seat 0. Browsers remember their seat per room; anyone with the link can take back a seat ("That's me") or watch.
- **Async (Supabase)**: one row per room in `<game-id>_games` (`players`, `player_count`, `state`, `version`), with seats claimed through `<game-id>_claim_seat`. Both are defined in `supabase/migrations/`.
- **Live (PeerJS)**: the creator hosts and runs the rules; the game ends if the host closes the tab.
- **Solo playtest**: one tester plays every seat; the seat being played is disguised as seat 0.

## Rules document and design log

Claude keeps two documents in `docs/` and updates them in the same change as the work they describe, without being asked:

- **`docs/rules.md`**: the game's rules as it plays them now, in plain language, as a new player would read them: what you're trying to do, what's on the table, setup, a turn, how it ends. No code names, file paths or jargon. Every change to the rules or content updates it, so it always matches the game.
- **`docs/design-log.md`**: what changed and why, newest first, in two sections:
  - **Game design**: the game itself: rules, content (board, tiles, cards, numbers) and balance.
  - **Game development**: everything else: the board and UI, visuals, GameKit bumps, bots, tooling, and fixes that don't change the rules.

  One entry per change, headed by its date and a short title, in the section it belongs to; a change that does both gets an entry in each. Say what changed for players and, when it's known, why. Leave how it was built to the commits.

In Colony Collapse, `docs/rules.md` is separate from the designer's rules (`docs/Colony Collapse - Rules v7.1 11-02-26.md`) and from `docs/digital-rules.md`, the precise spec the engine follows: the designer's text stays theirs, and `rules.md` explains the same game to a player.

## Rules

- All state changes go through `rules.applyMove`. UI components only render state and submit moves.
- Keep `GAME_CONFIG.id` and the table and function names in `supabase/migrations/` in sync.
- To change platform behaviour, change GameKit, tag a release, and bump the `game-kit` version in `package.json`. Don't patch `node_modules/game-kit`.
