import { THROW_TIMELINE } from '../configuration/constraints'

// A point in the character canvas, in px from its center, with y pointing up.
export interface ScenePoint {
  x: number
  y: number
}

// How far the rock is along its flight, from 0 at the release to 1 at the hit.
export const flightProgress = (ms: number) =>
  Math.min(1, Math.max(0, (ms - THROW_TIMELINE.release) / (THROW_TIMELINE.crack - THROW_TIMELINE.release)))

// The rock flies on a curve that peaks above the line from the hand to the target.
export function rockPosition(from: ScenePoint, to: ScenePoint, t: number): ScenePoint {
  const lift = Math.max(80, Math.abs(to.x - from.x) * 0.5)
  const control = { x: (from.x + to.x) / 2, y: Math.max(from.y, to.y) + lift }
  const u = 1 - t
  return {
    x: u * u * from.x + 2 * u * t * control.x + t * t * to.x,
    y: u * u * from.y + 2 * u * t * control.y + t * t * to.y,
  }
}
