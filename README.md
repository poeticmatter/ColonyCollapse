# Colony Collapse

*Down with the Queen?* A campaigning game for 2–5 bees by Seth Jaffee and Aurore Inara, built for online playtesting in the [game lab](https://poeticmatter.github.io/game-lab/).

Play: https://poeticmatter.github.io/ColonyCollapse/

Each round every player secretly programs 4 of their 7 action tiles, then the slots resolve one by one in turn order from the start player, getting stronger each slot. At the end of each round the rondel's tiles enter the districts and a polling scores them. After 5 rounds, the most votes wins.

- Rules: [docs/Colony Collapse - Rules v7.1 11-02-26.md](docs/Colony%20Collapse%20-%20Rules%20v7.1%2011-02-26.md)
- Rules as implemented, with the designers' rulings for the digital build: [docs/digital-rules.md](docs/digital-rules.md)

Async (Supabase), live (PeerJS) and solo playtest come from [GameKit](https://github.com/poeticmatter/GameKit) (`game-kit/turns`).

## Developing

```bash
npm install
cp ../game-template/.env.local .env.local   # Supabase settings for async play
npm run dev      # http://localhost:3000
npm run lint
npm test
npm run deploy   # GitHub Pages
```
