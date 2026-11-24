# Creature Clash

The game on the title screen is still called **Battle Arena**. Creature Clash is the family name for the bigger game this is growing into: a turn-based creature battle that kids ages 10–12 can play together, each on their own phone, tablet, or laptop.

This is a family-and-friends game, not a store release. The creatures are original. Move names that sound like familiar monster-battling games are fine to keep.

The people playing it like:

- catching and collecting creatures
- watching a creature evolve
- building a team and picking the smart move
- battling each other, not only the computer

A few special creatures will be invented by the kids themselves. Those come later, on purpose, once the game has a world worth putting them in.

## The world

An island chain you sail between. Each island is its own place: its own wild creatures, and its own gym. You do not start with a boat. You earn a way across, either a boat or a creature that can swim well enough to reach the next island. That is the lock between islands. Beating the gym is how you prove you are ready, and the crossing is how the map opens.

What is in the game today is the skeleton of that idea. Four zones — Greenridge, Cragmoor, Stormreach, and Ironspire — already have gyms, leaders, badges, and a rival. They are a list you tap through, not islands you travel. Later phases turn those zones into the first islands instead of throwing them away.

## The story

Three threads, told together rather than as three separate games:

1. A villain crew is digging up the islands, looking for something ancient.
2. The islands have a mystery of their own, and the player uncovers it one island at a time.
3. The player is climbing the gyms to become the champion of the whole chain.

Today the story is a few lines of dialogue before and after leader and rival fights. The names, badges, and rival are already there. The villain crew, the mystery, and the champion ending are the story we still have to write.

## Creatures the kids invent

The kids help invent a few special creatures — the rare ones, the legendaries. That is not the same as the Creature Forge, which is a post-game toy for making extra fighters (up to five creatures and two types). Kid-invented creatures are designed together, drawn or chosen from the art we have, and then added to the real roster so they show up in the world. That waits until the islands exist, so there is somewhere for them to live.

## How a battle works today

A fight is one creature at a time, with the rest of the team on the bench. Both sides pick a move (or a switch) at the same time. Speed decides who goes first. A switch is not free: the other side still gets to attack, and a chosen switch then has to wait three turns before another one.

Types matter. Fire, Water, Grass, Electric, Rock, Ground, and Poison follow a simple chart: a move can be strong, weak, normal, or useless against the other creature. A move that matches the attacker's type hits harder. Creatures are one type each.

Stats are HP, Attack, Defense, Speed, and Special. Special is used both for special moves and for soaking special hits. Levels make stats grow, up to level 50. A fair fight is about one level. Only the creatures on the winning team get experience. A loss does not give progress and does not move the story forward.

Every creature line grows. Most lines have two or three forms. Speedsters and glass cannons evolve at levels 16 and 34. Tanks and bruisers evolve once, at level 18. The battle stops for a moment so you can see the new form. Each creature also has one ability, written in a short sentence on the team card.

Burn, poison, numb, sleep, and freeze stick around after the hit. The battle shows the word on the creature. Switching out clears it. A bag of potions and a few held items comes from winning battles. Potions are used on your turn. Held items stay on one creature.

There is no overworld yet, no wild battles, and no catching. A new game starts with 10 creatures at level 5. Beating gym leaders and the first two rivals lets you pick more, until all 28 lines are unlocked. A new teammate arrives near your current progress, not at level 1. The gyms now run from about level 6 up to the low 40s, so the climb reaches the evolutions without asking anyone to grind to 50.

Saves live in the browser on that device (local storage). Nothing is on a server yet.

## Roadmap

Each phase should be playable before the next one starts. A kid should be able to sit down with the game at the end of a phase and have fun, even if the next phase is still an idea.

### Phase 1 — Fix and polish

**Goal.** The game that already exists should feel fair, and each kid should have their own save. It should be comfortable on a phone in portrait, a tablet, and a laptop.

**What you can play.** The same gym campaign as before: build a team, fight trainers and leaders, earn badges, and eventually open the Forge. The difference is that the rough edges are cleaned up.

**What this phase includes.**

