import * as THREE from 'three'

const ORIGINAL_HEIGHT = 0.613
const ORIGINAL_CENTER = new THREE.Vector3(0, -0.0455, 0.01)

const TARGET_HEIGHT = {
  tshirt_long: 0.8,
  shirt: 0.7,
  vest: ORIGINAL_HEIGHT,
  blouse: 0.62,
  dress: 0.94,
}

const LOGO_POINT = {
  tshirt_long: [0, 0.04, 0.15],
  shirt: [0, 0.01, 0.15],
  vest: [0, 0.04, 0.16],
  blouse: [0, 0.06, 0.14],
  dress: [0, 0.07, 0.14],
}

const ramp = (from, to, value) => {
  const t = (value - from) / (to - from)
  const c = Math.min(1, Math.max(0, t))
  return c * c * (3 - 2 * c)
}

const sleeveWeight = (x, y) => {
  const ax = Math.abs(x)
  const lateral = ramp(0.142, 0.22, ax)
  const band = ramp(-0.11, -0.02, y) * (1 - ramp(0.2, 0.255, y))
  const cap = ramp(0.15, 0.23, ax) * ramp(0.06, 0.15, y) * (1 - ramp(0.22, 0.27, y))
  return Math.min(1, Math.max(lateral * band, cap))
}

const hangSleeve = (x, y, z) => {
  const weight = sleeveWeight(x, y)
  if (weight < 0.04) return [x, y, z]
  const along = ramp(0.15, 0.27, Math.abs(x))
  const amount = along * along * weight
  if (amount <= 0) return [x, y, z]
  const sign = x < 0 ? -1 : 1
  const cuffX = sign * (0.19 + along * 0.045)
  const cuffY = 0.07 - along * 0.46
  const destX = cuffX + (x - sign * 0.23) * 0.2
  const destY = cuffY + (y - 0.04) * 0.5
  return [
    x + (destX - x) * amount,
    y + (destY - y) * amount,
    z * (1 - amount * 0.06),
  ]
}

const tuckSleeve = (x, y, z) => {
  const weight = sleeveWeight(x, y)
  if (weight < 0.02) return [x, y, z]
  const sign = x < 0 ? -1 : 1
  const seamX = sign * 0.134
  return [
    x + (seamX - x) * weight,
    y + (0.045 - y) * weight * 0.42,
    z * (1 - weight * 0.5),
  ]
}

const puffSleeve = (x, y, z) => {
  const weight = sleeveWeight(x, y)
  if (weight < 0.04) return [x, y, z]
  const sign = x < 0 ? -1 : 1
  const pivotX = sign * 0.155
  const pivotY = 0.06
  const puff = 1 + weight * 0.42
  return [
    pivotX + (x - pivotX) * puff,
    pivotY + (y - pivotY) * (1 + weight * 0.22),
    z * (1 + weight * 0.18),
  ]
}

const cropHem = (x, y, z) => {
  if (y >= -0.02 || sleeveWeight(x, y) > 0.2) return [x, y, z]
  const t = ramp(-0.02, -0.35, y)
  return [x * (1 + t * 0.04), -0.02 - t * 0.13, z * (1 + t * 0.03)]
}

const lengthenBody = (x, y, z, drop, flare) => {
  const t = ramp(0.0, -0.34, y)
  return [x * (1 + t * flare), y - t * t * drop, z * (1 + t * flare * 0.65)]
}

const flareSkirt = (x, y, z) => {
  const t = ramp(0.04, -0.34, y)
  const flare = t * t
  return [
    x * (1 + flare * 1.45),
    y - flare * 0.7,
    z * (1 + flare * 0.85),
  ]
}

const deformGeometry = (geometry, mapVertex) => {
  const position = geometry.attributes.position
  for (let i = 0; i < position.count; i += 1) {
    const [x, y, z] = mapVertex(position.getX(i), position.getY(i), position.getZ(i))
    position.setXYZ(i, x, y, z)
  }
  position.needsUpdate = true
  return geometry
}

