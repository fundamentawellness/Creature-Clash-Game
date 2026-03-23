# Battle Arena — Game Design Document
### Working title. Final names chosen by each player on handoff.

## Overview

A Pokemon Showdown-style creature battle game built as a React artifact. Pure battle simulator — no overworld, no catching. Players build a team of 3 creatures from a growing roster and battle AI opponents across three difficulty tiers. Progress is saved between sessions.

Built as a father-son vibe coding project. The base game is developed by Dad, then copied into two separate Claude Projects for twin 11-year-old boys to independently expand and customize through conversational coding.

### Naming Plan
The base game ships with the neutral title "Battle Arena." On handoff, each twin renames the game and the creatures to match their chosen identity:

- **Twin 1 — Ferakin Showdown**: Feral spirits that bond with a chosen trainer and become kin. Warm, wild, loyal energy.
- **Twin 2 — Runebeast Arena**: Ancient creatures sealed in elemental runes, awakened by battle. Harder edge, mythic energy.

Renaming the game title is their first vibe coding task. Creature renaming, lore development, and visual identity diverge from there.

---

## Type System

### Seven Types
Fire, Water, Grass, Electric, Rock, Ground, Poison

### Type Effectiveness Chart

| Attacker ↓ / Defender → | Fire | Water | Grass | Electric | Rock | Ground | Poison |
|--------------------------|------|-------|-------|----------|------|--------|--------|
| **Fire**                 | 0.5x | 0.5x | 2x   | 1x       | 0.5x | 1x     | 1x     |
| **Water**                | 2x   | 0.5x | 0.5x | 1x       | 2x   | 2x     | 1x     |
| **Grass**                | 0.5x | 2x   | 0.5x | 1x       | 2x   | 2x     | 0.5x   |
| **Electric**             | 1x   | 2x   | 0.5x | 0.5x     | 1x   | 0x     | 1x     |
| **Rock**                 | 2x   | 1x   | 1x   | 1x       | 1x   | 0.5x   | 1x     |
| **Ground**               | 2x   | 1x   | 0.5x | 2x       | 2x   | 1x     | 2x     |
| **Poison**               | 1x   | 1x   | 2x   | 1x       | 0.5x | 0.5x   | 0.5x   |
| **Normal**               | 1x   | 1x   | 1x   | 1x       | 0.5x | 1x     | 1x     |

Key interactions:
- Fire/Water/Grass triangle
- Electric → strong vs Water, immune to Ground (0x)
- Ground → most offensively dominant (hits Fire, Electric, Rock, Poison for 2x)
- Rock → defensive, resists Normal
- Poison → strong vs Grass, resisted by many

---

## Stat System

### Five Stats

| Stat | Description |
|------|-------------|
| **HP** | Total health points. Creature faints at 0. |
| **Attack (ATK)** | Determines damage for physical moves. |
| **Defense (DEF)** | Reduces damage from physical moves. |
| **Speed (SPD)** | Determines turn order. Higher speed goes first. |
| **Special (SPC)** | Determines damage for special moves AND resistance to special moves. |

### Archetypes

| Archetype | Stat Profile |
|-----------|-------------|
| **Speedster** | High SPD, moderate ATK/SPC, low DEF, moderate HP |
| **Tank** | High HP and DEF, low SPD, moderate ATK/SPC |
| **Glass Cannon** | High ATK or SPC, low HP and DEF, moderate SPD |
| **Bruiser** | High HP and ATK, moderate DEF, low SPD, moderate SPC |

### Level Scaling

- Each level grants +2 to all base stats (flat)
- Max meaningful level: ~12 (from progression system)
- By level 12, stats are +24 from base

---

## Battle Mechanics

### Turn Flow
1. Both sides select action (attack or switch)
2. Switching happens first (but costs the turn — no attack)
3. Faster creature attacks first (compare Speed stats)
4. Damage calculated and applied
5. Check for faint → force switch if creatures remain
6. Repeat until one side has no creatures left

### Damage Formula

```
damage = ((ATK or SPC) / (target DEF or SPC)) × movePower × STAB × typeEffectiveness × random / 3
```

- **ATK vs DEF**: Used for physical moves
- **SPC vs SPC**: Used for special moves
- **STAB**: 1.5x if move type matches creature type
- **Type Effectiveness**: 0x, 0.5x, 1x, or 2x per chart
- **Random**: Random multiplier between 0.85 and 1.0
- **Divisor of 3**: Tuning constant for balanced pacing

### Expected Pacing
- Weak starter STAB, neutral matchup: ~4-5 hits to KO
- Mid power STAB, neutral: ~3 hits to KO
- Strong STAB, super effective: can one-shot
- Normal moves without STAB: ~5-6 hits to KO

### Switching
- Player can switch active creature on their turn
- Switching consumes the turn (no attack that round)
- When a creature faints, switch is forced (does NOT cost a turn)
- AI switches based on difficulty level

### Same Type Attack Bonus (STAB)
- If the move's type matches the creature's type, damage × 1.5
- Encourages on-type moves while allowing off-type coverage

---

## Creature Roster — 28 Creatures

### Fire Type

