import { describe, expect, it } from 'vitest'

import { THROW_PHRASES, THROW_TIMELINE } from '../configuration/constraints'
import { BASE_POSE, mirrorPose, samplePose } from '../domain/dwarf-animation'
import { nextPhraseIndex, phraseFor } from '../domain/phrases'
import { flightProgress, rockPosition } from '../domain/rock-flight'

describe('samplePose', () => {
  it('starts and ends the throw in the base pose', () => {
    expect(samplePose('throw', 0)).toMatchObject({ ...BASE_POSE, turn: 0 })
    expect(samplePose('throw', THROW_TIMELINE.done + 100)).toEqual(BASE_POSE)
  })

  it('pulls the throwing arm back at the release and turns to the card on the right', () => {
    const windUp = samplePose('throw', THROW_TIMELINE.release)
    expect(windUp['rightArm.x']).toBeGreaterThan(0)
    expect(windUp.turn).toBeGreaterThan(0)
  })

  it('throws with the left arm and turns left for a card on the left', () => {
    const windUp = samplePose('throw', THROW_TIMELINE.release, -1)
    expect(windUp['leftArm.x']).toBeGreaterThan(0)
    expect(windUp.turn).toBeLessThan(0)
  })

  it('blends between keys', () => {
    const before = samplePose('throw', 0)['rightArm.z']
    const middle = samplePose('throw', THROW_TIMELINE.release / 2)['rightArm.z']
    const after = samplePose('throw', THROW_TIMELINE.release)['rightArm.z']
    expect(middle).toBeGreaterThan(before)
    expect(middle).toBeLessThan(after)
  })

  it('raises the arm in the greet and both arms in the celebrate', () => {
    expect(samplePose('greet', 250)['rightArm.z']).toBeGreaterThan(2)
    const cheer = samplePose('celebrate', 200)
    expect(cheer['rightArm.z']).toBeGreaterThan(2)
    expect(cheer['leftArm.z']).toBeLessThan(-2)
  })

  it('keeps the idle loop close to the base pose', () => {
    expect(Math.abs(samplePose('idle', 400).lift)).toBeLessThan(0.05)
  })
})

describe('mirrorPose', () => {
  it('swaps the sides and flips the side-to-side rotations', () => {
    expect(mirrorPose({ 'rightArm.z': 1, 'rightArm.x': 0.5, turn: 0.4, lift: 0.2 })).toEqual({
      'leftArm.z': -1,
      'leftArm.x': 0.5,
      turn: -0.4,
      lift: 0.2,
    })
  })
})

describe('rock flight', () => {
  const hand = { x: 0, y: -200 }
  const target = { x: 300, y: 100 }

  it('leaves the hand at the release and reaches the target at the hit', () => {
    expect(flightProgress(THROW_TIMELINE.release)).toBe(0)
    expect(flightProgress(THROW_TIMELINE.crack)).toBe(1)
    expect(rockPosition(hand, target, flightProgress(THROW_TIMELINE.release))).toEqual(hand)
    expect(rockPosition(hand, target, flightProgress(THROW_TIMELINE.crack))).toEqual(target)
  })

  it('stays above the straight line between the hand and the target', () => {
    for (const t of [0.25, 0.5, 0.75]) {
      const rock = rockPosition(hand, target, t)
      const lineY = hand.y + ((rock.x - hand.x) / (target.x - hand.x)) * (target.y - hand.y)
      expect(rock.y).toBeGreaterThan(lineY)
    }
  })
})

describe('throw phrases', () => {
  it('splits a template around the kept title', () => {
    const index = THROW_PHRASES.indexOf('By my beard, {title} it is!')
    expect(phraseFor('Rustbelt', index)).toEqual({ before: 'By my beard, ', title: 'Rustbelt', after: ' it is!' })
    expect(phraseFor('Rustbelt', 0)).toEqual({ before: '', title: 'Rustbelt', after: ' will be!' })
  })

  it('gives every template exactly one title slot', () => {
    for (const template of THROW_PHRASES) expect(template.split('{title}')).toHaveLength(2)
  })

  it('never picks the same phrase twice in a row', () => {
    for (const roll of [0, 0.3, 0.99]) {
      for (let last = 0; last < THROW_PHRASES.length; last++) {
        const next = nextPhraseIndex(last, () => roll)
        expect(next).not.toBe(last)
        expect(next).toBeGreaterThanOrEqual(0)
        expect(next).toBeLessThan(THROW_PHRASES.length)
      }
    }
  })
})
