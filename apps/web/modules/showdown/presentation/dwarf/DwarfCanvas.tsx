'use client'

import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Group } from 'three'

import { DWARF_CLIP_MS, THROW_TIMELINE } from '../../configuration/constraints'
import { DwarfPose, samplePose } from '../../domain/dwarf-animation'
import { ThrowAction } from '../../domain/models'
import { flightProgress, rockPosition } from '../../domain/rock-flight'

import { DwarfModel, DwarfPalette, GEOMETRY, Part, readPalette } from './DwarfModel'

// The model is about 2 units tall, axe included. The rest is headroom for the jump in the celebrate.
const MODEL_HEIGHT = 2.5
// Grumli takes the rock from the pouch this long after the pick.
const GRAB_ROCK_MS = 100

interface SceneProps {
  dwarfHeight: number
  intro: 'greet' | 'celebrate' | null
  action: ThrowAction | null
  still: DwarfPose | null
  palette: DwarfPalette
}

const Scene = ({ dwarfHeight, intro, action, still, palette }: SceneProps) => {
  const { size, gl, invalidate } = useThree()
  const mountedAt = useRef(performance.now())
  const actionRef = useRef(action)
  actionRef.current = action
  const rock = useRef<Group>(null)

  const scale = dwarfHeight / MODEL_HEIGHT
  // Grumli stands at the bottom center of the canvas. The orthographic camera maps 1 unit to 1 CSS px.
  const floor = -size.height / 2 + dwarfHeight * 0.03

  useEffect(() => invalidate(), [still, invalidate])

  const sinceThrow = () => {
    const current = actionRef.current
    return current ? performance.now() - current.startedAt : Infinity
  }

  const getPose = () => {
    if (still) return still
    const current = actionRef.current
    const elapsed = sinceThrow()
    if (current && elapsed < DWARF_CLIP_MS.throw) return samplePose('throw', elapsed, current.facing)
    const sinceMount = performance.now() - mountedAt.current
    if (intro && sinceMount < DWARF_CLIP_MS[intro]) return samplePose(intro, sinceMount)
    return samplePose('idle', sinceMount)
  }

  const isRockInHand = () => {
    const elapsed = sinceThrow()
    return elapsed >= GRAB_ROCK_MS && elapsed < THROW_TIMELINE.release
  }

  useFrame(() => {
    const current = actionRef.current
    const elapsed = sinceThrow()
    const group = rock.current
    if (!group) return
    group.visible = !!current && elapsed >= THROW_TIMELINE.release && elapsed < THROW_TIMELINE.crack
    if (!current || !group.visible) return
    // The target is in page px. The scene's origin is the canvas center, with y up.
    const rect = gl.domElement.getBoundingClientRect()
    const target = {
      x: current.target.x - rect.left - rect.width / 2,
      y: rect.height / 2 - (current.target.y - rect.top),
    }
    const hand = { x: current.facing * 0.75 * scale, y: floor + 2 * scale }
    const t = flightProgress(elapsed)
    const point = rockPosition(hand, target, t)
    group.position.set(point.x, point.y, 300)
    group.rotation.set(t * 9, t * 6, 0)
  })

  return (
    <>
      <ambientLight intensity={1.1} />
      <directionalLight position={[-300, 400, 600]} intensity={2.4} />
      {/* The rim light from behind keeps the dark armor readable on the dark page. */}
      <directionalLight position={[200, 300, -600]} intensity={3} />
      <group rotation={[0.12, 0, 0]}>
        <DwarfModel
          palette={palette}
          getPose={getPose}
          isRockInHand={isRockInHand}
          position={[0, floor, 0]}
          scale={scale}
        />
      </group>
      <group ref={rock} visible={false} scale={0.13 * scale}>
        <Part geometry={GEOMETRY.rock} color={palette.rock} ink={palette.ink} />
      </group>
    </>
  )
}

interface DwarfCanvasProps extends Omit<SceneProps, 'palette'> {
  onReady?: () => void
}

// Loaded with next/dynamic on /showdown only, so three.js stays out of every other page.
export const DwarfCanvas = ({ onReady, still, ...props }: DwarfCanvasProps) => {
  const palette = useMemo(readPalette, [])
  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 1000], zoom: 1, near: 1, far: 4000 }}
      dpr={[1, 2]}
      frameloop={still ? 'demand' : 'always'}
      gl={{ alpha: true, antialias: true }}
      // The canvas lies over the match cards. Its own container sets pointer-events: auto, so turn it off here,
      // or every click lands on the canvas instead of a card.
      style={{ pointerEvents: 'none' }}
      onCreated={() => onReady?.()}
    >
      <Scene {...props} still={still} palette={palette} />
    </Canvas>
  )
}
