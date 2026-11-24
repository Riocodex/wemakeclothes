/* eslint-disable react/prop-types */
import { useId } from 'react'

const STAGE = '#e7e9ee'

const SHAPES = {
  tee: {
    body: 'M78 58C90 44 106 50 112 64C116 76 132 76 136 64C142 50 158 44 170 58L204 80L190 98L172 86V214H76V86L58 98L44 80Z',
    collar: 'M112 64C116 80 132 80 136 64',
    logo: { x: 104, y: 108, w: 40, h: 40 },
    print: { x: 86, y: 90, w: 76, h: 100 },
  },
  long: {
    body: 'M86 56C96 44 110 50 116 62C120 74 132 74 136 62C142 50 156 44 166 56L196 74L206 156L184 166L168 88V214H84V88L68 166L46 156L56 74Z',
    collar: 'M116 62C120 78 132 78 136 62',
    logo: { x: 104, y: 104, w: 40, h: 40 },
    print: { x: 92, y: 88, w: 64, h: 100 },
  },
  vest: {
    body: 'M92 56C102 44 114 50 120 62C124 74 132 74 136 62C142 50 154 44 164 56L178 84L162 98V216H94V98L78 84Z',
    collar: 'M120 62C124 78 132 78 136 62',
    logo: { x: 108, y: 104, w: 36, h: 36 },
    print: { x: 100, y: 90, w: 52, h: 100 },
  },
  dress: {
    body: 'M90 54C100 42 112 48 118 60C122 72 134 72 138 60C144 48 156 42 166 54L190 76L176 92L160 78L152 94L188 236H68L104 94L96 78L80 92L66 76Z',
    collar: 'M118 60C122 76 134 76 138 60',
    logo: { x: 108, y: 100, w: 36, h: 36 },
    print: { x: 92, y: 86, w: 68, h: 120 },
  },
}

const shade = (hex, amount) => {
  const raw = String(hex || '').replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return '#c4a15a'
  const next = [0, 2, 4].map((index) => {
    const value = parseInt(raw.slice(index, index + 2), 16) + amount
    return Math.max(0, Math.min(255, value)).toString(16).padStart(2, '0')
  })
  return `#${next.join('')}`
}

const shapeFor = () => SHAPES.tee

const isPlaceholderArt = (src) => {
  if (!src || typeof src !== 'string') return true
  const path = src.split('?')[0].toLowerCase()
  return (
    path.endsWith('/me.jpg')
    || path.endsWith('/wimik.svg')
    || path === 'me.jpg'
    || path === './me.jpg'
    || path === 'wimik.svg'
    || path === './wimik.svg'
  )
}

const GarmentLook = ({ design, title = '', className = '' }) => {
  const rawId = useId().replace(/:/g, '')
  const shape = shapeFor()
  const color = design?.colors?.body || '#EFBD48'
  const deep = shade(color, -36)
  const mid = shade(color, -14)
  const lift = shade(color, 22)
  const logo = design?.isLogoTexture && !isPlaceholderArt(design?.textures?.logo) ? design.textures.logo : ''
  const full = design?.isFullTexture && !isPlaceholderArt(design?.textures?.full) ? design.textures.full : ''

  return (
    <svg
      viewBox="0 0 248 280"
      className={`garment-look ${className}`}
      role="img"
      aria-label={title ? `${title} preview` : 'Garment preview'}
    >
      <defs>
        <clipPath id={`${rawId}-body`}>
          <path d={shape.body} />
        </clipPath>
        <clipPath id={`${rawId}-logo`}>
          <rect x={shape.logo.x} y={shape.logo.y} width={shape.logo.w} height={shape.logo.h} rx="3" />
        </clipPath>
        <linearGradient id={`${rawId}-cloth`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor={lift} />
          <stop offset="48%" stopColor={color} />
          <stop offset="100%" stopColor={mid} />
        </linearGradient>
        <filter id={`${rawId}-ground`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
      </defs>

      <rect width="248" height="280" fill={STAGE} />
      <ellipse cx="124" cy="232" rx="46" ry="6" fill="rgba(12,17,23,0.14)" filter={`url(#${rawId}-ground)`} />

      <g clipPath={`url(#${rawId}-body)`}>
        <rect x="20" y="20" width="208" height="230" fill={`url(#${rawId}-cloth)`} />
        {full ? (
          <image
            href={full}
            x={shape.print.x}
            y={shape.print.y}
            width={shape.print.w}
            height={shape.print.h}
            preserveAspectRatio="xMidYMid slice"
          />
        ) : null}
      </g>

      <path d={shape.collar} fill="none" stroke={deep} strokeWidth="5" strokeLinecap="round" />
      <path d={shape.collar} fill="none" stroke={lift} strokeWidth="1.5" strokeLinecap="round" />

      {logo ? (
        <image
          href={logo}
          x={shape.logo.x}
          y={shape.logo.y}
          width={shape.logo.w}
          height={shape.logo.h}
          clipPath={`url(#${rawId}-logo)`}
          preserveAspectRatio="xMidYMid slice"
        />
      ) : null}
    </svg>
  )
}

const shirtBrightness = (hex) => {
  const raw = String(hex || '').replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return null
  const channels = [0, 2, 4].map((index) => parseInt(raw.slice(index, index + 2), 16))
  return {
    raw: `#${raw}`,
    brightness: (channels[0] * 299 + channels[1] * 587 + channels[2] * 114) / 1000,
  }
}

export const shirtInk = (hex) => {
  const tone = shirtBrightness(hex)
  if (!tone) return '#0c1117'
  return tone.brightness > 165 ? shade(tone.raw, -78) : tone.raw
}

export const shirtButton = (hex) => {
  const tone = shirtBrightness(hex)
  if (!tone) return { background: '#0c1117', color: '#ffffff' }
  return {
    background: tone.raw,
    color: tone.brightness > 160 ? '#0c1117' : '#ffffff',
  }
}

export const isRasterPreview = (src) => {
  if (!src || typeof src !== 'string') return false
  if (src.startsWith('data:image/svg')) return false
  return true
}

export default GarmentLook