| Creature | Archetype | HP | ATK | DEF | SPD | SPC | Total | Description |
|----------|-----------|-----|-----|-----|-----|-----|-------|-------------|
| **Emberpaw** | Speedster | 50 | 60 | 40 | 85 | 55 | 290 | Swift fire wolf |
| **Charrok** | Tank | 85 | 55 | 80 | 30 | 50 | 300 | Armored fire tortoise |
| **Blazicor** | Glass Cannon | 40 | 50 | 35 | 70 | 85 | 280 | Blazing fire hawk |
| **Ignox** | Bruiser | 75 | 80 | 55 | 35 | 55 | 300 | Charging fire bull |

### Water Type

| Creature | Archetype | HP | ATK | DEF | SPD | SPC | Total | Description |
|----------|-----------|-----|-----|-----|-----|-----|-------|-------------|
| **Aquafin** | Speedster | 50 | 55 | 40 | 85 | 60 | 290 | Sleek water dolphin |
| **Shellguard** | Tank | 90 | 50 | 85 | 25 | 50 | 300 | Massive water crab |
| **Torrentis** | Glass Cannon | 40 | 45 | 35 | 65 | 90 | 275 | Surging water serpent |
| **Tidalon** | Bruiser | 80 | 75 | 55 | 35 | 55 | 300 | Powerful water bear |

### Grass Type

| Creature | Archetype | HP | ATK | DEF | SPD | SPC | Total | Description |
|----------|-----------|-----|-----|-----|-----|-----|-------|-------------|
| **Leafyn** | Speedster | 45 | 55 | 40 | 90 | 60 | 290 | Darting grass sprite |
| **Mossback** | Tank | 90 | 50 | 85 | 25 | 45 | 295 | Overgrown tortoise |
| **Floravine** | Glass Cannon | 40 | 85 | 30 | 65 | 55 | 275 | Whipping vine creature |
| **Thornox** | Bruiser | 80 | 75 | 60 | 30 | 55 | 300 | Thorny ram |

### Electric Type

| Creature | Archetype | HP | ATK | DEF | SPD | SPC | Total | Description |
|----------|-----------|-----|-----|-----|-----|-----|-------|-------------|
| **Voltzap** | Speedster | 45 | 55 | 35 | 95 | 60 | 290 | Crackling electric ferret |
| **Ampshell** | Tank | 85 | 50 | 85 | 25 | 50 | 295 | Electric armadillo |
| **Strixion** | Glass Cannon | 40 | 45 | 30 | 70 | 90 | 275 | Storming owl |
| **Zaphorn** | Bruiser | 80 | 80 | 55 | 30 | 55 | 300 | Electric rhino |

### Rock Type

| Creature | Archetype | HP | ATK | DEF | SPD | SPC | Total | Description |
|----------|-----------|-----|-----|-----|-----|-----|-------|-------------|
| **Pebblit** | Speedster | 50 | 60 | 50 | 80 | 50 | 290 | Rolling rock creature |
| **Bouldar** | Tank | 85 | 55 | 90 | 20 | 45 | 295 | Living boulder |
| **Cragmaw** | Glass Cannon | 40 | 90 | 35 | 60 | 50 | 275 | Jagged rock jaw |
| **Geolith** | Bruiser | 80 | 80 | 60 | 25 | 55 | 300 | Stone golem |

### Ground Type

| Creature | Archetype | HP | ATK | DEF | SPD | SPC | Total | Description |
|----------|-----------|-----|-----|-----|-----|-----|-------|-------------|
| **Dustail** | Speedster | 50 | 60 | 40 | 85 | 55 | 290 | Burrowing sand fox |
| **Mudhide** | Tank | 85 | 50 | 85 | 25 | 50 | 295 | Clay armored beast |
| **Quakern** | Glass Cannon | 40 | 85 | 30 | 65 | 55 | 275 | Seismic mole |
| **Terrox** | Bruiser | 80 | 80 | 60 | 30 | 55 | 305 | Earth titan |

### Poison Type

| Creature | Archetype | HP | ATK | DEF | SPD | SPC | Total | Description |
|----------|-----------|-----|-----|-----|-----|-----|-------|-------------|
| **Toxifin** | Speedster | 45 | 55 | 35 | 90 | 65 | 290 | Poison dart frog |
| **Sludgekin** | Tank | 90 | 45 | 80 | 25 | 55 | 295 | Oozing slime blob |
| **Blightor** | Glass Cannon | 40 | 45 | 30 | 70 | 90 | 275 | Toxic moth |
| **Venomaw** | Bruiser | 75 | 80 | 55 | 35 | 55 | 300 | Fanged viper |

---

## Move System

### Move Properties

Each move has:
- **Name**
- **Type** (Fire, Water, Grass, Electric, Rock, Ground, Poison, or Normal)
- **Power** (0 for stat moves)
- **Accuracy** (% chance to hit, most are 95-100)
- **Category**: Physical (uses ATK/DEF), Special (uses SPC/SPC), or Status (stat changes)
- **Effect** (optional — stat changes, descriptions)

### Move Slot Rules
- Start with 2 moves
- Can learn up to 8 total through leveling
- Maximum of 4 moves held at any time
- When learning a 5th+ move, must choose one to forget

### Move Pool Structure Per Creature (8 moves each)
- 3 STAB moves (own type, scaling power: weak → medium → strong)
- 1 Normal damage move
- 1 off-type coverage move (not Normal, not own type)
- 3 Normal status moves (matching archetype)

