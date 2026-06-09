import React, { useEffect, useRef, useState } from 'react'
import { Share2, ChevronDown, FileCode2, Tags, Loader2 } from 'lucide-react'
import { exportRekordbox, exportSeratoTags } from '../data/exporters'

export default function ExportMenu({ tracks }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(null)
  const [toast, setToast] = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const run = async (kind) => {
    setBusy(kind)
    setOpen(false)
    try {
      const res = kind === 'rekordbox'
        ? await exportRekordbox(tracks)
        : await exportSeratoTags(tracks)
      setToast({ ok: res.ok, message: res.message })
    } catch (e) {
      setToast({ ok: false, message: String(e) })
    } finally {
      setBusy(null)
      setTimeout(() => setToast(null), 5000)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={!!busy}
        className="flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-[12px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
        Export <ChevronDown size={12} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-64 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#161c27] shadow-soft z-30 p-1">
          <button
            onClick={() => run('rekordbox')}
            className="w-full flex items-start gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <FileCode2 size={16} className="text-brand mt-0.5" />
            <span>
              <span className="block text-[13px] font-semibold text-ink dark:text-slate-100">Rekordbox XML</span>
              <span className="block text-[11px] text-slate-400">Collection with BPM, key, cues — for Rekordbox &amp; CDJ</span>
            </span>
          </button>
          <button
            onClick={() => run('serato')}
            className="w-full flex items-start gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Tags size={16} className="text-emerald-500 mt-0.5" />
            <span>
              <span className="block text-[13px] font-semibold text-ink dark:text-slate-100">Write ID3 tags (Serato)</span>
              <span className="block text-[11px] text-slate-400">Key / BPM / comment into imported MP3 files</span>
            </span>
          </button>
        </div>
      )}

      {toast && (
        <div className={`absolute right-0 mt-1 w-72 rounded-lg px-3 py-2 text-[12px] shadow-soft z-30 ${toast.ok ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}
