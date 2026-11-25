// Which creature a battle should be showing. The picture and the name panel
// both follow this, and only a switch event moves it.

export function artId(creature) {
  return creature?.spriteId || creature?.id || null
}

export function shownArtId(sprite) {
  return sprite?.getData?.('artId') || null
}

export function tagArt(sprite, creature) {
  const id = artId(creature)
  if (sprite?.setData) sprite.setData('artId', id)
  return sprite
}

/** A switch event is the only thing that changes who is on screen. */
export function indexAfterSwitch(event, side, current) {
  if (!event || (event.type !== 'switch' && event.type !== 'forceSwitch')) return current
  const data = event.data || {}
  if (data.creature !== side) return current
  if (data.needsSelection) return current
  if (data.newIndex == null) return current
  return data.newIndex
}
