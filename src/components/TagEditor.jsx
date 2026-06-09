import React, { useEffect, useRef, useState } from 'react'
import { ImagePlus, Save, Check } from 'lucide-react'
import { CAMELOT_TO_KEY } from '../data/camelot'

const KEYS = Object.keys(CAMELOT_TO_KEY).sort((a, b) => {
  const na = parseInt(a, 10), nb = parseInt(b, 10)
  if (na !== nb) return na - nb
  return a.endsWith('A') ? -1 : 1
})

const GENRES = [
  'Tech House', 'House', 'Melodic House & Techno', 'Dance / Electro Pop',
  'Organic House / Downtempo', 'Minimal / Deep Tech', 'Drum & Bass', 'Imported', 'Other',
]

function Cover({ track }) {
  if (track.coverImg) return <img src={track.coverImg} alt="" className="w-full h-full object-cover" />
  return <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${track.cover[0]}, ${track.cover[1]})` }} />
}

export default function TagEditor({ tracks, selectedId, onSelect, onUpdate }) {
  const track = tracks.find((t) => t.id === selectedId) || tracks[0]
  const [draft, setDraft] = useState(track)
  const [saved, setSaved] = useState(false)
  const imgRef = useRef(null)

  useEffect(() => { setDraft(track); setSaved(false) }, [track?.id])

  if (!track) return <div className="flex-1 grid place-items-center text-slate-400">No track selected.</div>

  const set = (k, v) => { setDraft((d) => ({ ...d, [k]: v })); setSaved(false) }

  const onImage = (e) => {
    const f = e.target.files?.[0]
    if (f) set('coverImg', URL.createObjectURL(f))
    e.target.value = ''
  }

  const save = () => {
    onUpdate(track.id, {
      artist: draft.artist, title: draft.title, key: draft.key,
      keyName: CAMELOT_TO_KEY[draft.key] || draft.keyName,
      tempo: Number(draft.tempo) || draft.tempo, energy: Number(draft.energy),
      sharp: Number(draft.sharp) || draft.sharp, genre: draft.genre,
      comment: draft.comment, coverImg: draft.coverImg,
    })
    setSaved(true)
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(track)
  const field = 'w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f141d] px-3 py-2 text-[13px] text-ink dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand/40'
  const label = 'text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1 block'

  return (
    <div className="flex-1 min-h-0 flex">
      <div className="w-64 shrink-0 border-r border-slate-100 dark:border-slate-800 overflow-y-auto scroll-thin">
        {tracks.map((t) => (
          <button key={t.id} onClick={() => onSelect(t)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${t.id === track.id ? 'bg-brand/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}>
            <div className="w-8 h-8 rounded overflow-hidden shrink-0"><Cover track={t} /></div>
            <div className="min-w-0">
              <div className="text-[12px] font-semibold text-ink dark:text-slate-100 truncate">{t.title}</div>
              <div className="text-[11px] text-slate-400 truncate">{t.artist}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-start gap-5">
            <div className="shrink-0">
              <div className="w-36 h-36 rounded-xl overflow-hidden shadow-soft ring-1 ring-slate-200 dark:ring-slate-700"><Cover track={draft} /></div>
              <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={onImage} />
              <button onClick={() => imgRef.current?.click()}
                className="mt-2 w-36 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-[12px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                <ImagePlus size={14} /> {draft.coverImg ? 'Change image' : 'Add image'}
              </button>
              {draft.coverImg && (
                <button onClick={() => set('coverImg', null)} className="mt-1 w-36 text-[11px] text-slate-400 hover:text-red-500">Remove image</button>
              )}
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <label className={label}>Artist</label>
                <input className={field} value={draft.artist} onChange={(e) => set('artist', e.target.value)} />
              </div>
              <div>
                <label className={label}>Title</label>
                <input className={field} value={draft.title} onChange={(e) => set('title', e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={label}>Key</label>
                  <select className={field} value={draft.key} onChange={(e) => set('key', e.target.value)}>
                    {KEYS.map((k) => <option key={k} value={k}>{k} · {CAMELOT_TO_KEY[k]}</option>)}
                  </select>
                </div>
                <div>
                  <label className={label}>Tempo</label>
                  <input type="number" className={field} value={draft.tempo} onChange={(e) => set('tempo', e.target.value)} />
                </div>
                <div>
                  <label className={label}>Sharp</label>
                  <input type="number" className={field} value={draft.sharp} onChange={(e) => set('sharp', e.target.value)} />
                </div>
              </div>
              <div>
                <label className={label}>Energy: {draft.energy}</label>
                <input type="range" min="1" max="10" value={draft.energy} onChange={(e) => set('energy', e.target.value)} className="w-full accent-brand" />
              </div>
              <div>
                <label className={label}>Genre</label>
                <select className={field} value={GENRES.includes(draft.genre) ? draft.genre : 'Other'} onChange={(e) => set('genre', e.target.value)}>
                  {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>Comment</label>
                <input className={field} value={draft.comment} onChange={(e) => set('comment', e.target.value)} />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button onClick={save} disabled={!dirty}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-semibold text-white transition-colors ${dirty ? 'bg-brand hover:bg-brand-dark' : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'}`}>
                  <Save size={15} /> Save changes
                </button>
                {saved && !dirty && (
                  <span className="flex items-center gap-1 text-[12px] text-emerald-500 font-semibold"><Check size={14} /> Saved</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
