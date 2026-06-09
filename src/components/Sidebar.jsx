import React from 'react'
import {
  Music2, ListMusic, Sparkles, Clock, Plus, ChevronDown, Disc3,
} from 'lucide-react'
import CamelotWheel from './CamelotWheel'
import { PLAYLISTS, MY_MUSIC } from '../data/tracks'
import { REL_META, keyColor } from '../data/camelot'

const ICONS = {
  all: Music2,
  queue: ListMusic,
  improve: Sparkles,
  recent: Clock,
}

export default function Sidebar({ activeKey, onSelectKey, activePlaylist, onSelectPlaylist, onAddTracks, onDropToPlaylist, suggestions = [], currentTrack, onPlayKey }) {
  const [dropTarget, setDropTarget] = React.useState(null)

  const playlistDropProps = (id) => ({
    onDragOver: (e) => {
      if (e.dataTransfer.types.includes('text/track-id')) {
        e.preventDefault()
        setDropTarget(id)
      }
    },
    onDragLeave: () => setDropTarget((d) => (d === id ? null : d)),
    onDrop: (e) => {
      const raw = e.dataTransfer.getData('text/track-id')
      if (raw) {
        e.preventDefault()
        onDropToPlaylist?.(id, Number(raw))
      }
      setDropTarget(null)
    },
  })

  return (
    <aside className="w-[230px] shrink-0 bg-white dark:bg-[#11161f] border-r border-slate-200 dark:border-slate-800 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-14">
        <div className="grid place-items-center w-8 h-8 rounded-full bg-gradient-to-br from-brand to-cyan-400 text-white">
          <Disc3 size={18} />
        </div>
        <div className="leading-none">
          <div className="text-[13px] font-extrabold tracking-tight text-ink dark:text-white">ANGKOR</div>
          <div className="text-[13px] font-extrabold tracking-tight text-brand -mt-0.5">KEY</div>
        </div>
      </div>

      <div className="px-4 overflow-y-auto scroll-thin flex-1 pb-6">
        {/* Camelot Wheel */}
        <div className="flex items-center justify-between mt-2 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Camelot Wheel</span>
          <ChevronDown size={14} className="text-slate-400" />
        </div>
        <CamelotWheel activeKey={activeKey} onSelect={onSelectKey} />

        {/* Smart harmonic suggestions */}
        {suggestions.length > 0 && (
          <div className="mt-3 rounded-xl border border-slate-200 dark:border-slate-800 p-2.5">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles size={13} className="text-brand" />
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Mixes well with
              </span>
            </div>
            {currentTrack && (
              <div className="text-[11px] text-slate-400 mb-2 truncate">
                from <span className="font-semibold text-slate-500 dark:text-slate-300">{currentTrack.key}</span> · {currentTrack.title}
              </div>
            )}
            <div className="space-y-1">
              {suggestions.map((s) => {
                const meta = REL_META[s.rel]
                return (
                  <button
                    key={s.code}
                    onClick={() => s.count > 0 && onPlayKey?.(s.code)}
                    disabled={s.count === 0}
                    className={`w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors ${
                      s.count > 0 ? 'hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer' : 'opacity-50 cursor-default'
                    }`}
                  >
                    <span
                      className="rounded-md px-1.5 py-0.5 text-[11px] font-bold text-ink shrink-0"
                      style={{ background: keyColor(s.code) }}
                    >
                      {s.code}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[11px] font-semibold truncate" style={{ color: meta.color }}>
                        {s.label || meta.label}
                      </span>
                    </span>
                    <span className="text-[11px] text-slate-400 shrink-0">{s.count}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <button
          onClick={onAddTracks}
          className="w-full mt-3 mb-4 flex items-center justify-center gap-2 rounded-full bg-brand hover:bg-brand-dark text-white text-sm font-semibold py-2.5 shadow-soft transition-colors"
        >
          <Plus size={16} /> Add Tracks
        </button>

        {/* Playlists */}
        <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1">Playlists</div>
        <nav className="space-y-0.5">
          {PLAYLISTS.map((p) => {
            const Icon = ICONS[p.icon] || Music2
            const active = activePlaylist === p.id
            return (
              <button
                key={p.id}
                onClick={() => onSelectPlaylist?.(p.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
                  active ? 'bg-brand/10 text-brand font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon size={15} className={active ? 'text-brand' : 'text-slate-400'} />
                <span className="flex-1 text-left truncate">{p.name}</span>
                <span className="text-[11px] text-slate-400">{p.muted || `(${p.count})`}</span>
              </button>
            )
          })}
        </nav>

        {/* My Music */}
        <div className="flex items-center justify-between mt-5 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">My Music</span>
          <ChevronDown size={14} className="text-slate-400" />
        </div>
        <nav className="space-y-0.5">
          {MY_MUSIC.map((m) => {
            const active = activePlaylist === m.id
            const isDrop = dropTarget === m.id
            return (
              <button
                key={m.id}
                onClick={() => onSelectPlaylist?.(m.id)}
                {...playlistDropProps(m.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
                  active ? 'bg-brand/10 text-brand font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                } ${isDrop ? 'ring-2 ring-brand ring-inset bg-brand/10' : ''}`}
              >
                <span className="text-[13px] w-4 text-center">{m.emoji}</span>
                <span className="flex-1 text-left truncate">{m.name}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
