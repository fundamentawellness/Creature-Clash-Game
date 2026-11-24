// The island story. Short scenes, a mischievous digging crew, and the champion climb.
// Three legendary slots are named here and left empty for creatures the kids invent later.

export const LEGENDS = [
  {
    id: 'heart-of-the-chain',
    name: 'Heart of the Chain',
    where: 'Crownrest',
    hint: 'The sleeping heart under the islands. A kid still gets to decide what it looks like.',
  },
  {
    id: 'sleeper-in-the-fog',
    name: 'The Sleeper',
    where: 'Mistveil',
    hint: 'Something in the deep fog has not woken up. Its name and picture are still open.',
  },
  {
    id: 'last-spark',
    name: "Ashwake's Last Spark",
    where: 'Ashwake',
    hint: 'A spark that never went out in the ash. Waiting for a kid to invent the creature.',
  },
]

export const CREW = [
  {
    id: 'dot',
    name: 'Digger Dot',
    island: 'greenridge',
    title: 'Scoop Squad',
    afterScene: 'greenridge',
    team: [{ id: 'pebblit', level: 8 }, { id: 'dustail', level: 9 }],
    ai: { optimalChance: 0.45, switchBehavior: 'never' },
  },
  {
    id: 'sid',
    name: 'Shovel Sid',
    island: 'stormreach',
    title: 'Scoop Squad',
    afterScene: 'stormreach',
    team: [{ id: 'quakeburrow', level: 26 }, { id: 'cragrip', level: 28 }, { id: 'dunewind', level: 28 }],
    ai: { optimalChance: 0.7, switchBehavior: 'smart' },
  },
  {
    id: 'scoop',
    name: 'Captain Scoop',
    island: 'ashwake',
    title: 'Scoop Squad boss',
    afterScene: 'ashwake',
    team: [{ id: 'seismole', level: 48 }, { id: 'solmane', level: 48 }, { id: 'sandreign', level: 49 }, { id: 'terravault', level: 50 }],
    ai: { optimalChance: 0.9, switchBehavior: 'proactive' },
  },
]

export const ELITES = [
  {
    id: 'brine',
    name: 'Warden Brine',
    title: 'Tide warden',
    team: [{ id: 'tidewyrm', level: 50 }, { id: 'maelvon', level: 50 }, { id: 'shellbastion', level: 50 }],
  },
  {
    id: 'cinder',
    name: 'Warden Cinder',
    title: 'Flame warden',
    team: [{ id: 'solmane', level: 50 }, { id: 'pyrexis', level: 50 }, { id: 'ignarok', level: 50 }],
  },
  {
    id: 'pebble',
    name: 'Warden Pebble',
    title: 'Stone warden',
    team: [{ id: 'quarrion', level: 50 }, { id: 'geomight', level: 50 }, { id: 'cragracer', level: 50 }],
  },
]

export const CHAMPION = {
  id: 'lumen',
  name: 'Champion Lumen',
  title: 'Champion of the islands',
  team: [
    { id: 'solmane', level: 50 },
    { id: 'tidewyrm', level: 50 },
    { id: 'verdwisp', level: 50 },
    { id: 'stormlash', level: 50 },
  ],
}