### Move Learn Order
Moves are offered in this sequence as the creature levels up:

| Slot | Timing | Move Type | Purpose |
|------|--------|-----------|---------|
| 1 | Starter | Weak STAB | Starting same-type attack |
| 2 | Starter | Normal damage | Neutral coverage |
| 3 | Level 2 (2 wins) | Status move #1 | First archetype ability |
| 4 | Level 4 (4 wins) | Medium STAB | Power upgrade |
| 5 | Level 6 (6 wins) | Off-type coverage | Strategic expansion — FIRST FORGET CHOICE |
| 6 | Level 8 (8 wins) | Status move #2 | Second archetype ability |
| 7 | Level 10 (10 wins) | Strong STAB | Endgame power |
| 8 | Level 12 (12 wins) | Status move #3 | Final archetype ability |

---

## Shared Move Pools

### STAB Moves by Type

| Type | Weak (35 pow) | Medium (55 pow) | Strong (85 pow) |
|------|---------------|-----------------|-----------------|
| Fire | Flame Nip (phys) | Fire Fang (phys) | Inferno (spc) |
| Water | Water Splash (spc) | Aqua Jet (phys) | Hydro Cannon (spc) |
| Grass | Vine Whip (phys) | Leaf Blade (phys) | Nature's Wrath (spc) |
| Electric | Spark (phys) | Thunder Fang (phys) | Storm Strike (spc) |
| Rock | Pebble Toss (phys) | Rock Smash (phys) | Avalanche (phys) |
| Ground | Mud Slap (spc) | Earth Pound (phys) | Earthquake (phys) |
| Poison | Poison Sting (phys) | Toxic Bite (phys) | Plague Strike (spc) |

Note: Each creature may have a unique variant name for these at the same power level to add personality. See individual move pools below.

### Normal Damage Moves

| Move | Power | Category | Accuracy | Notes |
|------|-------|----------|----------|-------|
| Tackle | 40 | Physical | 100 | Standard starter for bruisers/tanks |
| Scratch | 40 | Physical | 100 | Standard starter for speedsters |
| Strike | 40 | Special | 100 | Standard starter for glass cannons |
| Slam | 45 | Physical | 95 | Slightly stronger, slightly less accurate |

### Status Moves by Archetype

**Speedster Moves:**
| Move | Effect | Accuracy |
|------|--------|----------|
| Speed Surge | Raise own SPD by 1 stage | — |
| Quick Dodge | Raise own evasion by 1 stage | — |
| Agility | Raise own SPD by 2 stages | — |

**Tank Moves:**
| Move | Effect | Accuracy |
|------|--------|----------|
| Iron Wall | Raise own DEF by 1 stage | — |
| Recover | Restore 30% max HP | — |
| Fortify | Raise own DEF and SPC resistance by 1 stage each | — |

**Glass Cannon Moves:**
| Move | Effect | Accuracy |
|------|--------|----------|
| Focus Energy | Raise own ATK by 1 stage | — |
| Mind Sharpen | Raise own SPC by 1 stage | — |
| Power Surge | Raise own ATK and SPC by 1 stage each, lower DEF by 1 stage | — |

**Bruiser Moves:**
| Move | Effect | Accuracy |
|------|--------|----------|
| War Cry | Lower opponent DEF by 1 stage | 100 |
| Bulk Up | Raise own ATK and DEF by 1 stage each | — |
| Intimidate | Lower opponent ATK by 1 stage | 100 |

### Stat Stages
- Stat stages range from -3 to +3
- Each stage = 25% modification (multiplicative)
  - +1 = 1.25x, +2 = 1.5x, +3 = 1.75x
  - -1 = 0.75x, -2 = 0.5x, -3 = 0.25x
- Stages reset when a creature switches out or faints

---

## Individual Creature Move Pools

### Fire Creatures

**Emberpaw** (Fire / Speedster)
| # | Move | Type | Power | Cat | Acc | Effect |
|---|------|------|-------|-----|-----|--------|
| 1 | Flame Nip | Fire | 35 | Phys | 100 | — |
| 2 | Scratch | Normal | 40 | Phys | 100 | — |
| 3 | Speed Surge | Normal | — | Status | — | +1 SPD |
| 4 | Fire Fang | Fire | 55 | Phys | 95 | — |
| 5 | Rock Fang | Rock | 50 | Phys | 95 | Off-type coverage |
| 6 | Quick Dodge | Normal | — | Status | — | +1 Evasion |
| 7 | Inferno | Fire | 85 | Spc | 90 | — |
| 8 | Agility | Normal | — | Status | — | +2 SPD |

**Charrok** (Fire / Tank)
| # | Move | Type | Power | Cat | Acc | Effect |
|---|------|------|-------|-----|-----|--------|
| 1 | Flame Nip | Fire | 35 | Phys | 100 | — |
| 2 | Tackle | Normal | 40 | Phys | 100 | — |
| 3 | Iron Wall | Normal | — | Status | — | +1 DEF |
| 4 | Fire Fang | Fire | 55 | Phys | 95 | — |
| 5 | Earth Stomp | Ground | 50 | Phys | 95 | Off-type coverage |
| 6 | Recover | Normal | — | Status | — | Heal 30% HP |
| 7 | Inferno | Fire | 85 | Spc | 90 | — |
| 8 | Fortify | Normal | — | Status | — | +1 DEF, +1 SPC resist |

