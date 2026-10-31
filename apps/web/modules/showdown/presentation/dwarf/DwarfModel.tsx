'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  BackSide,
  BoxGeometry,
  BufferGeometry,
  CapsuleGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  ExtrudeGeometry,
  Group,
  Shape,
  SphereGeometry,
  TorusGeometry,
} from 'three'

import { DwarfPose } from '../../domain/dwarf-animation'

// Grumli, built from three.js primitives. Units: the feet stand on y = 0 and the helm top is near y = 1.95.
// The Figma reference is the "Grumli" component on the Showdown page.

const COLORS = [
  'armor',
  'armor-shade',
  'trim',
  'trim-shade',
  'sash',
  'leather',
  'glow',
  'beard',
  'beard-shade',
  'rock',
] as const
export type DwarfColor = (typeof COLORS)[number] | 'ink'
export type DwarfPalette = Record<DwarfColor, string>

// The colors live in globals.css as --dwarf-* variables. The outline takes the page background.
export function readPalette(): DwarfPalette {
  const style = getComputedStyle(document.documentElement)
  const palette = { ink: style.getPropertyValue('--background').trim() } as DwarfPalette
  for (const color of COLORS) palette[color] = style.getPropertyValue(`--dwarf-${color}`).trim()
  return palette
}

const axeHead = () => {
  const shape = new Shape()
  shape.moveTo(0, 0.08)
  shape.lineTo(-0.26, 0.24)
  shape.quadraticCurveTo(-0.34, 0, -0.26, -0.24)
  shape.lineTo(0, -0.08)
  shape.lineTo(0.26, -0.24)
  shape.quadraticCurveTo(0.34, 0, 0.26, 0.24)
  shape.closePath()
  return new ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: false }).center()
}

// One shared geometry per shape. Each part scales it.
export const GEOMETRY = {
  sphere: new SphereGeometry(1, 24, 16),
  box: new BoxGeometry(1, 1, 1),
  cylinder: new CylinderGeometry(1, 1, 1, 24),
  capsule: new CapsuleGeometry(1, 1, 6, 12),
  ring: new TorusGeometry(1, 0.18, 8, 24),
  sash: new TorusGeometry(1, 0.13, 8, 32),
  rock: new DodecahedronGeometry(1),
  axeHead: axeHead(),
}

type Vec3 = [number, number, number]

interface PartProps {
  geometry: BufferGeometry
  color: string
  ink: string
  position?: Vec3
  rotation?: Vec3
  scale?: Vec3 | number
  outline?: boolean
  // A glowing part ignores the lights.
  glow?: boolean
}

// A toon-shaded mesh plus a slightly larger copy that shows only its back faces: the comic outline.
export const Part = ({ geometry, color, ink, position, rotation, scale, outline = true, glow = false }: PartProps) => (
  <group position={position} rotation={rotation} scale={scale}>
    <mesh geometry={geometry}>{glow ? <meshBasicMaterial color={color} /> : <meshToonMaterial color={color} />}</mesh>
    {outline && (
      <mesh geometry={geometry} scale={1.08}>
        <meshBasicMaterial color={ink} side={BackSide} />
      </mesh>
    )}
  </group>
)

const JOINTS = [
  'root',
  'body',
  'head',
  'beard',
  'leftArm',
  'rightArm',
  'leftForearm',
  'rightForearm',
  'leftLeg',
  'rightLeg',
  'axe',
] as const
type Joint = (typeof JOINTS)[number]

interface DwarfModelProps {
  palette: DwarfPalette
  // Read on every frame, so the pose changes without a React render.
  getPose: () => DwarfPose
  isRockInHand: () => boolean
  position: Vec3
  scale: number
}

