import React, { useState } from 'react'
import { GripVertical, Volume2 } from 'lucide-react'
import { keyColor } from '../data/camelot'

function Cover({ track }) {
  if (track.coverImg) {
    return <img src={track.coverImg} alt="" className="w-8 h-8 rounded shrink-0 object-cover" />
  }
  return (
    <div
      className="w-8 h-8 rounded shrink-0"
      style={{ background: `linear-gradient(135deg, ${track.cover[0]}, ${track.cover[1]})` }}
    />
  )
}

function EnergyBar({ value }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          className="w-[3px] h-3 rounded-sm"
          style={{ background: i < value ? '#3b6cf6' : 'rgba(148,163,184,0.35)' }}
        />
      ))}
    </div>
  )
}

const HEAD = [
  ['cover', '', 'w-16'],
  ['artist', 'Artist', ''],
  ['title', 'Title', ''],
  ['key', 'Key', 'w-20'],
  ['energy', 'Energy', 'w-24'],
  ['tempo', 'Tempo', 'w-20'],
  ['sharp', 'Sharp', 'w-16'],
  ['cues', 'Cue Points', 'w-24'],
  ['genre', 'Genre', 'w-44'],
  ['comment', 'Comment', 'w-40'],
]

export default function TrackTable({
  tracks, selectedId, onSelect, sortKey, sortDir, onSort, dimUnmatched,
  canReorder, onReorder,
}) {
  const [dragId, setDragId] = useState(null)
  const [overId, setOverId] = useState(null)

  return (
    <div className="overflow-auto scroll-thin h-full">
      <table className="w-full text-[13px] border-collapse">
        <thead className="sticky top-0 z-10 bg-panel dark:bg-[#161c27]">
          <tr className="text-left text-slate-400">
            {HEAD.map(([key, label, w]) => (
              <th
                key={key}
                onClick={() => key !== 'cover' && onSort?.(key)}
                className={`font-semibold px-3 py-2 select-none ${w} ${key !== 'cover' ? 'cursor-pointer hover:text-slate-600 dark:hover:text-slate-200' : ''}`}
              >
                {label}
                {sortKey === key && <span className="ml-1">{sortDir === 'asc' ? '▲' : '▼'}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tracks.map((t, idx) => {
            const selected = t.id === selectedId
            const dim = dimUnmatched && !dimUnmatched(t.key)
            const isOver = overId === t.id && dragId !== t.id
            return (
              <tr
                key={t.id}
                draggable
                onClick={() => onSelect?.(t)}
                onDragStart={(e) => {
                  setDragId(t.id)
                  e.dataTransfer.effectAllowed = 'move'
                  e.dataTransfer.setData('text/track-id', String(t.id))
                }}
                onDragEnd={() => { setDragId(null); setOverId(null) }}
                onDragOver={(e) => {
                  if (dragId && canReorder) { e.preventDefault(); setOverId(t.id) }
                }}
                onDrop={(e) => {
                  if (dragId && canReorder) {
                    e.preventDefault()
                    onReorder?.(dragId, t.id)
                  }
                  setOverId(null); setDragId(null)
                }}
                className={`group cursor-pointer border-b border-slate-100 dark:border-slate-800 transition-colors ${
                  selected
                    ? 'bg-brand/10'
                    : idx % 2
                      ? 'bg-white/40 dark:bg-white/[0.02]'
                      : 'bg-white dark:bg-transparent'
                } hover:bg-brand/5 dark:hover:bg-white/5 ${dim ? 'opacity-35' : ''} ${
                  isOver ? 'border-t-2 border-t-brand' : ''
                } ${dragId === t.id ? 'opacity-40' : ''}`}
              >
                <td className="px-3 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <GripVertical size={14} className="text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 cursor-grab" />
                    <Cover track={t} />
                  </div>
                </td>
                <td className="px-3 py-1.5 font-medium text-ink dark:text-slate-100 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5">
                    {t.audioUrl && <Volume2 size={12} className="text-brand" />}
                    {t.artist}
                  </span>
                </td>
                <td className="px-3 py-1.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">{t.title}</td>
                <td className="px-3 py-1.5">
                  <span className="rounded-md px-2 py-0.5 text-[12px] font-bold text-ink" style={{ background: keyColor(t.key) }}>
                    {t.key}
                  </span>
                </td>
                <td className="px-3 py-1.5"><EnergyBar value={t.energy} /></td>
                <td className="px-3 py-1.5 tabular-nums text-slate-600 dark:text-slate-300">{t.tempo}</td>
                <td className="px-3 py-1.5 text-slate-600 dark:text-slate-300">{t.sharp}</td>
                <td className="px-3 py-1.5 text-slate-600 dark:text-slate-300">{t.cues.length}</td>
                <td className="px-3 py-1.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">{t.genre}</td>
                <td className="px-3 py-1.5 text-slate-400 dark:text-slate-500 whitespace-nowrap">{t.comment}</td>
              </tr>
            )
          })}
          {tracks.length === 0 && (
            <tr>
              <td colSpan={HEAD.length} className="px-3 py-10 text-center text-slate-400">
                No tracks here yet — drag tracks onto a playlist or import audio.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