- Evasion works. Quick Dodge raises evasion, and later attacks can miss. The battle says "dodged" when that happens. Each step up or down is 25%, the same size as the other stat changes. A sure hit against +1 evasion becomes an 80% hit. Healing and other status moves still always go through.
- Types made in the Forge are used when damage is calculated. If a kid makes a type that is immune to fire, fire moves do nothing to a creature of that type. The chart they set for "attacking" and "defending" is the chart the battle uses. The computer uses that same chart when it picks moves.
- Art-bank pictures can be chosen while making a creature. That picture shows on the team screen, in the Forge, and in the battle. The extra art (Blazant, Stormhawk, and the rest) was already in the project; it just was not attached to anything.
- Replaying a finished gym fights the whole gym again: every trainer, then the leader. "Next Battle" stays inside that replay. It does not hand out a second badge or another creature.
- New Game asks first if that player already has a save. Starting over wipes only that player's creatures and badges.
- Up to four players on one device. Each slot has a name, a color, and a picture. Their teams, levels, and badges stay separate. If the device already had one save from before this update, it is moved into the first slot automatically. Nothing is deleted to make room.
- Menus, the team builder, and the battle can be used with a finger. Buttons are big enough to tap, and nothing important is hidden until you hover. The battle picture scales to the screen, and the move buttons sit beside or under it at a readable size instead of shrinking into the picture.

**Notes for the next coding session.** Damage math is in `src/systems/damage.js`. The turn runner is `src/systems/battleEngine.js`, and it now receives the full type chart from `src/utils/customData.js`. Saves are a profile file (`battle-arena-profiles` in local storage) with four slots; the old single key `battle-arena-save` is read once and then retired. The battle view is still Phaser, at 800 by 500, scaled to fit. The move buttons are regular page buttons so they stay large on a phone.

### Phase 2 — Deeper battles

**This phase is in the game.** The gym campaign is still the way you play. Fights now have evolution, a level cap of 50, lasting status, one ability per creature, and a bag.

**What you can play.** The same four zones, with trainers scaled from about level 6 to the low 40s. Creatures evolve on the way. You can pack a potion, give a Snack Berry to a teammate, and read each ability in one sentence.

**How it works.**

- Evolution keeps the 28 creatures as the first form and adds original later forms. Fast and fragile lines evolve at 16 and 34. Tough lines evolve once at 18. An old save is stretched onto this climb: a level 1 creature becomes level 5, and a maxed level 12 creature becomes level 42 and takes the form that level earns. The game tells you if someone grew.
- Experience replaces "two wins, one level." Beating a foe around your level is about one level. Weaker foes pay less, so grinding the first gym is a slow way up. New teammates from leaders join near your badge count.
- Status: Burned, Poisoned, Numb, Asleep, Frozen. The word shows on the creature. Burn and poison hurt at the end of the turn. Numb sometimes skips a turn and slows you down. Sleep and freeze make you wait. Switching out clears it. Fire types cannot be burned or frozen. Poison types cannot be poisoned. Electric types cannot be numbed.
- Abilities are passive. Ember Heart and its cousins hit harder when HP is low. Sturdy and the Focus Ribbon each save you from one knock-out per battle. Hover makes Ground moves miss.
- The bag starts with two Potions and a Tonic. More comes from wins. Use them in battle on your turn. Held items are given to one creature from the bag screen.

**Notes.** Damage still lives in `src/systems/damage.js`, with ability and item tweaks in `src/systems/battleMods.js`. Lines are listed in `src/data/evolutions.js`. Saves are version 3. A version 2 save is converted when it loads, inside the same player slot. Special is still one stat doing two jobs. Short-term buffs are still the -3 to +3 stages.

### Phase 3 — Catching and the first islands

**This phase is in the game.** After you name yourself, you open a map of the island chain instead of a list of zones.

**What you can play.** Greenridge, Cragmoor, Stormreach, and Ironspire are islands. Each one has wild patches, the gyms and rival that used to be that zone, and a small shop. Two more islands sit in the fog for later. A collection book shows every line: caught, seen, or still unknown.

**How you sail.** Home is always open. Each island's first gym earns a skiff toward the next one. A water creature at level 10 or higher can swim one extra channel, so training Aquafin is another way across. Gyms themselves still unlock in campaign order, so sailing ahead lets you catch creatures before you are allowed to challenge that island's leaders.

**Catching.** Wild creatures match the island (meadows are grass, the caldera is fire and ground). Weaken one, then throw a **Lure Orb** or a **Sturdy Orb**. Low HP helps. Sleep and freeze help more. A caught creature joins your collection at the level you found it. Your team is still chosen from what you own. Battles also pay coins. Shops sell orbs, potions, and tonics.

**Saves.** Version 4. Creatures you already owned count as caught, and their earlier forms count as seen. You get five Lure Orbs if you didn't have any. Other players' slots stay separate.

**Notes.** Islands live in `src/data/islands.js`. Catch odds and sailing rules live in `src/systems/world.js`. The same battle screen throws the orb.

### Phase 4 — The full story

