// Reusable creature sprite component for React UI screens
// Shows the idle sprite image, or a colored-circle fallback for custom creatures without art
import { useState } from 'react'
import { getIdleSprite } from '../data/creatureAssets.js'
import { TYPE_COLORS } from '../data/types.js'

export default function CreatureSprite({
  creatureId,
  creatureType,
  creatureName,
  size = 100,
  locked = false,
  className = '',
  style = {},
  flip = false,
}) {
  const [imgError, setImgError] = useState(false)
  const spriteUrl = getIdleSprite(creatureId)
  const showFallback = !spriteUrl || imgError

  if (showFallback && !locked) {
    if (spriteUrl === null && creatureId) {
      console.warn(`Missing sprite for ${creatureId}, using fallback`)
    }
  }

  const colors = TYPE_COLORS[creatureType] || { accent: '#718096', dark: '#4a5568', light: '#a0aec0' }

  // Locked silhouette
  if (locked) {
    if (spriteUrl && !imgError) {
      return (
        <img
          src={spriteUrl}
          alt="???"
          className={className}
          style={{
            width: size, height: size, objectFit: 'contain',
            filter: 'brightness(0) opacity(0.3)',
            ...style,
          }}
          onError={() => setImgError(true)}
        />
      )
    }
    // Locked fallback circle
    return (
      <div
        className={className}
        style={{
          width: size, height: size, borderRadius: '50%',
          background: '#1e293b', border: '2px solid #334155',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.4, color: '#334155', fontWeight: 'bold',
          fontFamily: 'Rajdhani, sans-serif', ...style,
        }}
      >
        ?
      </div>
    )
  }

  // Real sprite
  if (!showFallback) {
    return (
      <img
        src={spriteUrl}
        alt={creatureName || creatureId}
        className={className}
        style={{
          width: size, height: size, objectFit: 'contain',
          transform: flip ? 'scaleX(-1)' : undefined,
          ...style,
        }}
        onError={() => setImgError(true)}
      />
    )
  }

  // Fallback: colored circle with first letter
  const letter = (creatureName || creatureId || '?').charAt(0).toUpperCase()
  return (
    <div
      className={className}
      style={{
        width: size, height: size, borderRadius: '50%',
        background: `radial-gradient(circle at 40% 40%, ${colors.accent}, ${colors.dark})`,
        border: `2px solid ${colors.accent}50`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.4, color: '#fff', fontWeight: 'bold',
        fontFamily: 'Rajdhani, sans-serif',
        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
        ...style,
      }}
    >
      {letter}
    </div>
  )
}
