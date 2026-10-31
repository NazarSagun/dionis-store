import { Point } from './models'

export interface Shard {
  // A CSS clip-path that cuts this shard out of a copy of the card.
  clipPath: string
  // Where the shard flies, in px, and how far it spins, in degrees.
  dx: number
  dy: number
  rotate: number
}

// A small seeded generator, so a pick always breaks the same way in a test.
export function seededRandom(seed: number) {
  let state = seed % 2147483647 || 1
  return () => {
    state = (state * 16807) % 2147483647
    return (state - 1) / 2147483646
  }
}

// Where a ray from the impact point leaves the 100 x 100 card box.
function edgeHit(impact: Point, angle: number): Point {
  const dx = Math.cos(angle)
  const dy = Math.sin(angle)
  let t = Infinity
  if (dx > 0) t = Math.min(t, (100 - impact.x) / dx)
  if (dx < 0) t = Math.min(t, -impact.x / dx)
  if (dy > 0) t = Math.min(t, (100 - impact.y) / dy)
  if (dy < 0) t = Math.min(t, -impact.y / dy)
  return { x: impact.x + dx * t, y: impact.y + dy * t }
}

const CORNERS: Point[] = [
  { x: 100, y: 100 },
  { x: 0, y: 100 },
  { x: 0, y: 0 },
  { x: 100, y: 0 },
]

// Cuts the card into `count` wedges around the impact point. Together they cover the whole card.
export function shatterCard(impact: Point, count: number, random: () => number): Shard[] {
  const turn = 2 * Math.PI
  const angles = Array.from({ length: count }, (_, i) => (i / count) * turn + random() * 0.25)
  const angleOf = (point: Point) => (Math.atan2(point.y - impact.y, point.x - impact.x) + turn) % turn

  return angles.map((start, i) => {
    const end = i === count - 1 ? angles[0] + turn : angles[i + 1]
    const unwrap = (angle: number) => (angle < start ? angle + turn : angle)
    const corners = CORNERS.filter((corner) => {
      const angle = unwrap(angleOf(corner))
      return angle > start && angle < end
    }).sort((a, b) => unwrap(angleOf(a)) - unwrap(angleOf(b)))
    const points = [impact, edgeHit(impact, start), ...corners, edgeHit(impact, end)]

    const center = {
      x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
      y: points.reduce((sum, p) => sum + p.y, 0) / points.length,
    }
    const direction = Math.atan2(center.y - impact.y, center.x - impact.x)
    const distance = 60 + random() * 150
    return {
      clipPath: `polygon(${points.map((p) => `${p.x.toFixed(2)}% ${p.y.toFixed(2)}%`).join(', ')})`,
      dx: Math.cos(direction) * distance,
      dy: Math.sin(direction) * distance + 40 + random() * 60,
      rotate: (random() - 0.5) * 80,
    }
  })
}

// Jagged lines from the impact point, plus two broken rings, as an SVG path in a 100 x 100 box.
export function crackPath(impact: Point, random: () => number) {
  const clamp = (value: number) => Math.min(98, Math.max(2, value))
  let path = ''
  for (let i = 0; i < 11; i++) {
    const angle = (i / 11) * 2 * Math.PI + random() * 0.3
    const length = 25 + random() * 45
    path += `M ${impact.x} ${impact.y} `
    for (let step = 1; step <= 4; step++) {
      const jitter = angle + (random() - 0.5) * 0.5
      const x = clamp(impact.x + (Math.cos(jitter) * length * step) / 4)
      const y = clamp(impact.y + (Math.sin(jitter) * length * step) / 4)
      path += `L ${x.toFixed(1)} ${y.toFixed(1)} `
    }
  }
  for (const radius of [6, 13]) {
    for (let i = 0; i < 9; i++) {
      const a1 = (i / 9) * 2 * Math.PI
      const a2 = ((i + 0.8) / 9) * 2 * Math.PI
      path += `M ${(impact.x + Math.cos(a1) * radius).toFixed(1)} ${(impact.y + Math.sin(a1) * radius).toFixed(1)} `
      path += `L ${(impact.x + Math.cos(a2) * radius * 1.1).toFixed(1)} ${(impact.y + Math.sin(a2) * radius * 1.1).toFixed(1)} `
    }
  }
  return path.trim()
}
