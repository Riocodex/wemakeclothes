import React, { useEffect, useMemo, useRef } from 'react'
import { easing } from 'maath'
import { useSnapshot } from 'valtio'
import { useFrame } from '@react-three/fiber'
import { Decal, useGLTF, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import state from '../store'


const Shirt = () => {
    const snap = useSnapshot(state)
    const{nodes}= useGLTF('/shirt_baked.glb')
    const shirtRef = useRef()
    const dragState = useRef({
        isDragging: false,
        lastX: 0,
        lastY: 0,
        targetX: 0,
        targetY: 0,
    })

    const logoTexture = useTexture(snap.logoDecal)
    const fullTexture = useTexture(snap.fullDecal)
    const shirtMaterial = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: snap.color,
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

    //to add smooth colors
    useFrame((_, delta)=>{
        easing.dampC(shirtMaterial.color,snap.color,0.25,delta)
        easing.dampE(
            shirtRef.current.rotation,
            [dragState.current.targetX, dragState.current.targetY, 0],
            0.2,
            delta
        )
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

        // Horizontal drag gives full 360 product-style spin.
        dragState.current.targetY += deltaX * 0.01
        // Vertical drag tilts slightly but stays natural.
        dragState.current.targetX = Math.max(
            -0.5,
            Math.min(0.5, dragState.current.targetX + deltaY * 0.005)
        )

        dragState.current.lastX = event.clientX
        dragState.current.lastY = event.clientY
    }

    const handlePointerUp = (event) => {
        dragState.current.isDragging = false
        event.target.releasePointerCapture(event.pointerId)
    }

  return (
    <group ref={shirtRef}> 
        <mesh
            castShadow
            geometry={nodes.T_Shirt_male.geometry}
            material={shirtMaterial}
            material-roughness={1}
            dispose={null}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerOut={handlePointerUp}
        >
            {/* checking if we have the texture and logo */}
            {snap.isFullTexture && (
                <Decal
                    position={[0,0,0]}
                    rotation={[0,0,0]}
                    scale={1}
                    map={fullTexture}
                />
            )}
             {snap.isLogoTexture && (
                <Decal
                    position={[0,0.04,0.15]}//best default position settings imo
                    rotation={[0,0,0]}
                    scale={0.15}
                    map={logoTexture}
                    // map-anisotropy={16}
                    depthTest={false}
                    depthWrite={true}
                />
            )}
            
        </mesh>
    </group>
  )
}

export default Shirt