**Blazicor** (Fire / Glass Cannon)
| # | Move | Type | Power | Cat | Acc | Effect |
|---|------|------|-------|-----|-----|--------|
| 1 | Flame Nip | Fire | 35 | Phys | 100 | — |
| 2 | Strike | Normal | 40 | Spc | 100 | — |
| 3 | Mind Sharpen | Normal | — | Status | — | +1 SPC |
| 4 | Fire Fang | Fire | 55 | Phys | 95 | — |
| 5 | Poison Talon | Poison | 50 | Phys | 95 | Off-type coverage |
| 6 | Focus Energy | Normal | — | Status | — | +1 ATK |
| 7 | Inferno | Fire | 85 | Spc | 90 | — |
| 8 | Power Surge | Normal | — | Status | — | +1 ATK & SPC, -1 DEF |

**Ignox** (Fire / Bruiser)
| # | Move | Type | Power | Cat | Acc | Effect |
|---|------|------|-------|-----|-----|--------|
| 1 | Flame Nip | Fire | 35 | Phys | 100 | — |
| 2 | Slam | Normal | 45 | Phys | 95 | — |
| 3 | War Cry | Normal | — | Status | 100 | -1 opponent DEF |
| 4 | Fire Fang | Fire | 55 | Phys | 95 | — |
| 5 | Rock Charge | Rock | 55 | Phys | 90 | Off-type coverage |
| 6 | Bulk Up | Normal | — | Status | — | +1 ATK, +1 DEF |
| 7 | Inferno | Fire | 85 | Spc | 90 | — |
| 8 | Intimidate | Normal | — | Status | 100 | -1 opponent ATK |

### Water Creatures

**Aquafin** (Water / Speedster)
| # | Move | Type | Power | Cat | Acc | Effect |
|---|------|------|-------|-----|-----|--------|
| 1 | Water Splash | Water | 35 | Spc | 100 | — |
| 2 | Scratch | Normal | 40 | Phys | 100 | — |
| 3 | Speed Surge | Normal | — | Status | — | +1 SPD |
| 4 | Aqua Jet | Water | 55 | Phys | 95 | — |
| 5 | Poison Spray | Poison | 50 | Spc | 95 | Off-type coverage |
| 6 | Quick Dodge | Normal | — | Status | — | +1 Evasion |
| 7 | Hydro Cannon | Water | 85 | Spc | 90 | — |
| 8 | Agility | Normal | — | Status | — | +2 SPD |

**Shellguard** (Water / Tank)
| # | Move | Type | Power | Cat | Acc | Effect |
|---|------|------|-------|-----|-----|--------|
| 1 | Water Splash | Water | 35 | Spc | 100 | — |
| 2 | Tackle | Normal | 40 | Phys | 100 | — |
| 3 | Iron Wall | Normal | — | Status | — | +1 DEF |
| 4 | Aqua Jet | Water | 55 | Phys | 95 | — |
| 5 | Rock Shell | Rock | 50 | Phys | 95 | Off-type coverage |
| 6 | Recover | Normal | — | Status | — | Heal 30% HP |
| 7 | Hydro Cannon | Water | 85 | Spc | 90 | — |
| 8 | Fortify | Normal | — | Status | — | +1 DEF, +1 SPC resist |

**Torrentis** (Water / Glass Cannon)
| # | Move | Type | Power | Cat | Acc | Effect |
|---|------|------|-------|-----|-----|--------|
| 1 | Water Splash | Water | 35 | Spc | 100 | — |
| 2 | Strike | Normal | 40 | Spc | 100 | — |
| 3 | Mind Sharpen | Normal | — | Status | — | +1 SPC |
| 4 | Aqua Jet | Water | 55 | Phys | 95 | — |
| 5 | Electric Surge | Electric | 50 | Spc | 95 | Off-type coverage |
| 6 | Focus Energy | Normal | — | Status | — | +1 ATK |
| 7 | Hydro Cannon | Water | 85 | Spc | 90 | — |
| 8 | Power Surge | Normal | — | Status | — | +1 ATK & SPC, -1 DEF |

**Tidalon** (Water / Bruiser)
| # | Move | Type | Power | Cat | Acc | Effect |
|---|------|------|-------|-----|-----|--------|
| 1 | Water Splash | Water | 35 | Spc | 100 | — |
| 2 | Slam | Normal | 45 | Phys | 95 | — |
| 3 | War Cry | Normal | — | Status | 100 | -1 opponent DEF |
| 4 | Aqua Jet | Water | 55 | Phys | 95 | — |
| 5 | Ground Pound | Ground | 55 | Phys | 90 | Off-type coverage |
| 6 | Bulk Up | Normal | — | Status | — | +1 ATK, +1 DEF |
| 7 | Hydro Cannon | Water | 85 | Spc | 90 | — |
| 8 | Intimidate | Normal | — | Status | 100 | -1 opponent ATK |

### Grass Creatures

