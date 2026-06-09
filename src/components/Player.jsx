import React from 'react'
import {
  Play, Pause, SkipBack, SkipForward, Volume2, Plus, Crosshair, Piano, Info,
} from 'lucide-react'
import Waveform from './Waveform'
import { keyColor } from '../data/camelot'

function fmt(sec) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function Stat({ label, children }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">{label}</span>
      {children}
    </div>
  )
}

export default function Player({
  track, playing, onTogglePlay, progress, onSeek, onPrev, onNext,
  onAddCue, onRemoveCue, snap, onToggleSnap,
}) {
  if (!track) return null
  const elapsed = progress * track.duration

  return (
    <div className="bg-white dark:bg-[#11161f] rounded-2xl shadow-soft border border-slate-200 dark:border-slate-800 p-4">
      <div className="flex gap-4">
        {/* Transport */}
        <div className="flex items-center gap-2 pt-1">
          <button onClick={onPrev} className="text-slate-500 hover:text-ink dark:hover:text-white">
            <SkipBack size={20} fill="currentColor" />
          </button>
          <button
            onClick={onTogglePlay}
            className="grid place-items-center w-12 h-12 rounded-full bg-brand hover:bg-brand-dark text-white shadow-soft transition-colors"
          >
            {playing ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-0.5" />}
          </button>
          <button onClick={onNext} className="text-slate-500 hover:text-ink dark:hover:text-white">
            <SkipForward size={20} fill="currentColor" />
          </button>
        </div>

        {/* Waveform */}
        <div className="flex-1 min-w-0">
          <Waveform track={track} progress={progress} onSeek={onSeek} onRemoveCue={onRemoveCue} />
        </div>
      </div>

      {/* Track info row */}
      <div className="flex items-center justify-between mt-2">
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold text-ink dark:text-slate-100 truncate">
            {track.artist} <span className="text-slate-400 font-normal">— {track.title}</span>
          </h2>
        </div>
        <div className="flex items-center gap-3 text-slate-500 shrink-0">
          <span className="text-[13px] tabular-nums">{fmt(elapsed)} / {fmt(track.duration)}</span>
          <Volume2 size={18} />
        </div>
      </div>

      {/* Meta + actions */}
      <div className="flex items-center justify-between mt-3 flex-wrap gap-y-2">
        <div className="flex items-center gap-5">
          <Stat label="Key">
            <span className="rounded-md px-2 py-0.5 text-[12px] font-bold text-ink" style={{ background: keyColor(track.key) }}>
              {track.key}
            </span>
            <span className="text-[12px] text-slate-500 ml-1">{track.keyName}</span>
          </Stat>
          <Stat label="Tempo"><span className="text-[13px] font-semibold text-ink dark:text-slate-100">{track.tempo}</span></Stat>
          <Stat label="Energy"><span className="text-[13px] font-semibold text-ink dark:text-slate-100">{track.energy}</span></Stat>
          <Stat label="Cue points"><span className="text-[13px] font-semibold text-ink dark:text-slate-100">{track.cues.length}</span></Stat>
          <button
            onClick={onAddCue}
            className="flex items-center gap-1 text-[12px] font-semibold text-slate-500 hover:text-brand transition-colors"
          >
            <Plus size={14} /> Add cue
          </button>
          <button
            onClick={onToggleSnap}
            className={`flex items-center gap-1 text-[12px] font-semibold transition-colors ${snap ? 'text-brand' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
          >
            <Crosshair size={14} /> Snap cue{snap ? ' · on' : ' · off'}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-[12px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
            <Piano size={14} /> Piano
          </button>
          <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-[12px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
            <Info size={14} /> Song Info
          </button>
        </div>
      </div>
    </div>
  )
}
