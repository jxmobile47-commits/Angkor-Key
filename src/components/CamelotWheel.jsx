import React from 'react'
import { CAMELOT_COLORS, harmonicMatches, REL_META } from '../data/camelot'

// Geometry helpers
const polar = (cx, cy, r, deg) => {
  const a = ((deg - 90) * Math.PI) / 180
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
}

function segPath(cx, cy, rInner, rOuter, startDeg, endDeg) {
  const [x1, y1] = polar(cx, cy, rOuter, startDeg)
  const [x2, y2] = polar(cx, cy, rOuter, endDeg)
  const [x3, y3] = polar(cx, cy, rInner, endDeg)
  const [x4, y4] = polar(cx, cy, rInner, startDeg)
  const large = endDeg - startDeg <= 180 ? 0 : 1
  return `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${large} 0 ${x4} ${y4} Z`
}

export default function CamelotWheel({ activeKey, onSelect }) {
  const size = 240
  const cx = size / 2
  const cy = size / 2
  const rOuter = 116
  const rMid = 84
  const rInner = 50
  const seg = 30 // 360 / 12

  const relMap = {}
  harmonicMatches(activeKey).forEach((m) => { relMap[m.code] = m.rel })
  const isDim = (code) => activeKey && !relMap[code]

  const segProps = (code) => {
    const rel = relMap[code]
    if (rel) return { stroke: REL_META[rel].color, strokeWidth: 3 }
    return { stroke: '#fff', strokeWidth: 2 }
  }

  const ring = (num) => {
    const start = (num - 1) * seg - seg / 2
    const end = start + seg
    const codeB = `${num}B`
    const codeA = `${num}A`
    const [lx, ly] = polar(cx, cy, (rMid + rOuter) / 2, start + seg / 2)
    const [ix, iy] = polar(cx, cy, (rInner + rMid) / 2, start + seg / 2)
    return (
      <g key={num}>
        <path
          d={segPath(cx, cy, rMid, rOuter, start, end)}
          fill={CAMELOT_COLORS[codeB]}
          {...segProps(codeB)}
          opacity={isDim(codeB) ? 0.22 : 1}
          className="cursor-pointer transition-opacity"
          onClick={() => onSelect?.(codeB)}
        />
        <path
          d={segPath(cx, cy, rInner, rMid, start, end)}
          fill={CAMELOT_COLORS[codeA]}
          {...segProps(codeA)}
          opacity={isDim(codeA) ? 0.22 : 1}
          className="cursor-pointer transition-opacity"
          onClick={() => onSelect?.(codeA)}
        />
        <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central"
          fontSize="11" fontWeight="700" fill="#33405c" className="pointer-events-none select-none">
          {num}B
        </text>
        <text x={ix} y={iy} textAnchor="middle" dominantBaseline="central"
          fontSize="9.5" fontWeight="700" fill="#33405c" className="pointer-events-none select-none">
          {num}A
        </text>
      </g>
    )
  }

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto">
      {Array.from({ length: 12 }, (_, i) => ring(i + 1))}
      <circle cx={cx} cy={cy} r={rInner - 4} fill="#fff" />
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="11" fontWeight="800" fill="#2b3650">
        {activeKey || '—'}
      </text>
      <text x={cx} y={cy + 9} textAnchor="middle" fontSize="8" fontWeight="600" fill="#8a93a8">
        CAMELOT
      </text>
    </svg>
  )
}