**Leafyn** (Grass / Speedster)
| # | Move | Type | Power | Cat | Acc | Effect |
|---|------|------|-------|-----|-----|--------|
| 1 | Vine Whip | Grass | 35 | Phys | 100 | — |
| 2 | Scratch | Normal | 40 | Phys | 100 | — |
| 3 | Speed Surge | Normal | — | Status | — | +1 SPD |
| 4 | Leaf Blade | Grass | 55 | Phys | 95 | — |
| 5 | Electric Seed | Electric | 50 | Spc | 95 | Off-type coverage |
| 6 | Quick Dodge | Normal | — | Status | — | +1 Evasion |
| 7 | Nature's Wrath | Grass | 85 | Spc | 90 | — |
| 8 | Agility | Normal | — | Status | — | +2 SPD |

**Mossback** (Grass / Tank)
| # | Move | Type | Power | Cat | Acc | Effect |
|---|------|------|-------|-----|-----|--------|
| 1 | Vine Whip | Grass | 35 | Phys | 100 | — |
| 2 | Tackle | Normal | 40 | Phys | 100 | — |
| 3 | Iron Wall | Normal | — | Status | — | +1 DEF |
| 4 | Leaf Blade | Grass | 55 | Phys | 95 | — |
| 5 | Ground Root | Ground | 50 | Phys | 95 | Off-type coverage |
| 6 | Recover | Normal | — | Status | — | Heal 30% HP |
| 7 | Nature's Wrath | Grass | 85 | Spc | 90 | — |
| 8 | Fortify | Normal | — | Status | — | +1 DEF, +1 SPC resist |

**Floravine** (Grass / Glass Cannon)
| # | Move | Type | Power | Cat | Acc | Effect |
|---|------|------|-------|-----|-----|--------|
| 1 | Vine Whip | Grass | 35 | Phys | 100 | — |
| 2 | Strike | Normal | 40 | Spc | 100 | — |
| 3 | Focus Energy | Normal | — | Status | — | +1 ATK |
| 4 | Leaf Blade | Grass | 55 | Phys | 95 | — |
| 5 | Poison Lash | Poison | 50 | Phys | 95 | Off-type coverage |
| 6 | Mind Sharpen | Normal | — | Status | — | +1 SPC |
| 7 | Nature's Wrath | Grass | 85 | Spc | 90 | — |
| 8 | Power Surge | Normal | — | Status | — | +1 ATK & SPC, -1 DEF |

**Thornox** (Grass / Bruiser)
| # | Move | Type | Power | Cat | Acc | Effect |
|---|------|------|-------|-----|-----|--------|
| 1 | Vine Whip | Grass | 35 | Phys | 100 | — |
| 2 | Slam | Normal | 45 | Phys | 95 | — |
| 3 | War Cry | Normal | — | Status | 100 | -1 opponent DEF |
| 4 | Leaf Blade | Grass | 55 | Phys | 95 | — |
| 5 | Rock Thorn | Rock | 55 | Phys | 90 | Off-type coverage |
| 6 | Bulk Up | Normal | — | Status | — | +1 ATK, +1 DEF |
| 7 | Nature's Wrath | Grass | 85 | Spc | 90 | — |
| 8 | Intimidate | Normal | — | Status | 100 | -1 opponent ATK |

### Electric Creatures

**Voltzap** (Electric / Speedster)
| # | Move | Type | Power | Cat | Acc | Effect |
|---|------|------|-------|-----|-----|--------|
| 1 | Spark | Electric | 35 | Phys | 100 | — |
| 2 | Scratch | Normal | 40 | Phys | 100 | — |
| 3 | Speed Surge | Normal | — | Status | — | +1 SPD |
| 4 | Thunder Fang | Electric | 55 | Phys | 95 | — |
| 5 | Grass Surge | Grass | 50 | Spc | 95 | Off-type coverage |
| 6 | Quick Dodge | Normal | — | Status | — | +1 Evasion |
| 7 | Storm Strike | Electric | 85 | Spc | 90 | — |
| 8 | Agility | Normal | — | Status | — | +2 SPD |

**Ampshell** (Electric / Tank)
| # | Move | Type | Power | Cat | Acc | Effect |
|---|------|------|-------|-----|-----|--------|
| 1 | Spark | Electric | 35 | Phys | 100 | — |
| 2 | Tackle | Normal | 40 | Phys | 100 | — |
| 3 | Iron Wall | Normal | — | Status | — | +1 DEF |
| 4 | Thunder Fang | Electric | 55 | Phys | 95 | — |
| 5 | Rock Armor | Rock | 50 | Phys | 95 | Off-type coverage |
| 6 | Recover | Normal | — | Status | — | Heal 30% HP |
| 7 | Storm Strike | Electric | 85 | Spc | 90 | — |
| 8 | Fortify | Normal | — | Status | — | +1 DEF, +1 SPC resist |

**Strixion** (Electric / Glass Cannon)
| # | Move | Type | Power | Cat | Acc | Effect |
|---|------|------|-------|-----|-----|--------|
| 1 | Spark | Electric | 35 | Phys | 100 | — |
| 2 | Strike | Normal | 40 | Spc | 100 | — |
| 3 | Mind Sharpen | Normal | — | Status | — | +1 SPC |
| 4 | Thunder Fang | Electric | 55 | Phys | 95 | — |
| 5 | Fire Spark | Fire | 50 | Spc | 95 | Off-type coverage |
| 6 | Focus Energy | Normal | — | Status | — | +1 ATK |
| 7 | Storm Strike | Electric | 85 | Spc | 90 | — |
| 8 | Power Surge | Normal | — | Status | — | +1 ATK & SPC, -1 DEF |

