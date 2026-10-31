'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

import { DWARF_CLIP_MS, THROW_TIMELINE } from '../../configuration/constraints'
import { STILL_POSES } from '../../domain/dwarf-animation'
import { Facing, ThrowAction } from '../../domain/models'
import { Phrase } from '../../domain/phrases'

import { SpeechBubble } from './SpeechBubble'

const DwarfCanvas = dynamic(() => import('./DwarfCanvas').then((module) => module.DwarfCanvas), { ssr: false })

type ScreenPose = 'greet' | 'idle' | 'celebrate'

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

// jsdom and some old browsers have no WebGL. Then the Showdown runs without Grumli.
function hasWebGL() {
  if (!('WebGLRenderingContext' in window)) return false
  try {
    const context =
      document.createElement('canvas').getContext('webgl2') ?? document.createElement('canvas').getContext('webgl')
    context?.getExtension('WEBGL_lose_context')?.loseContext()
    return !!context
  } catch {
    return false
  }
}

interface DwarfStageProps {
  // The pose of this screen. Greet and celebrate play once, then the idle loop.
  screen: ScreenPose
  // Size and position. The stage itself must be positioned (relative or absolute), unless `overlay` is set.
  className: string
  // The canvas covers the nearest positioned ancestor instead of the stage, so the rock can fly over the cards.
  // Grumli still stands at the bottom center, as tall as the stage.
  overlay?: boolean
  throwAction?: ThrowAction | null
  onReady?: () => void
}

export const DwarfStage = ({ screen, className, overlay = false, throwAction = null, onReady }: DwarfStageProps) => {
  const stage = useRef<HTMLDivElement>(null)
  const [isSupported, setIsSupported] = useState<boolean | null>(null)
  const [isReduced, setIsReduced] = useState(false)
  const [height, setHeight] = useState(0)
  const [pose, setPose] = useState<ScreenPose | 'throw'>(screen)
  const [bubble, setBubble] = useState<{ phrase: Phrase; facing: Facing; isFading: boolean } | null>(null)
  const bubbleTimers = useRef<number[]>([])

  useEffect(() => {
    setIsSupported(hasWebGL())
    setIsReduced(prefersReducedMotion())
  }, [])

  useEffect(() => {
    const element = stage.current
    if (!element || !isSupported) return
    setHeight(element.clientHeight)
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => setHeight(element.clientHeight))
    observer.observe(element)
    return () => observer.disconnect()
  }, [isSupported])

  // `data-pose` names the animation that plays now.
  useEffect(() => {
    setPose(screen)
    if (isReduced || screen === 'idle') return
    const timer = window.setTimeout(() => setPose('idle'), DWARF_CLIP_MS[screen])
    return () => window.clearTimeout(timer)
  }, [screen, isReduced])

  // A new throw has a new startedAt. The bracket clears the throw when it ends, which also ends the pose.
  useEffect(() => {
    if (!throwAction || isReduced) {
      setPose((current) => (current === 'throw' ? 'idle' : current))
      return
    }
    setPose('throw')
    const timer = window.setTimeout(() => setPose('idle'), DWARF_CLIP_MS.throw)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [throwAction?.startedAt, isReduced])

  // The bubble outlives its throw, so only a new throw, reduced motion, or unmount cancels its timers.
  useEffect(() => {
    const clearBubbleTimers = () => bubbleTimers.current.forEach((timer) => window.clearTimeout(timer))
    if (isReduced) {
      clearBubbleTimers()
      setBubble(null)
      return
    }
    if (!throwAction) return
    clearBubbleTimers()
    setBubble({ phrase: throwAction.phrase, facing: throwAction.facing, isFading: false })
    bubbleTimers.current = [
      window.setTimeout(
        () => setBubble((current) => current && { ...current, isFading: true }),
        THROW_TIMELINE.phraseOut,
      ),
      window.setTimeout(() => setBubble(null), THROW_TIMELINE.phraseEnd),
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [throwAction?.startedAt, isReduced])

  useEffect(() => {
    const timers = bubbleTimers
    return () => timers.current.forEach((timer) => window.clearTimeout(timer))
  }, [])

  if (isSupported === false) return null

  return (
    <div ref={stage} data-testid='showdown-character' data-pose={pose} aria-hidden='true' className={className}>
      {isSupported && height > 0 && (
        <div className={`pointer-events-none absolute inset-0 ${overlay ? 'z-40' : ''}`}>
          <DwarfCanvas
            dwarfHeight={height}
            intro={screen === 'idle' ? null : screen}
            action={isReduced ? null : throwAction}
            still={isReduced ? STILL_POSES[screen] : null}
            onReady={onReady}
          />
        </div>
      )}
      {bubble && (
        <div className='pointer-events-none relative z-50 h-full'>
          <SpeechBubble phrase={bubble.phrase} isFading={bubble.isFading} facing={bubble.facing} />
        </div>
      )}
    </div>
  )
}