const makePlacket = () => {
  const geometry = new THREE.BoxGeometry(0.012, 0.22, 0.008)
  geometry.translate(0, -0.1, 0.15)
  return geometry
}

const makeButton = (y) => {
  const geometry = new THREE.SphereGeometry(0.008, 10, 8)
  geometry.translate(0, y, 0.156)
  return geometry
}

const combinedBox = (geometries) => {
  const box = new THREE.Box3()
  geometries.forEach((geometry) => {
    geometry.computeBoundingBox()
    box.union(geometry.boundingBox)
  })
  return box
}

const fitParts = (parts, catalogId, logoPoint) => {
  const box = combinedBox(parts.map((part) => part.geometry))
  const size = new THREE.Vector3()
  const center = new THREE.Vector3()
  box.getSize(size)
  box.getCenter(center)
  const target = TARGET_HEIGHT[catalogId] || ORIGINAL_HEIGHT
  const scale = Math.min(
    target / Math.max(size.y, 0.001),
    0.72 / Math.max(size.x, 0.001),
    0.42 / Math.max(size.z, 0.001)
  )
  const targetCenter = ORIGINAL_CENTER

  const apply = (x, y, z) => [
    (x - center.x) * scale + targetCenter.x,
    (y - center.y) * scale + targetCenter.y,
    (z - center.z) * scale + targetCenter.z,
  ]

  parts.forEach((part) => {
    const position = part.geometry.attributes.position
    for (let i = 0; i < position.count; i += 1) {
      const [x, y, z] = apply(position.getX(i), position.getY(i), position.getZ(i))
      position.setXYZ(i, x, y, z)
    }
    position.needsUpdate = true
    part.geometry.computeVertexNormals()
    part.geometry.computeBoundingBox()
    part.geometry.computeBoundingSphere()
  })

  const logo = apply(...logoPoint)
  const fitted = combinedBox(parts.map((part) => part.geometry))
  const fittedSize = new THREE.Vector3()
  fitted.getSize(fittedSize)
  logo[2] = Math.max(logo[2], fitted.max.z * 0.92)

  return {
    parts,
    logo: { position: logo, rotation: [0, 0, 0], scale: 0.15 },
    full: {
      position: [fitted.getCenter(new THREE.Vector3()).x, fitted.getCenter(new THREE.Vector3()).y, fitted.max.z],
      rotation: [0, 0, 0],
      scale: Math.max(fittedSize.x, fittedSize.y) * 1.05,
    },
  }
}

const cloneSource = (geometry) => geometry.clone()

export const buildStyledGarment = (source, catalogId) => {
  const parts = []

  if (catalogId === 'vest' || catalogId === 'dress') {
    const body = cloneSource(source)
    deformGeometry(body, (x, y, z) => {
      const weight = sleeveWeight(x, y)
      const tucked = tuckSleeve(x, y, z)
      if (catalogId === 'dress' && weight < 0.22) return flareSkirt(...tucked)
      return tucked
    })
    parts.push({ name: 'body', geometry: body, decal: true })
  } else {
    const body = cloneSource(source)
    if (catalogId === 'tshirt_long') deformGeometry(body, hangSleeve)
    if (catalogId === 'blouse') {
      deformGeometry(body, (x, y, z) => cropHem(...puffSleeve(x, y, z)))
    }
    if (catalogId === 'shirt') deformGeometry(body, (x, y, z) => lengthenBody(x, y, z, 0.12, 0.08))
    parts.push({ name: 'body', geometry: body, decal: true })
    if (catalogId === 'shirt') {
      parts.push(
        { name: 'placket', geometry: makePlacket() },
        ...[-0.02, -0.08, -0.14, -0.2].map((y, index) => ({
          name: `button-${index}`,
          geometry: makeButton(y),
          kind: 'button',
        }))
      )
    }
  }

  return fitParts(parts, catalogId, LOGO_POINT[catalogId] || [0, 0.04, 0.15])
}