**Zaphorn** (Electric / Bruiser)
| # | Move | Type | Power | Cat | Acc | Effect |
|---|------|------|-------|-----|-----|--------|
| 1 | Spark | Electric | 35 | Phys | 100 | — |
| 2 | Slam | Normal | 45 | Phys | 95 | — |
| 3 | War Cry | Normal | — | Status | 100 | -1 opponent DEF |
| 4 | Thunder Fang | Electric | 55 | Phys | 95 | — |
| 5 | Ground Stomp | Ground | 55 | Phys | 90 | Off-type coverage |
| 6 | Bulk Up | Normal | — | Status | — | +1 ATK, +1 DEF |
| 7 | Storm Strike | Electric | 85 | Spc | 90 | — |
| 8 | Intimidate | Normal | — | Status | 100 | -1 opponent ATK |

### Rock Creatures

**Pebblit** (Rock / Speedster)
| # | Move | Type | Power | Cat | Acc | Effect |
|---|------|------|-------|-----|-----|--------|
| 1 | Pebble Toss | Rock | 35 | Phys | 100 | — |
| 2 | Scratch | Normal | 40 | Phys | 100 | — |
| 3 | Speed Surge | Normal | — | Status | — | +1 SPD |
| 4 | Rock Smash | Rock | 55 | Phys | 95 | — |
| 5 | Ground Roll | Ground | 50 | Phys | 95 | Off-type coverage |
| 6 | Quick Dodge | Normal | — | Status | — | +1 Evasion |
| 7 | Avalanche | Rock | 85 | Phys | 90 | — |
| 8 | Agility | Normal | — | Status | — | +2 SPD |

**Bouldar** (Rock / Tank)
| # | Move | Type | Power | Cat | Acc | Effect |
|---|------|------|-------|-----|-----|--------|
| 1 | Pebble Toss | Rock | 35 | Phys | 100 | — |
| 2 | Tackle | Normal | 40 | Phys | 100 | — |
| 3 | Iron Wall | Normal | — | Status | — | +1 DEF |
| 4 | Rock Smash | Rock | 55 | Phys | 95 | — |
| 5 | Water Seep | Water | 50 | Spc | 95 | Off-type coverage |
| 6 | Recover | Normal | — | Status | — | Heal 30% HP |
| 7 | Avalanche | Rock | 85 | Phys | 90 | — |
| 8 | Fortify | Normal | — | Status | — | +1 DEF, +1 SPC resist |

**Cragmaw** (Rock / Glass Cannon)
| # | Move | Type | Power | Cat | Acc | Effect |
|---|------|------|-------|-----|-----|--------|
| 1 | Pebble Toss | Rock | 35 | Phys | 100 | — |
| 2 | Strike | Normal | 40 | Spc | 100 | — |
| 3 | Focus Energy | Normal | — | Status | — | +1 ATK |
| 4 | Rock Smash | Rock | 55 | Phys | 95 | — |
| 5 | Fire Crunch | Fire | 50 | Phys | 95 | Off-type coverage |
| 6 | Mind Sharpen | Normal | — | Status | — | +1 SPC |
| 7 | Avalanche | Rock | 85 | Phys | 90 | — |
| 8 | Power Surge | Normal | — | Status | — | +1 ATK & SPC, -1 DEF |

**Geolith** (Rock / Bruiser)
| # | Move | Type | Power | Cat | Acc | Effect |
|---|------|------|-------|-----|-----|--------|
| 1 | Pebble Toss | Rock | 35 | Phys | 100 | — |
| 2 | Slam | Normal | 45 | Phys | 95 | — |
| 3 | War Cry | Normal | — | Status | 100 | -1 opponent DEF |
| 4 | Rock Smash | Rock | 55 | Phys | 95 | — |
| 5 | Grass Crush | Grass | 55 | Phys | 90 | Off-type coverage |
| 6 | Bulk Up | Normal | — | Status | — | +1 ATK, +1 DEF |
| 7 | Avalanche | Rock | 85 | Phys | 90 | — |
| 8 | Intimidate | Normal | — | Status | 100 | -1 opponent ATK |

### Ground Creatures

**Dustail** (Ground / Speedster)
| # | Move | Type | Power | Cat | Acc | Effect |
|---|------|------|-------|-----|-----|--------|
| 1 | Mud Slap | Ground | 35 | Spc | 100 | — |
| 2 | Scratch | Normal | 40 | Phys | 100 | — |
| 3 | Speed Surge | Normal | — | Status | — | +1 SPD |
| 4 | Earth Pound | Ground | 55 | Phys | 95 | — |
| 5 | Poison Dust | Poison | 50 | Spc | 95 | Off-type coverage |
| 6 | Quick Dodge | Normal | — | Status | — | +1 Evasion |
| 7 | Earthquake | Ground | 85 | Phys | 90 | — |
| 8 | Agility | Normal | — | Status | — | +2 SPD |