export const DwarfModel = ({ palette: c, getPose, isRockInHand, position, scale }: DwarfModelProps) => {
  const joints = useRef<Partial<Record<Joint, Group>>>({})
  const heldRock = useRef<Group>(null)
  const bind = (joint: Joint) => (group: Group | null) => {
    if (group) joints.current[joint] = group
  }
  const ink = c.ink
  const p = (geometry: BufferGeometry, color: DwarfColor, props: Omit<PartProps, 'geometry' | 'color' | 'ink'>) => (
    <Part geometry={geometry} color={c[color]} ink={ink} {...props} />
  )

  useFrame(() => {
    const pose = getPose()
    for (const joint of JOINTS) joints.current[joint]?.rotation.set(0, 0, 0)
    for (const [key, value] of Object.entries(pose)) {
      const [joint, axis] = key.split('.') as [Joint, 'x' | 'y' | 'z' | undefined]
      const group = joints.current[joint]
      if (group && axis) group.rotation[axis] = value
    }
    const root = joints.current.root
    if (root) {
      root.position.y = pose.lift ?? 0
      root.rotation.y = pose.turn ?? 0
    }
    if (heldRock.current) heldRock.current.visible = isRockInHand()
  })

  const arm = (side: 'left' | 'right') => {
    const sign = side === 'left' ? -1 : 1
    return (
      <group ref={bind(`${side}Arm`)} position={[0.6 * sign, 0.45, 0]}>
        {p(GEOMETRY.capsule, 'armor-shade', { position: [0, -0.2, 0], scale: [0.12, 0.13, 0.12] })}
        <group ref={bind(`${side}Forearm`)} position={[0, -0.36, 0]}>
          {p(GEOMETRY.cylinder, 'armor', { position: [0, -0.06, 0], scale: [0.14, 0.2, 0.14] })}
          {p(GEOMETRY.sphere, 'armor', { position: [0, -0.24, 0], scale: 0.16 })}
          {p(GEOMETRY.box, 'trim', { position: [0, -0.24, 0.13], scale: [0.2, 0.07, 0.06], outline: false })}
          {side === 'right' && (
            <group ref={heldRock} visible={false}>
              {p(GEOMETRY.rock, 'rock', { position: [0, -0.4, 0.05], scale: 0.12 })}
            </group>
          )}
        </group>
      </group>
    )
  }

  const leg = (side: 'left' | 'right') => {
    const sign = side === 'left' ? -1 : 1
    return (
      <group ref={bind(`${side}Leg`)} position={[0.18 * sign, 0.5, 0]}>
        {p(GEOMETRY.box, 'armor-shade', { position: [0, -0.24, 0], scale: [0.26, 0.34, 0.28] })}
        {p(GEOMETRY.sphere, 'trim', { position: [0, -0.14, 0.14], scale: [0.11, 0.08, 0.06] })}
        {p(GEOMETRY.box, 'armor', { position: [0, -0.42, 0.06], scale: [0.36, 0.17, 0.46] })}
      </group>
    )
  }

  // The joint tree is static, so it renders once per palette.
  const tree = useMemo(
    () => (
      <group ref={bind('root')}>
        {leg('left')}
        {leg('right')}
        <group ref={bind('body')} position={[0, 0.55, 0]}>
          {p(GEOMETRY.sphere, 'armor', { position: [0, 0.45, 0], scale: [0.6, 0.52, 0.46] })}
          {p(GEOMETRY.box, 'trim', {
            position: [-0.3, 0.62, 0.38],
            scale: [0.1, 0.1, 0.04],
            rotation: [0, 0, Math.PI / 4],
          })}
          {p(GEOMETRY.box, 'trim', {
            position: [0.3, 0.62, 0.38],
            scale: [0.1, 0.1, 0.04],
            rotation: [0, 0, Math.PI / 4],
          })}
          {p(GEOMETRY.sash, 'sash', {
            position: [0, 0.14, 0],
            rotation: [Math.PI / 2, 0, 0],
            scale: [0.55, 0.47, 0.55],
          })}
          {p(GEOMETRY.box, 'trim', { position: [0, 0.14, 0.47], scale: [0.16, 0.2, 0.06] })}
          {p(GEOMETRY.box, 'armor-shade', {
            position: [-0.24, -0.04, 0.33],
            rotation: [0.2, 0, 0],
            scale: [0.38, 0.2, 0.08],
          })}
          {p(GEOMETRY.box, 'armor-shade', {
            position: [0.24, -0.04, 0.33],
            rotation: [0.2, 0, 0],
            scale: [0.38, 0.2, 0.08],
          })}
          {p(GEOMETRY.sphere, 'leather', { position: [0.42, 0.04, 0.3], scale: 0.14 })}
          {p(GEOMETRY.rock, 'rock', { position: [0.42, 0.18, 0.3], scale: 0.07 })}
          {/* The pauldrons sit on the body, so a raised arm does not move them. */}
          {[-1, 1].map((sign) => (
            <group key={sign} position={[0.6 * sign, 0.45, 0]}>
              {p(GEOMETRY.sphere, 'armor', { scale: [0.27, 0.2, 0.27] })}
              {p(GEOMETRY.ring, 'trim', { rotation: [0, Math.PI / 2, 0], scale: 0.19, outline: false })}
            </group>
          ))}
          <group ref={bind('axe')} position={[0.28, 0.5, -0.42]}>
            <group rotation={[0, 0, -0.45]}>
              {p(GEOMETRY.cylinder, 'leather', { scale: [0.045, 1.8, 0.045] })}
              {p(GEOMETRY.axeHead, 'trim', { position: [0, 0.82, 0] })}
            </group>
          </group>
          <group ref={bind('head')} position={[0, 0.5, 0]}>
            <group ref={bind('beard')} position={[0, 0.03, 0.42]}>
              {p(GEOMETRY.sphere, 'beard', { scale: [0.3, 0.2, 0.15] })}
              {[-1, 1].map((sign) => (
                <group key={sign} position={[0.11 * sign, -0.24, 0.05]}>
                  {p(GEOMETRY.capsule, 'beard', { scale: [0.065, 0.1, 0.065] })}
                  {p(GEOMETRY.cylinder, 'trim', { position: [0, -0.06, 0], scale: [0.075, 0.05, 0.075] })}
                </group>
              ))}
            </group>
            {p(GEOMETRY.cylinder, 'armor', { position: [0, 0.42, 0], scale: [0.43, 0.74, 0.43] })}
            {p(GEOMETRY.cylinder, 'armor-shade', { position: [0, 0.82, 0], scale: [0.47, 0.1, 0.47] })}
            {p(GEOMETRY.box, 'ink', { position: [0, 0.52, 0.4], scale: [0.62, 0.1, 0.1], outline: false })}
            {[-1, 1].map((sign) => (
              <group key={sign}>
                {p(GEOMETRY.sphere, 'glow', {
                  position: [0.18 * sign, 0.52, 0.44],
                  scale: [0.08, 0.04, 0.03],
                  outline: false,
                  glow: true,
                })}
                {[0.32, 0.25, 0.18].map((y) => (
                  <group key={y}>
                    {p(GEOMETRY.sphere, 'ink', {
                      position: [0.28 * sign, y, 0.35],
                      scale: 0.022,
                      outline: false,
                    })}
                  </group>
                ))}
              </group>
            ))}
            {p(GEOMETRY.box, 'trim', { position: [0, 0.45, 0.44], scale: [0.09, 0.62, 0.06] })}
          </group>
          {arm('left')}
          {arm('right')}
        </group>
      </group>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the tree only depends on the palette
    [c],
  )

  return (
    <group position={position} scale={scale}>
      {tree}
    </group>
  )
}