export const SCENES = [
  {
    id: 'harbor',
    place: 'map',
    lines: [
      { who: 'plaque', name: 'Harbor chart', face: '🗺️', color: '#63b3ed', text: 'Six islands and one crown. Someone has been digging on every beach.' },
      { who: 'rival', face: '😤', color: '#fc8181', text: 'I already left. Try to keep up. And watch out for kids with shovels.' },
    ],
  },
  {
    id: 'greenridge',
    place: 'greenridge',
    afterScene: 'harbor',
    lines: [
      { who: 'dot', name: 'Digger Dot', face: '⛏️', color: '#ecc94b', text: 'Hi! We are the Scoop Squad. We borrow shiny rocks. The ground does not mind.' },
      { who: 'dot', name: 'Digger Dot', face: '⛏️', color: '#ecc94b', text: 'There is a secret under the islands. Captain Scoop says it is treasure. I say it hums.' },
      { who: 'you', face: '🙂', color: '#68d391', text: 'If you are digging up the meadow, we should battle for it.' },
    ],
  },
  {
    id: 'cragmoor',
    place: 'cragmoor',
    afterScene: 'greenridge',
    lines: [
      { who: 'plaque', name: 'Cliff stone', face: '🪨', color: '#c08a30', text: 'Old letters in the rock: ONE LAND. ONE HEART. The islands used to be one piece.' },
      { who: 'rival', face: '😤', color: '#fc8181', text: 'I saw it too. Do not get mushy. There is still a gym to beat.' },
    ],
  },
  {
    id: 'stormreach',
    place: 'stormreach',
    afterGym: 'z2g1',
    lines: [
      { who: 'sid', name: 'Shovel Sid', face: '🪣', color: '#63b3ed', text: 'Move the cones! Captain says the heart is under the storm. I mostly like the cones.' },
      { who: 'you', face: '🙂', color: '#68d391', text: 'The cones are on the path. Battle me, then pick them up.' },
    ],
  },
  {
    id: 'ironspire',
    place: 'ironspire',
    afterRival: 'rival2',
    lines: [
      { who: 'plaque', name: 'Sealed door', face: '🚪', color: '#fc8181', text: 'A door in the peak will not open. Someone scratched MINE on it, then drew a smiley face.' },
      { who: 'rival', face: '😤', color: '#fc8181', text: 'The Scoop Squad cannot open it either. Good. I want to be the one who finds the end.' },
    ],
  },
  {
    id: 'mistveil',
    place: 'mistveil',
    afterGym: 'z4g1',
    lines: [
      { who: 'plaque', name: 'Ruin wall', face: '🌫️', color: '#9f7aea', text: 'The wall says the heart went to sleep so the islands could live apart. Waking it the wrong way would crack them.' },
      { who: 'dot', name: 'Digger Dot', face: '⛏️', color: '#ecc94b', text: 'Oh. So it is not a toy. I should tell the captain. He will still want to poke it.' },
    ],
  },
  {
    id: 'ashwake',
    place: 'ashwake',
    afterGym: 'z5g1',
    lines: [
      { who: 'scoop', name: 'Captain Scoop', face: '🏴', color: '#ed8936', text: 'I heard the ruin talk. A sleeping heart! If I tickle it awake, the islands might pay me in sparkles.' },
      { who: 'you', face: '🙂', color: '#68d391', text: 'That would crack the islands. Put the shovel down.' },
      { who: 'scoop', name: 'Captain Scoop', face: '🏴', color: '#ed8936', text: 'Make me. My crew is mischievous, not mean. We just dig very loudly.' },
    ],
  },
  {
    id: 'crownrest',
    place: 'crownrest',
    afterCrew: 'scoop',
    afterRival: 'rival6',
    lines: [
      { who: 'lumen', name: 'Champion Lumen', face: '👑', color: '#f6e05e', text: 'You stopped the shovels. Thank you. The heart stays asleep, and the islands stay whole.' },
      { who: 'lumen', name: 'Champion Lumen', face: '👑', color: '#f6e05e', text: 'Three wardens, then me. Win, and you are champion. Three pedestals behind me are still empty on purpose.' },
      { who: 'rival', face: '😤', color: '#fc8181', text: 'I will be watching. Do not lose.' },
    ],
  },
  {
    id: 'ending',
    place: 'map',
    afterChampion: true,
    lines: [
      { who: 'lumen', name: 'Champion Lumen', face: '👑', color: '#f6e05e', text: 'The chain has a new champion. The Scoop Squad is filling their holes back in. Mostly.' },
      { who: 'plaque', name: 'Three pedestals', face: '✨', color: '#f6e05e', text: 'Heart of the Chain. The Sleeper. Ashwake\'s Last Spark. Empty on purpose, until a kid invents them.' },
      { who: 'rival', face: '😤', color: '#fc8181', text: 'Rematch whenever you want. I am not done.' },
    ],
  },
]