**Mudhide** (Ground / Tank)
| # | Move | Type | Power | Cat | Acc | Effect |
|---|------|------|-------|-----|-----|--------|
| 1 | Mud Slap | Ground | 35 | Spc | 100 | — |
| 2 | Tackle | Normal | 40 | Phys | 100 | — |
| 3 | Iron Wall | Normal | — | Status | — | +1 DEF |
| 4 | Earth Pound | Ground | 55 | Phys | 95 | — |
| 5 | Rock Skin | Rock | 50 | Phys | 95 | Off-type coverage |
| 6 | Recover | Normal | — | Status | — | Heal 30% HP |
| 7 | Earthquake | Ground | 85 | Phys | 90 | — |
| 8 | Fortify | Normal | — | Status | — | +1 DEF, +1 SPC resist |

**Quakern** (Ground / Glass Cannon)
| # | Move | Type | Power | Cat | Acc | Effect |
|---|------|------|-------|-----|-----|--------|
| 1 | Mud Slap | Ground | 35 | Spc | 100 | — |
| 2 | Strike | Normal | 40 | Spc | 100 | — |
| 3 | Focus Energy | Normal | — | Status | — | +1 ATK |
| 4 | Earth Pound | Ground | 55 | Phys | 95 | — |
| 5 | Grass Burrow | Grass | 50 | Spc | 95 | Off-type coverage |
| 6 | Mind Sharpen | Normal | — | Status | — | +1 SPC |
| 7 | Earthquake | Ground | 85 | Phys | 90 | — |
| 8 | Power Surge | Normal | — | Status | — | +1 ATK & SPC, -1 DEF |

**Terrox** (Ground / Bruiser)
| # | Move | Type | Power | Cat | Acc | Effect |
|---|------|------|-------|-----|-----|--------|
| 1 | Mud Slap | Ground | 35 | Spc | 100 | — |
| 2 | Slam | Normal | 45 | Phys | 95 | — |
| 3 | War Cry | Normal | — | Status | 100 | -1 opponent DEF |
| 4 | Earth Pound | Ground | 55 | Phys | 95 | — |
| 5 | Fire Stomp | Fire | 55 | Phys | 90 | Off-type coverage |
| 6 | Bulk Up | Normal | — | Status | — | +1 ATK, +1 DEF |
| 7 | Earthquake | Ground | 85 | Phys | 90 | — |
| 8 | Intimidate | Normal | — | Status | 100 | -1 opponent ATK |

### Poison Creatures

**Toxifin** (Poison / Speedster)
| # | Move | Type | Power | Cat | Acc | Effect |
|---|------|------|-------|-----|-----|--------|
| 1 | Poison Sting | Poison | 35 | Phys | 100 | — |
| 2 | Scratch | Normal | 40 | Phys | 100 | — |
| 3 | Speed Surge | Normal | — | Status | — | +1 SPD |
| 4 | Toxic Bite | Poison | 55 | Phys | 95 | — |
| 5 | Water Venom | Water | 50 | Spc | 95 | Off-type coverage |
| 6 | Quick Dodge | Normal | — | Status | — | +1 Evasion |
| 7 | Plague Strike | Poison | 85 | Spc | 90 | — |
| 8 | Agility | Normal | — | Status | — | +2 SPD |

**Sludgekin** (Poison / Tank)
| # | Move | Type | Power | Cat | Acc | Effect |
|---|------|------|-------|-----|-----|--------|
| 1 | Poison Sting | Poison | 35 | Phys | 100 | — |
| 2 | Tackle | Normal | 40 | Phys | 100 | — |
| 3 | Iron Wall | Normal | — | Status | — | +1 DEF |
| 4 | Toxic Bite | Poison | 55 | Phys | 95 | — |
| 5 | Ground Ooze | Ground | 50 | Spc | 95 | Off-type coverage |
| 6 | Recover | Normal | — | Status | — | Heal 30% HP |
| 7 | Plague Strike | Poison | 85 | Spc | 90 | — |
| 8 | Fortify | Normal | — | Status | — | +1 DEF, +1 SPC resist |

**Blightor** (Poison / Glass Cannon)
| # | Move | Type | Power | Cat | Acc | Effect |
|---|------|------|-------|-----|-----|--------|
| 1 | Poison Sting | Poison | 35 | Phys | 100 | — |
| 2 | Strike | Normal | 40 | Spc | 100 | — |
| 3 | Mind Sharpen | Normal | — | Status | — | +1 SPC |
| 4 | Toxic Bite | Poison | 55 | Phys | 95 | — |
| 5 | Grass Spore | Grass | 50 | Spc | 95 | Off-type coverage |
| 6 | Focus Energy | Normal | — | Status | — | +1 ATK |
| 7 | Plague Strike | Poison | 85 | Spc | 90 | — |
| 8 | Power Surge | Normal | — | Status | — | +1 ATK & SPC, -1 DEF |

**Venomaw** (Poison / Bruiser)
| # | Move | Type | Power | Cat | Acc | Effect |
|---|------|------|-------|-----|-----|--------|
| 1 | Poison Sting | Poison | 35 | Phys | 100 | — |
| 2 | Slam | Normal | 45 | Phys | 95 | — |
| 3 | War Cry | Normal | — | Status | 100 | -1 opponent DEF |
| 4 | Toxic Bite | Poison | 55 | Phys | 95 | — |
| 5 | Fire Venom | Fire | 55 | Phys | 90 | Off-type coverage |
| 6 | Bulk Up | Normal | — | Status | — | +1 ATK, +1 DEF |
| 7 | Plague Strike | Poison | 85 | Spc | 90 | — |
| 8 | Intimidate | Normal | — | Status | 100 | -1 opponent ATK |

