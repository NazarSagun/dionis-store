import { DWARF_CLIP_MS, THROW_TIMELINE } from '../configuration/constraints'

import { Facing } from './models'

// Grumli's poses. A pose maps "joint.axis" to a rotation in radians, plus `lift` (the jump height in model
// units) and `turn` (the body turn toward a card). The model faces the camera, so +z points at the viewer.
// "right" is the arm on the viewer's right. Raising an arm to the side rotates it on z, away from the body.
export type DwarfPose = Record<string, number>

export type DwarfClip = 'idle' | 'greet' | 'throw' | 'celebrate'

interface Key {
  at: number
  pose: DwarfPose
}

export const BASE_POSE: DwarfPose = { 'leftArm.z': -0.2, 'rightArm.z': 0.2 }

const pose = (changes: DwarfPose): DwarfPose => ({ ...BASE_POSE, ...changes })

const WAVE_UP = pose({ 'rightArm.z': 2.7, 'rightForearm.z': 0.35 })
const WAVE_DOWN = pose({ 'rightArm.z': 2.7, 'rightForearm.z': -0.5 })

const ARMS_UP = pose({ 'leftArm.z': -2.7, 'rightArm.z': 2.7, 'leftForearm.z': -0.3, 'rightForearm.z': 0.3 })

const FIST_UP = pose({ turn: 0.3, 'rightArm.z': 2.9, 'rightForearm.z': -0.9, lift: 0.06 })

// The throw at a card on the right. A throw to the left mirrors it.
const THROW_KEYS: Key[] = [
  { at: 0, pose: BASE_POSE },
  {
    at: THROW_TIMELINE.release,
    pose: pose({
      turn: 0.5,
      'body.y': -0.3,
      'rightArm.z': 2.4,
      'rightArm.x': 0.9,
      'rightForearm.x': -0.9,
      'leftArm.z': -0.6,
    }),
  },
  {
    at: THROW_TIMELINE.crack,
    pose: pose({ turn: 0.5, 'body.y': 0.35, 'rightArm.z': 1.4, 'rightArm.x': -1.3, 'leftArm.z': -0.35 }),
  },
  { at: THROW_TIMELINE.shatter, pose: FIST_UP },
  { at: 900, pose: { ...FIST_UP, 'rightArm.z': 2.5, lift: 0 } },
  { at: THROW_TIMELINE.next, pose: FIST_UP },
  { at: THROW_TIMELINE.done, pose: BASE_POSE },
]

const CLIPS: Record<Exclude<DwarfClip, 'idle'>, Key[]> = {
  greet: [
    { at: 0, pose: BASE_POSE },
    { at: 250, pose: WAVE_UP },
    { at: 450, pose: WAVE_DOWN },
    { at: 650, pose: WAVE_UP },
    { at: 850, pose: WAVE_DOWN },
    { at: 1050, pose: WAVE_UP },
    { at: 1250, pose: WAVE_UP },
    { at: DWARF_CLIP_MS.greet, pose: BASE_POSE },
  ],
  throw: THROW_KEYS,
  celebrate: [
    { at: 0, pose: BASE_POSE },
    { at: 200, pose: ARMS_UP },
    { at: 450, pose: { ...ARMS_UP, lift: 0.35 } },
    { at: 700, pose: ARMS_UP },
    { at: 950, pose: { ...ARMS_UP, lift: 0.35 } },
    { at: 1200, pose: ARMS_UP },
    { at: DWARF_CLIP_MS.celebrate, pose: BASE_POSE },
  ],
}

// The still frame for each screen when the user asks for reduced motion.
export const STILL_POSES: Record<'idle' | 'greet' | 'celebrate', DwarfPose> = {
  idle: BASE_POSE,
  greet: WAVE_UP,
  celebrate: ARMS_UP,
}

const smoothstep = (t: number) => t * t * (3 - 2 * t)

function blend(from: DwarfPose, to: DwarfPose, t: number): DwarfPose {
  const result: DwarfPose = {}
  for (const key of new Set([...Object.keys(from), ...Object.keys(to)])) {
    const a = from[key] ?? 0
    const b = to[key] ?? 0
    result[key] = a + (b - a) * t
  }
  return result
}

// Swaps the left and right joints and flips the side-to-side rotations, for a throw to the left.
export function mirrorPose(source: DwarfPose): DwarfPose {
  const result: DwarfPose = {}
  for (const [key, value] of Object.entries(source)) {
    const swapped = key.startsWith('left') ? key.replace('left', 'right') : key.replace('right', 'left')
    const flips = key === 'turn' || key.endsWith('.y') || key.endsWith('.z')
    result[swapped] = flips ? -value : value
  }
  return result
}

// The breathing loop: the body bobs and the beard sways.
function idlePose(ms: number): DwarfPose {
  const phase = (ms / 1600) * 2 * Math.PI
  return pose({ lift: Math.sin(phase) * 0.015, 'beard.x': Math.sin(phase) * 0.08, 'beard.z': Math.cos(phase) * 0.05 })
}

// The pose of a clip `ms` after it started. A one-shot clip holds its last key after it ends.
export function samplePose(clip: DwarfClip, ms: number, facing: Facing = 1): DwarfPose {
  if (clip === 'idle') return idlePose(ms)
  const keys = CLIPS[clip]
  const next = keys.findIndex((key) => key.at > ms)
  let result: DwarfPose
  if (next === -1) result = keys[keys.length - 1].pose
  else if (next === 0) result = keys[0].pose
  else {
    const from = keys[next - 1]
    const to = keys[next]
    result = blend(from.pose, to.pose, smoothstep((ms - from.at) / (to.at - from.at)))
  }
  return facing === -1 ? mirrorPose(result) : result
}
