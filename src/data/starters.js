// The seven creatures a new player can choose from. One of each type, all level 5.
// A new game picks three. The rest are caught later.

export const STARTER_LEVEL = 5
export const STARTER_PICK = 3

export const STARTER_CHOICES = [
  { id: 'emberpaw', type: 'fire' },
  { id: 'aquafin', type: 'water' },
  { id: 'leafyn', type: 'grass' },
  { id: 'voltzap', type: 'electric' },
  { id: 'pebblit', type: 'rock' },
  { id: 'dustail', type: 'ground' },
  { id: 'venomaw', type: 'poison' },
]

export const STARTER_IDS = STARTER_CHOICES.map(choice => choice.id)

export function validStarterPick(ids) {
  if (!Array.isArray(ids) || ids.length !== STARTER_PICK) return false
  const unique = new Set(ids)
  if (unique.size !== STARTER_PICK) return false
  return ids.every(id => STARTER_IDS.includes(id))
}
