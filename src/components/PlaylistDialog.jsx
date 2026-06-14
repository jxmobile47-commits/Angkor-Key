import React from 'react'
import { X, Trash2, Check } from 'lucide-react'

// Curated, DJ / music friendly emoji set for playlist icons.
const EMOJIS = [
  '🎧', '🎹', '🎚️', '🎛️', '🎵', '🎶', '🎤', '🥁', '🎸', '🎺', '🎷', '🪩',
  '⚫', '🔥', '⚡', '💥', '✨', '🌟', '💎', '🚀', '🌈', '🌊', '🌙', '☀️',
  '🌅', '🌴', '🏝️', '🏠', '🏙️', '🛋️', '💃', '🕺', '❤️', '💜', '💙', '💚',
  '🧡', '💛', '🖤', '🤍', '🍸', '🍹', '🎉', '🎆', '🐉', '👑', '🦄', '🍀',
]

export default function PlaylistDialog({ open, mode = 'create', initial, onClose, onSubmit, onDelete }) {
  const [name, setName] = React.useState('')
  const [emoji, setEmoji] = React.useState('🎵')

  React.useEffect(() => {
    if (open) {
      setName(initial?.name || '')
      setEmoji(initial?.emoji || '🎵')
    }
  }, [open, initial])

  if (!open) return null

  const submit = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    onSubmit?.({ name: trimmed, emoji })
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#11161f] border border-slate-200 dark:border-slate-800 shadow-soft overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-slate-100 dark:border-slate-800">
          <span className="text-sm font-bold text-ink dark:text-white">
            {mode === 'edit' ? 'Edit playlist' : 'New playlist'}
          </span>
          <button
            onClick={onClose}
            className="grid place-items-center w-7 h-7 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Name + selected emoji preview */}
          <div className="flex items-center gap-3">
            <div className="grid place-items-center w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-2xl shrink-0">
              {emoji}
            </div>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
              placeholder="Playlist name"
              className="flex-1 rounded-lg bg-slate-100 dark:bg-slate-800 dark:text-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/40"
            />
          </div>

          {/* Emoji picker */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2">Icon</div>
            <div className="grid grid-cols-8 gap-1 max-h-44 overflow-y-auto scroll-thin">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`grid place-items-center h-9 rounded-lg text-lg transition-colors ${
                    emoji === e
                      ? 'bg-brand/15 ring-2 ring-brand ring-inset'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-4 h-14 border-t border-slate-100 dark:border-slate-800">
          {mode === 'edit' && (
            <button
              onClick={onDelete}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 size={14} /> Delete
            </button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg px-3 py-2 text-[13px] font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={!name.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 text-[13px] font-semibold transition-colors"
            >
              <Check size={14} /> {mode === 'edit' ? 'Save' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
