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

**Goal.** The game stops being only a menu of gyms. You meet wild creatures, catch them, fill a collection book, and sail (or swim) between the first islands.

**What you can play.** A short voyage: a home island, wild encounters, a collection book that fills in as you catch, and enough of a map to reach the next island once you have a boat or a strong swimmer. Gyms from Phase 1 still work.

**Features.**

- Wild encounters and catching. The roster currently grows only when a leader or rival lets you pick a locked creature (`ResultScreen`). Catching is a new flow: a wild fight, then a catch, then the creature joins the collection at a sensible level.
- A collection book. The save already remembers which creatures are unlocked. The book is the friendly version of that list: seen, caught, and still missing.
- A map you can move around, with the first islands. Today's campaign screen is a scroll of zone cards, not a place. The first islands can reuse Greenridge and Cragmoor — their gyms, leaders, and levels — and put them on a map.
- The crossing rule: no boat and no strong swimmer means the next island stays closed.

**Notes.** There is no walking map and no encounter table in the code. This phase adds them; it does not squeeze them into the gym menu. Art for new creatures can start from the 21 bank pictures already used by the Forge. Battles can keep using the same Phaser scene. The save file will need new fields (caught list, boat, current island). Old saves should keep working.

### Phase 4 — The full story

**Goal.** Tell the whole island story: the digging crew, the mystery, and the climb to champion, across the full chain.

**What you can play.** Start on the first island and, if you keep going, finish as champion. Gyms are places you travel to. The rival and the villain crew show up more than once. The ending pays off the ancient secret.

**Features.**

- Story scenes between gyms, not only one line before a leader.
- The rest of the islands, each with wild creatures and a gym, using the same "earn the crossing" rule.
- A champion fight, and a clear "you did it" ending. The game already has a champion flag that turns on when the Forge unlocks, after the last rival. The real champion should be a fight and a story moment, not only a checkbox.
- The four current zones are the model for gym structure: trainers, a typed leader, a badge, then a rival. Later islands can follow that rhythm so the campaign code does not need a second system.

**Notes.** Dialogue today is short strings on each leader and rival in `src/data/campaign.js`. A longer story wants a simple scene list (who talks, what they say, which picture) rather than more fields buried on the gym. The static site that hosts the game does not need to change for this phase. It is still one player on one device.

### Phase 5 — Battles between devices

**Goal.** Two kids, two devices, one private room. They battle each other without the game being public on the internet.

**What you can play.** One kid creates a short room code. The other types it in. They fight with the teams they already built. Family and friends only — no matchmaking, no public ladder.

**Features.**

- A room code that is easy to read aloud.
- Both players see the same fight and pick moves on their own screen.
- The fight uses the same rules as the single-player battle.
- A small always-on service to pass moves back and forth. The game the kids open can stay a static site. The room host would be a second, small web service. That service is new; this phase is the one that adds it. The current deploy file only describes the static site, and it should gain a second service when this phase is built, not before.

**Notes.** The turn runner is already a plain function: given both choices, it returns what happened. That is a good fit for "both phones send a choice, the server (or one phone) runs the turn, both phones play the result." Saves can stay on each device. The server only needs the room and the current fight, not a full account system. Keep the room private. Do not add accounts or a public directory of players for a family game.

### Phase 6 — Kid creatures, sound, and music

**Goal.** The creatures the kids invented become real parts of the game, and the battles stop being silent.

**What you can play.** A finished adventure that includes the special creatures the kids helped design, with sound effects and music.

**Features.**

- A small set of kid-invented creatures, including the rare ones, placed in the story (an island, a legend, a last fight). They get a name, a type, stats, moves, and a picture. The Forge remains the toy for extra custom fighters. Promoting a kid's idea into the official roster is a deliberate step, so a typo in the Forge does not rewrite the story.
- Sound effects for hits, dodges, fainting, catching, and badges.
- Music that can be turned down. Different islands can have different tunes later; one battle theme and one map theme is enough to start.

**Notes.** Sound is switched off in the battle setup on purpose (`src/game/config.js`). Turning it on means adding audio files and a volume control in Settings, and keeping it off until a file is actually there so phones do not play silence or errors. The art bank is the first place to look for pictures before anyone has to draw from scratch.

## What we are not doing

- Renaming the current moves. That idea was dropped.
- A public online game, accounts, or a store release.
- Copying official creature names or another company's art. The creatures and pictures in this project are original. Familiar-sounding move names can stay.
