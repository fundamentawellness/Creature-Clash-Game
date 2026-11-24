# Add a creature with your kids

The three legendary pedestals are empty on purpose. When a kid invents a creature, you fill in one pedestal and it can show up after they become champion. You do not need to draw a new picture first. You do not need to touch the battle code.

Open `src/data/legendaries.js`. Each pedestal is one block. Leave the `id` as it is.

## 1. Pick a pedestal

- **Heart of the Chain** appears on Crownrest.
- **The Sleeper** appears on Mistveil.
- **Ashwake's Last Spark** appears on Ashwake.

## 2. Fill in the creature

Change these fields together:

- `name` is what the kids call it.
- `type` is one of `fire`, `water`, `grass`, `electric`, `rock`, `ground`, or `poison`.
- `ability` is one id from `src/data/abilities.js`, such as `ember_heart` or `sturdy`. The short description in that file is what the game shows.
- `stats` uses five numbers: `hp`, `atk`, `def`, `spd`, `spc`. A normal final form sits around 70 to 100. A legendary can be a little higher.
- `moves` is a list of move ids that already exist in `src/data/moves.js`. Use two to four. The id is the short name in quotes, like `flame_nip`, not the words the kids see in battle.
- `desc` is one sentence.
- `art` can stay `null`. The game will still show a creature. If you later pick a picture that is already in the game, put that creature's id here, such as `emberpaw`.

## 3. Wake it up

Set `ready` to `true`.

Until that flag is true, the pedestal stays a hint. The creature is not in the collection book and cannot be caught.

After it is true, and that player has become champion, the pedestal on its island gains a Meet button. The fight is a wild battle at level 50. Weaken it and throw an orb, the same way as any other catch. It then joins that player's collection.

## 4. Check it

From the project folder, run:

```bash
npm run verify
npm run build
```

If a move id or ability id is misspelled, the build still succeeds, but the battle will not know that move. Compare the ids with the files named above.

Start a champion save, open the island named in `where`, and press Meet.