**This phase is in the game.** The fog is gone. You can sail the whole chain and, if you keep going, become champion.

**The chain.** Greenridge, Cragmoor, Stormreach, Ironspire, Mistveil, Ashwake, and Crownrest. Mistveil and Ashwake each have wild patches, a gym, a rival, and a shop. Crownrest is the champion island. You still earn each crossing by beating the first gym on the island you are leaving, or by swimming with a level 10 water creature. New gyms sit in the high 40s. The champion's team is level 50.

**The story.** Three threads, told in short scenes you can skip:

- The **Scoop Squad**, a digging crew that is mischievous rather than scary. Digger Dot, Shovel Sid, and Captain Scoop show up and battle you. They want to poke a sleeping heart under the islands.
- The **mystery**. Stones and ruins say the islands were once one land, kept apart by a heart that should stay asleep.
- The **champion climb**. After the Ashwake rival and Captain Scoop, three wardens and then Champion Lumen wait on Crownrest. Your rival keeps turning up along the way.

Scenes live in `src/data/story.js`. A portrait is a simple face, not a new painting. Winning a crew, warden, or champion fight is recorded on the save.

**After the ending.** You can rematch Champion Lumen. Three pedestals on Crownrest stay empty on purpose.

**Legendary slots, for later.** These are not creatures you can catch yet. They are reserved for creatures the kids invent:

1. **Heart of the Chain** (Crownrest). The sleeping heart under the islands.
2. **The Sleeper** (Mistveil). Something in the deep fog that has not woken up.
3. **Ashwake's Last Spark** (Ashwake). A spark in the ash that never went out.

**Saves.** Version 5. Older saves gain an empty story log and keep their roster, bag, and badges. Other kids' slots stay separate.

### Phase 5 — Battles between devices

**This phase is in the game.** From the title screen, Friend battle opens a private room. One kid creates a short code such as TIDE4. The other types it in. They fight with the teams already on their own devices. There is no public list, no accounts, and no chat.

**Fair fights.** The kid who creates the room can turn on "level 50" so both teams fight at the same level even if one has played more of the story. The fight does not change either save.

**If someone drops.** The battle waits about 45 seconds. Coming back with the same tab rejoins the room. If they do not, the friend who stayed is told the battle is over. A turn that sits for a minute uses the first move so a frozen tablet cannot stall the fight forever.

**The room server.** `server/index.js` is a small Node service on the free plan. It runs the same turn function as the story, once, and sends each screen the result. The game connects to `https://creature-clash-rooms.onrender.com` (and `wss://` for the live fight) without a build setting on the static site. The server only accepts the game at `https://creature-clash.onrender.com`, plus local testing when that env var is not set. Free instances sleep, so the first connection can take about a minute. The game says "Waking up the arena" while it waits. The island story still works if the room server cannot be reached.

### Phase 6 — Sound, music, and the kids' creatures

**This phase is in the game.** The adventure from the first screen through the champion is the game you play now. Sound and the three legendary pedestals are ready. The kids have not designed those creatures yet, so the pedestals stay hidden until a parent fills them in.

**Sound.** Music and effects are generated in the browser. There are no recorded tracks and nothing to license. The map, a battle, and Crownrest each have a short tune. Effects cover a move's type, a hit, a miss, a status, a catch, a level up, an evolution, and menu taps. Settings has music, effects, mute, and Play a note. The choice is saved with that player's file. On a phone the music starts off, so opening the game in a quiet room stays quiet. Nothing plays until the first tap, which is what phones require.

**The pedestals.** Heart of the Chain, The Sleeper, and Ashwake's Last Spark live in `src/data/legendaries.js`. Each one has a name, type, stats, moves, ability, optional art, and the island where it appears after the champion fight. `ready` is false, so they are not in the collection and cannot be caught. Setting `ready` to true, after the fields are filled in, wakes that pedestal. `docs/ADD_A_CREATURE.md` is the short guide for doing that with the kids. The Forge is still the toy for extra creatures. Promoting one onto a pedestal is a deliberate edit.

**Saves.** Version 6. Older saves gain sound settings and keep their creatures, story, and bag. A brand-new player still starts on Greenridge and can reach Champion Lumen by sailing the chain. The kids' site is `https://creature-clash.onrender.com`. `render.yaml` describes that static site and the free room service `creature-clash-rooms`.

## What we are not doing

- Renaming the current moves. That idea was dropped.
- A public online game, accounts, or a store release.
- Copying official creature names or another company's art. The creatures and pictures in this project are original. Familiar-sounding move names can stay.
