import React, { useEffect, useMemo, useRef } from 'react'
import { easing } from 'maath'
import { useSnapshot } from 'valtio'
import { useFrame } from '@react-three/fiber'
import { Decal, useGLTF, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import state from '../store'
import { GARMENT_CATALOG } from '../config/garments'

const defaultLogoDecal = { position: [0, 0.04, 0.15], rotation: [0, 0, 0], scale: 0.15 }
const defaultFullDecal = { position: [0, 0, 0], rotation: [0, 0, 0], scale: 1 }

const getBodyColor = (snap) =>
  snap.design?.colors?.body || snap.color || '#EFBD48'

const createShirtMaterial = (color) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness: 1,
    metalness: 0,
    side: THREE.DoubleSide,
  })

const ClassicShirt = ({ snap, garmentConfig, nodes }) => {
  const shirtRef = useRef()
  const shirtMaterial = useMemo(() => createShirtMaterial(getBodyColor(snap)), [])

  useEffect(() => () => shirtMaterial.dispose(), [shirtMaterial])

  const dragState = useRef({
    isDragging: false,
    lastX: 0,
    lastY: 0,
    targetX: 0,
    targetY: 0,
  })

  const logoTexture = useTexture(snap.design?.textures?.logo || snap.logoDecal)
  const fullTexture = useTexture(snap.design?.textures?.full || snap.fullDecal)
  const logoCfg = { ...defaultLogoDecal, ...garmentConfig.decal?.logo }
  const fullCfg = { ...defaultFullDecal, ...garmentConfig.decal?.full }

  const stateKey = JSON.stringify({
    catalogId: snap.design?.catalogId,
    logo: snap.logoDecal,
    full: snap.fullDecal,
    logoOn: snap.isLogoTexture,
    fullOn: snap.isFullTexture,
  })

  useFrame((_, delta) => {
    easing.dampC(shirtMaterial.color, getBodyColor(snap), 0.25, delta)
    if (shirtRef.current) {
      easing.dampE(
        shirtRef.current.rotation,
        [dragState.current.targetX, dragState.current.targetY, 0],
        0.2,
        delta
      )
    }
  })

  const pointer = {
    onPointerDown: (event) => {
      event.stopPropagation()
      dragState.current.isDragging = true
      dragState.current.lastX = event.clientX
      dragState.current.lastY = event.clientY
      event.target.setPointerCapture(event.pointerId)
    },
    onPointerMove: (event) => {
      if (!dragState.current.isDragging) return
      event.stopPropagation()
      const deltaX = event.clientX - dragState.current.lastX
      const deltaY = event.clientY - dragState.current.lastY
      dragState.current.targetY += deltaX * 0.01
      dragState.current.targetX = Math.max(
        -0.5,
        Math.min(0.5, dragState.current.targetX + deltaY * 0.005)
      )
      dragState.current.lastX = event.clientX
      dragState.current.lastY = event.clientY
    },
    onPointerUp: (event) => {
      dragState.current.isDragging = false
      if (event?.target?.releasePointerCapture) {
        event.target.releasePointerCapture(event.pointerId)
      }
    },
    onPointerOut: (event) => {
      dragState.current.isDragging = false
      if (event?.target?.releasePointerCapture) {
        event.target.releasePointerCapture(event.pointerId)
      }
    },
  }

  return (
    <group ref={shirtRef} key={stateKey}>
      <mesh
        castShadow
        geometry={nodes.T_Shirt_male.geometry}
        material={shirtMaterial}
        dispose={null}
        {...pointer}
      >
        {snap.isFullTexture && (
          <Decal
            position={fullCfg.position}
            rotation={fullCfg.rotation}
            scale={fullCfg.scale}
            map={fullTexture}
          />
        )}
        {snap.isLogoTexture && (
          <Decal
            position={logoCfg.position}
            rotation={logoCfg.rotation}
            scale={logoCfg.scale}
            map={logoTexture}
          />
        )}
      </mesh>
    </group>
  )
}

const Shirt = () => {
  const snap = useSnapshot(state)
  const catalogId = snap.design?.catalogId || 'tshirt_short'
  const garmentConfig = GARMENT_CATALOG[catalogId] || GARMENT_CATALOG.tshirt_short
  const { nodes, materials } = useGLTF(garmentConfig.modelPath)

  const useClassic =
    nodes?.T_Shirt_male?.geometry && materials?.lambert1

  const fallbackMaterial = useMemo(
    () => createShirtMaterial(getBodyColor(snap)),
    [snap.design?.colors?.body, snap.color]
  )

  useEffect(() => () => fallbackMaterial.dispose(), [fallbackMaterial])

  if (useClassic) {
    return (
      <ClassicShirt
        snap={snap}
        garmentConfig={garmentConfig}
        nodes={nodes}
      />
    )
  }

  const shirtRef = useRef()
  const firstMesh = useMemo(() => {
    const n = garmentConfig.meshName && nodes[garmentConfig.meshName]
    if (n?.geometry) return n.geometry
    const found = Object.values(nodes).find((node) => node?.isMesh && node.geometry)
    return found?.geometry
  }, [nodes, garmentConfig.meshName])

  if (!firstMesh) return null

  return (
    <group ref={shirtRef}>
      <mesh castShadow geometry={firstMesh} material={fallbackMaterial} dispose={null} />
    </group>
  )
}

const uniqueModelPaths = [
  ...new Set(Object.values(GARMENT_CATALOG).map((c) => c.modelPath)),
]
uniqueModelPaths.forEach((path) => {
  useGLTF.preload(path)
})

export default Shirt
