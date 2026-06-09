import React, { useRef } from 'react'

export default function Waveform({ track, progress, onSeek, onRemoveCue }) {
  const ref = useRef(null)
  const bars = track?.waveform || []

  const handleClick = (e) => {
    const rect = ref.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    onSeek?.(Math.max(0, Math.min(1, x)))
  }

  return (
    <div className="relative">
      {/* Cue markers */}
      <div className="absolute inset-x-0 top-0 h-full pointer-events-none">
        {track?.cues.map((cue) => (
          <div
            key={cue.id}
            className="absolute top-0 h-full"
            style={{ left: `${cue.pos * 100}%` }}
          >
            <div className="absolute -top-0 -translate-x-1/2 pointer-events-auto">
              <button
                onClick={(e) => { e.stopPropagation(); onRemoveCue?.(cue.id) }}
                title="Click to remove cue"
                className="rounded-md bg-ink text-white text-[10px] font-semibold px-1.5 py-0.5 whitespace-nowrap shadow hover:bg-red-500 transition-colors cursor-pointer"
              >
                Cue {cue.id}
              </button>
            </div>
            <div className="absolute top-6 bottom-5 w-px bg-ink/70" />
            <div className="absolute bottom-0 -translate-x-1/2 text-[10px] font-semibold text-slate-500">
              {cue.energy}
            </div>
          </div>
        ))}
      </div>

      {/* Bars */}
      <div
        ref={ref}
        onClick={handleClick}
        className="relative flex items-center gap-[2px] h-[110px] pt-7 pb-5 cursor-pointer select-none"
      >
        {bars.map((v, i) => {
          const played = i / bars.length < progress
          return (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{
                height: `${Math.max(3, v * 60)}px`,
                background: played ? '#2f6df6' : '#9cc2f5',
              }}
            />
          )
        })}
        {/* Playhead */}
        <div
          className="absolute top-6 bottom-5 w-[2px] bg-brand"
          style={{ left: `${progress * 100}%` }}
        />
      </div>
    </div>
  )
}