---

## Progression System

### Leveling
- Every 2 wins = 1 level up
- All stats gain +2 per level
- New move offered every other level (levels 2, 4, 6, 8, 10, 12)
- Leveling is per-creature (not per-team)
- Each creature can reach max level 12 (24 wins with that creature)

### Creature Unlock Progression

**Starting state:** 10 creatures available from the full roster of 28. Player picks 3 for their team.

**Unlock cadence:**
- Every 2nd opponent beaten = 1 random new creature unlocked
- After beating all Easy opponents = player's choice of 1 specific creature to unlock
- Natural play through Medium difficulty unlocks remaining creatures from the 28
- All 28 should be accessible by mid-to-late Medium difficulty

### The Hard Mode Payoff

After beating Hard difficulty:
- **Creature Creator unlocked** — design 5 brand new custom creatures
  - Choose a name, type, stat distribution, and description
  - Assign moves from existing pools or create new move names
- **New Type Creator unlocked** — design 1-2 entirely new types
  - Define effectiveness against all existing types
  - New types integrate into the full matchup chart
  - New creatures can use the new types

This is the transition from player to designer to vibe coder — they'll naturally want to refine, rebalance, and expand beyond what the in-game creator offers, leading them into the actual codebase.

---

## AI Opponent System

### Three Difficulty Tiers

**Easy**
- AI picks moves semi-randomly (50% chance of optimal move, 50% random)
- Teams are not optimized for type coverage
- AI never switches creatures voluntarily
- Good for learning mechanics and leveling up

**Medium**
- AI picks the most effective available move ~75% of the time
- Teams have decent type coverage
- AI will switch when at a severe type disadvantage
- Provides a real challenge without being punishing

**Hard**
- AI always picks the optimal move
- Teams are built with full type coverage and synergy
- AI switches strategically (predicts your switches, preserves weakened creatures)
- Comparable to competitive play

### AI Team Building
- AI selects 3 creatures from the same unlocked pool as the player (Easy)
- AI selects from the full roster regardless of player unlocks (Medium/Hard)
- Hard AI teams are handcrafted with complementary types and coverage

### Battle Structure
- Each difficulty tier has a series of opponents to beat
- Opponents do not repeat until all in that tier are cleared
- After clearing a tier, it can be replayed (creatures still earn XP)

---

## Save System

### Persistent Data (saved between sessions via storage API)
- All unlocked creatures
- Each creature's level, wins, and current move set
- Which moves have been learned/offered
- Difficulty progression (which opponents beaten per tier)
- Team composition (last selected team of 3)

### Reset Option
- Full reset available to start completely fresh
- Individual creature reset NOT available (prevents accidental loss)

---

## UI Flow

### Screens

1. **Title Screen** — Game name, "Continue" / "New Game" / "Reset"
2. **Roster Screen** — View all unlocked creatures, their stats, types, moves. Select team of 3.
3. **Difficulty Select** — Easy / Medium / Hard with progress indicators
4. **Battle Screen** — The core game
   - Both creatures visible with HP bars, names, types, levels
   - Move buttons (2-4 depending on learned moves)
   - Switch button to swap active creature
   - Battle log showing what happened each turn
   - Type effectiveness callouts ("It's super effective!")
5. **Victory/Defeat Screen** — XP gained, level ups, new moves offered, creatures unlocked
6. **Move Learn Screen** — When offered a new move: shows current moves, new move details, pick which to keep/drop

---

## Future Breadcrumbs (Features for the boys to add)

These are intentionally left out of the base game as expansion opportunities:

- **Evolution** — creatures transform at certain levels into stronger forms
- **Dual typing** — creatures with two types (complex effectiveness)
- **Status conditions** — burn, poison, paralysis, sleep, freeze
- **Held items** — equippable items that modify stats or add effects
- **Weather conditions** — rain/sun/sandstorm that affect battle
- **Abilities** — passive traits per creature (Intimidate on entry, etc.)
- **Critical hits** — random chance for bonus damage
- **Priority moves** — moves that always go first regardless of Speed
- **Gym leader progression** — themed boss fights with stories
- **Tournament mode** — bracket-style competition
- **Two-player local battles** — take turns on the same device
- **Creature artwork** — custom sprites or icons for each creature
- **Move animations** — visual effects when moves are used
- **Sound effects and music** — battle themes and hit sounds
- **Creature dex** — encyclopedia of all discovered creatures
- **Breeding** — combine two creatures for a new hybrid

---

## Technical Notes

### Platform
- Built as a React (JSX) artifact
- Single-file implementation
- Persistent storage via `window.storage` API
- No external assets or network required

### Data Architecture
- All creature data defined as JSON objects
- Type chart as a 2D lookup object
- Save state as a single JSON blob stored under one key
- Game state managed via React useState/useReducer

### Storage Keys
- `creature-clash-save` — main save file (all progress)
- `creature-clash-settings` — any user preferences

---

*Document version: 1.0*
*Ready for development*
