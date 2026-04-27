import React, { useEffect, useMemo, useRef } from 'react'
import { easing } from 'maath'
import { useSnapshot } from 'valtio'
import { useFrame } from '@react-three/fiber'
import { Decal, useGLTF, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import state from '../store'
import { GARMENT_CATALOG } from '../config/garments'
import { collectBakedWorldMeshParts, getLargestPartIndex } from './garmentMeshUtils'

const defaultLogoDecal = { position: [0, 0.04, 0.15], rotation: [0, 0, 0], scale: 0.15 }
const defaultFullDecal = { position: [0, 0, 0], rotation: [0, 0, 0], scale: 1 }

function getPartHex (design, partName) {
  if (!design?.colors) return '#EFBD48'
  const lower = (partName || '').toLowerCase()
  if (lower && design.colors[lower] != null) return design.colors[lower]
  if (lower.includes('sleeve') && design.colors.sleeves) return design.colors.sleeves
  return design.colors.body || '#EFBD48'
}

const Shirt = () => {
  const snap = useSnapshot(state)
  const catalogId = snap.design?.catalogId || 'tshirt_short'
  const garmentConfig = GARMENT_CATALOG[catalogId] || GARMENT_CATALOG.tshirt_short
  const gltf = useGLTF(garmentConfig.modelPath)
  const { nodes, scene } = gltf

  const shirtRef = useRef()
  const dragState = useRef({
    isDragging: false,
    lastX: 0,
    lastY: 0,
    targetX: 0,
    targetY: 0,
  })

  const logoUrl = snap.design?.textures?.logo || snap.logoDecal
  const fullUrl = snap.design?.textures?.full || snap.fullDecal
  const logoTexture = useTexture(logoUrl)
  const fullTexture = useTexture(fullUrl)

  const namedMesh = useMemo(() => {
    if (!garmentConfig.meshName || !nodes[garmentConfig.meshName]) return null
    const n = nodes[garmentConfig.meshName]
    return n?.isMesh && n.geometry ? n : null
  }, [nodes, garmentConfig.meshName])

  const multiMeshParts = useMemo(() => {
    if (namedMesh) return null
    return collectBakedWorldMeshParts(scene)
  }, [namedMesh, scene, catalogId, garmentConfig.modelPath])

  const partSignature = useMemo(
    () => (multiMeshParts || []).map((p) => p.key).join(','),
    [multiMeshParts]
  )

  const partMaterials = useMemo(() => {
    if (!multiMeshParts?.length) return null
    return multiMeshParts.map(() => {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color('#EFBD48'),
        roughness: 1,
        metalness: 0,
        side: THREE.DoubleSide,
      })
    })
  }, [partSignature, catalogId])

  useEffect(() => {
    return () => {
      partMaterials?.forEach((m) => m.dispose())
    }
  }, [partMaterials])

  const decalOnPartIndex = useMemo(() => {
    if (namedMesh || !multiMeshParts?.length) return 0
    return getLargestPartIndex(multiMeshParts)
  }, [namedMesh, multiMeshParts])

  const logoCfg = { ...defaultLogoDecal, ...garmentConfig.decal?.logo }
  const fullCfg = { ...defaultFullDecal, ...garmentConfig.decal?.full }

  const shirtMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: getPartHex(snap.design, 'body'),
        roughness: 1,
        metalness: 0,
        side: THREE.DoubleSide,
      }),
    []
  )

  useEffect(() => {
    return () => {
      shirtMaterial.dispose()
    }
  }, [shirtMaterial])

  useEffect(() => {
    return () => {
      if (multiMeshParts) {
        multiMeshParts.forEach((p) => p.geometry?.dispose())
      }
    }
  }, [multiMeshParts])

  useFrame((_, delta) => {
    const d = state.design
    if (namedMesh) {
      const target = new THREE.Color(getPartHex(d, 'body'))
      easing.dampC(shirtMaterial.color, target, 0.25, delta)
    } else if (partMaterials && multiMeshParts) {
      partMaterials.forEach((mat, i) => {
        const part = multiMeshParts[i]
        if (!part) return
        const target = new THREE.Color(getPartHex(d, part.name))
        easing.dampC(mat.color, target, 0.25, delta)
      })
    }
    if (shirtRef.current) {
      easing.dampE(
        shirtRef.current.rotation,
        [dragState.current.targetX, dragState.current.targetY, 0],
        0.2,
        delta
      )
    }
  })

  const handlePointerDown = (event) => {
    event.stopPropagation()
    dragState.current.isDragging = true
    dragState.current.lastX = event.clientX
    dragState.current.lastY = event.clientY
    event.target.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event) => {
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
  }

  const handlePointerUp = (event) => {
    dragState.current.isDragging = false
    if (event?.target?.releasePointerCapture) {
      event.target.releasePointerCapture(event.pointerId)
    }
  }

  const pointer = {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerOut: handlePointerUp,
  }

  const renderDecals = () => (
    <>
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
          depthTest={false}
          depthWrite
        />
      )}
    </>
  )

  // Visual fallback presets so each style looks different immediately,
  // even before dedicated GLB files are added.
  if (catalogId !== 'tshirt_short') {
    return (
      <group ref={shirtRef}>
        {(catalogId === 'dress') && (
          <group {...pointer}>
            <mesh material={shirtMaterial} position={[0, 0.2, 0]}>
              <cylinderGeometry args={[0.36, 0.34, 0.45, 48]} />
              {renderDecals()}
            </mesh>
            <mesh material={shirtMaterial} position={[0, -0.25, 0]}>
              <coneGeometry args={[0.58, 0.8, 48]} />
            </mesh>
          </group>
        )}

        {(catalogId === 'vest') && (
          <group {...pointer}>
            <mesh material={shirtMaterial} position={[0, 0.02, 0]}>
              <boxGeometry args={[0.75, 1.08, 0.28]} />
              {renderDecals()}
            </mesh>
          </group>
        )}

        {(catalogId === 'bikini') && (
          <group {...pointer}>
            <mesh material={shirtMaterial} position={[-0.14, 0.1, 0]}>
              <sphereGeometry args={[0.17, 24, 18]} />
            </mesh>
            <mesh material={shirtMaterial} position={[0.14, 0.1, 0]}>
              <sphereGeometry args={[0.17, 24, 18]} />
              {renderDecals()}
            </mesh>
            <mesh material={shirtMaterial} position={[0, -0.35, 0]}>
              <cylinderGeometry args={[0.36, 0.38, 0.22, 36]} />
            </mesh>
          </group>
        )}

        {(catalogId === 'blouse') && (
          <group {...pointer}>
            <mesh material={shirtMaterial} position={[0, 0.02, 0]}>
              <sphereGeometry args={[0.44, 36, 28]} />
              {renderDecals()}
            </mesh>
            <mesh material={shirtMaterial} position={[-0.5, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.1, 0.1, 0.38, 18]} />
            </mesh>
            <mesh material={shirtMaterial} position={[0.5, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.1, 0.1, 0.38, 18]} />
            </mesh>
          </group>
        )}

        {(catalogId === 'shirt' || catalogId === 'tshirt_long') && (
          <group {...pointer}>
            <mesh material={shirtMaterial} position={[0, 0.03, 0]}>
              <boxGeometry args={[0.78, 1.04, 0.3]} />
              {renderDecals()}
            </mesh>
            <mesh material={shirtMaterial} position={[-0.56, 0.03, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.1, 0.1, 0.42, 18]} />
            </mesh>
            <mesh material={shirtMaterial} position={[0.56, 0.03, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.1, 0.1, 0.42, 18]} />
            </mesh>
          </group>
        )}
      </group>
    )
  }

  if (namedMesh) {
    return (
      <group ref={shirtRef}>
        <mesh
          castShadow
          geometry={namedMesh.geometry}
          material={shirtMaterial}
          dispose={null}
          name="body"
          {...pointer}
        >
          {renderDecals()}
        </mesh>
      </group>
    )
  }

  if (!multiMeshParts?.length || !partMaterials) {
    return null
  }

  return (
    <group ref={shirtRef}>
      {multiMeshParts.map((part, i) => (
        <mesh
          key={part.key}
          castShadow
          geometry={part.geometry}
          material={partMaterials[i]}
          name={part.name}
          dispose={null}
          {...pointer}
        >
          {i === decalOnPartIndex && snap.isFullTexture && (
            <Decal
              position={fullCfg.position}
              rotation={fullCfg.rotation}
              scale={fullCfg.scale}
              map={fullTexture}
            />
          )}
          {i === decalOnPartIndex && snap.isLogoTexture && (
            <Decal
              position={logoCfg.position}
              rotation={logoCfg.rotation}
              scale={logoCfg.scale}
              map={logoTexture}
              depthTest={false}
              depthWrite
            />
          )}
        </mesh>
      ))}
    </group>
  )
}

const uniqueModelPaths = [...new Set(Object.values(GARMENT_CATALOG).map((c) => c.modelPath))]
uniqueModelPaths.forEach((path) => {
  useGLTF.preload(path)
})

export default Shirt
