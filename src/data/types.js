// Type definitions, effectiveness chart, and visual theming

export const TYPES = ['fire', 'water', 'grass', 'electric', 'rock', 'ground', 'poison', 'normal']

// TYPE_CHART[attackingType][defendingType] = effectiveness multiplier
export const TYPE_CHART = {
  fire: {
    fire: 0.5, water: 0.5, grass: 2, electric: 1, rock: 0.5, ground: 1, poison: 1, normal: 1,
  },
  water: {
    fire: 2, water: 0.5, grass: 0.5, electric: 1, rock: 2, ground: 2, poison: 1, normal: 1,
  },
  grass: {
    fire: 0.5, water: 2, grass: 0.5, electric: 1, rock: 2, ground: 2, poison: 0.5, normal: 1,
  },
  electric: {
    fire: 1, water: 2, grass: 0.5, electric: 0.5, rock: 1, ground: 0, poison: 1, normal: 1,
  },
  rock: {
    fire: 2, water: 1, grass: 1, electric: 1, rock: 1, ground: 0.5, poison: 1, normal: 1,
  },
  ground: {
    fire: 2, water: 1, grass: 0.5, electric: 2, rock: 2, ground: 1, poison: 2, normal: 1,
  },
  poison: {
    fire: 1, water: 1, grass: 2, electric: 1, rock: 0.5, ground: 0.5, poison: 0.5, normal: 1,
  },
  normal: {
    fire: 1, water: 1, grass: 1, electric: 1, rock: 0.5, ground: 1, poison: 1, normal: 1,
  },
}

// Visual theming per type — bg, light, dark, accent, glow
export const TYPE_COLORS = {
  fire: {
    bg: '#9B2C2C',
    light: '#FC8181',
    dark: '#742A2A',
    accent: '#F56565',
    glow: '#FEB2B2',
  },
  water: {
    bg: '#2B6CB0',
    light: '#63B3ED',
    dark: '#2A4365',
    accent: '#4299E1',
    glow: '#BEE3F8',
  },
  grass: {
    bg: '#276749',
    light: '#68D391',
    dark: '#22543D',
    accent: '#48BB78',
    glow: '#C6F6D5',
  },
  electric: {
    bg: '#975A16',
    light: '#F6E05E',
    dark: '#744210',
    accent: '#ECC94B',
    glow: '#FEFCBF',
  },
  rock: {
    bg: '#7B6B4F',
    light: '#C4A87A',
    dark: '#5C4E37',
    accent: '#A8895A',
    glow: '#E8D5B5',
  },
  ground: {
    bg: '#8B6914',
    light: '#D4A54A',
    dark: '#6B4F0E',
    accent: '#C08A30',
    glow: '#F0D89A',
  },
  poison: {
    bg: '#6B46C1',
    light: '#B794F4',
    dark: '#553C9A',
    accent: '#9F7AEA',
    glow: '#E9D8FD',
  },
  normal: {
    bg: '#5A6072',
    light: '#A0AEC0',
    dark: '#4A5568',
    accent: '#718096',
    glow: '#CBD5E0',
  },
}

// Emoji shorthand for type display
export const TYPE_EMOJIS = {
  fire: '🔥',
  water: '💧',
  grass: '🌿',
  electric: '⚡',
  rock: '🪨',
  ground: '🏔️',
  poison: '☠️',
  normal: '⚪',
}
