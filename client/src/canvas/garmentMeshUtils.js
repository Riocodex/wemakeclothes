import * as THREE from 'three'

/**
 * Flattens a GLTF scene so each mesh becomes its own part at the origin
 * (world matrix baked into geometry) for simple multi-mesh clothing.
 */
export function collectBakedWorldMeshParts (root) {
  if (!root) return []
  root.updateMatrixWorld(true)
  const parts = []
  root.traverse((child) => {
    if (!child.isMesh || !child.geometry) return
    const geom = child.geometry.clone()
    geom.applyMatrix4(child.matrixWorld)
    parts.push({ geometry: geom, key: child.uuid, name: child.name || '' })
  })
  return parts
}

export function getLargestPartIndex (parts) {
  if (parts.length === 0) return 0
  let best = 0
  let max = -Infinity
  const box = new THREE.Box3()
  const size = new THREE.Vector3()
  parts.forEach((p, i) => {
    if (!p.geometry) return
    if (p.geometry.boundingBox == null) p.geometry.computeBoundingBox()
    if (!p.geometry.boundingBox) return
    box.copy(p.geometry.boundingBox)
    box.getSize(size)
    const vol = size.x * size.y * size.z
    if (vol > max) {
      max = vol
      best = i
    }
  })
  return best
}
