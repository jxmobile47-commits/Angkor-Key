import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Play, Pause, KeyRound, Gauge, Activity, Check, X, AlertTriangle,
  SkipBack, SkipForward, Filter, Star, Sliders, Repeat, Download,
  ArrowRightToLine, Minus, Plus, Search, Shuffle,
} from 'lucide-react'
import Waveform from './Waveform'
import TrackTable from './TrackTable'
import { keyColor, CAMELOT_TO_KEY, mixCompatibility } from '../data/camelot'

const fmt = (s) => {
  if (!s && s !== 0) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

// Transpose a Camelot code by N semitones (moves around the wheel by fifths).
const transposeKey = (code, semis) => {
  if (!code || !semis) return code
  const num = parseInt(code, 10)
  const letter = code.replace(/[0-9]/g, '')
  const newNum = (((num - 1 + 7 * semis) % 12) + 12) % 12 + 1
  return `${newNum}${letter}`
}

function TrackPicker({ tracks, value, onChange, side }) {
  return (
    <select
      value={value?.id ?? ''}
      onChange={(e) => onChange(tracks.find((t) => t.id === Number(e.target.value)))}
      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f141d] px-3 py-2 text-[13px] font-semibold text-ink dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand/40"
    >
      <option value="" disabled>Load a track to Deck {side}…</option>
      {tracks.map((t) => (
        <option key={t.id} value={t.id}>{t.artist} — {t.title} ({t.key})</option>
      ))}
    </select>
  )
}

function Deck({
  side, track, tracks, onPick, playing, onTogglePlay, progress, onSeek,
  shift = 0, onShift, stems, onStems, loop = 16, onLoop, onExport,
}) {
  if (!track) {
    return (
      <div className="flex-1 min-w-0 rounded-2xl bg-white dark:bg-[#11161f] border border-slate-200 dark:border-slate-800 p-4">
        <TrackPicker tracks={tracks} value={track} onChange={onPick} side={side} />
        <div className="h-[160px] grid place-items-center text-slate-400 text-[13px]">No track on Deck {side}</div>
      </div>
    )
  }
  const dispKey = transposeKey(track.key, shift)
  return (
    <div className="flex-1 min-w-0 rounded-2xl bg-white dark:bg-[#11161f] border border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="grid place-items-center w-7 h-7 rounded-full bg-brand text-white text-[12px] font-bold shrink-0">{side}</span>
        <TrackPicker tracks={tracks} value={track} onChange={onPick} side={side} />
      </div>

      <Waveform track={track} progress={progress} onSeek={onSeek} />

      <div className="flex items-center gap-3">
        <button
          onClick={onTogglePlay}
          className="grid place-items-center w-11 h-11 rounded-full bg-brand hover:bg-brand-dark text-white shrink-0 transition-colors"
        >
          {playing ? <Pause size={18} /> : <Play size={18} className="translate-x-0.5" />}
        </button>
        <div className="min-w-0">
          <div className="text-[14px] font-bold text-ink dark:text-white truncate">{track.title}</div>
          <div className="text-[12px] text-slate-500 truncate">{track.artist}</div>
        </div>
        <div className="ml-auto text-[12px] tabular-nums text-slate-400 shrink-0">
          {fmt((track.duration || 0) * progress)} / {fmt(track.duration)}
        </div>
      </div>

      <div className="flex items-center gap-2 text-[12px]">
        <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-bold text-ink" style={{ background: keyColor(dispKey) }}>
          {dispKey}
        </span>
        <span className="text-slate-500">{CAMELOT_TO_KEY[dispKey]}</span>
        <span className="inline-flex items-center gap-1 text-slate-500 ml-2"><Gauge size={13} /> Tempo {track.tempo}</span>
        <span className="inline-flex items-center gap-1 text-slate-500 ml-2"><Activity size={13} /> Energy {track.energy}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[12px] font-semibold">
        <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <button onClick={() => onShift(-1)} className="px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"><Minus size={13} /></button>
          <span className="px-2 py-1.5 text-slate-600 dark:text-slate-300 flex items-center gap-1"><KeyRound size={12} /> {shift > 0 ? `+${shift}` : shift} key</span>
          <button onClick={() => onShift(1)} className="px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"><Plus size={13} /></button>
        </div>
        <button onClick={onStems} className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 ${stems ? 'border-brand text-brand bg-brand/5' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'} hover:bg-slate-50 dark:hover:bg-slate-800`}><Sliders size={13} /> Stems</button>
        <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <span className="px-2 py-1.5 inline-flex items-center gap-1 text-slate-600 dark:text-slate-300"><Repeat size={13} /> Loop</span>
          <select value={loop} onChange={(e) => onLoop(Number(e.target.value))} className="bg-transparent px-1.5 py-1.5 outline-none text-slate-600 dark:text-slate-300">
            {[4, 8, 16, 32].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <button onClick={onExport} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"><Download size={13} /> Export</button>
      </div>
    </div>
  )
}

function CompatBadge({ score }) {
  let Icon = Check, color = '#10b981'
  if (score < 50) { Icon = X; color = '#ef4444' }
  else if (score < 70) { Icon = AlertTriangle; color = '#f59e0b' }
  return (
    <div className="relative grid place-items-center w-28 h-28 rounded-full" style={{ background: `conic-gradient(${color} ${score * 3.6}deg, rgba(148,163,184,0.18) 0deg)` }}>
      <div className="grid place-items-center w-[88px] h-[88px] rounded-full bg-white dark:bg-[#11161f]">
        <Icon size={22} style={{ color }} />
        <div className="text-[22px] font-extrabold leading-none mt-1" style={{ color }}>{score}</div>
        <div className="text-[9px] uppercase tracking-wide text-slate-400">match</div>
      </div>
    </div>
  )
}

const FILTERS = [
  ['all', 'All ideas'],
  ['perfect', 'Perfect matches'],
  ['boost', 'Energy boost'],
  ['mood', 'Mood change'],
]

export default function MixStudio({ tracks }) {
  const [a, setA] = useState(tracks[0] || null)
  const [b, setB] = useState(tracks[1] || null)
  const [playA, setPlayA] = useState(false)
  const [playB, setPlayB] = useState(false)
  const [progA, setProgA] = useState(0)
  const [progB, setProgB] = useState(0)
  const [fader, setFader] = useState(50) // 0 = full A, 100 = full B
  const [mode, setMode] = useState('mashup') // 'mashup' | 'djmix'
  const [shiftA, setShiftA] = useState(0)
  const [shiftB, setShiftB] = useState(0)
  const [stemsA, setStemsA] = useState(false)
  const [stemsB, setStemsB] = useState(false)
  const [loopA, setLoopA] = useState(16)
  const [loopB, setLoopB] = useState(16)
  const [ideaIdx, setIdeaIdx] = useState(0)
  const [ideaFilter, setIdeaFilter] = useState('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const [saved, setSaved] = useState([])
  const [search, setSearch] = useState('')

  const audioA = useRef(null)
  const audioB = useRef(null)
  const rafA = useRef(null)
  const rafB = useRef(null)

  const realA = !!a?.audioUrl
  const realB = !!b?.audioUrl
  const gainA = 1 - fader / 100
  const gainB = fader / 100

  // --- Mashup ideas: tracks that mix well with Deck A -----------------
  const ideas = useMemo(() => {
    if (!a) return []
    return tracks
      .filter((t) => t.id !== a.id)
      .map((t) => ({ track: t, c: mixCompatibility(a, t) }))
      .filter(({ c }) => {
        if (!c) return false
        if (ideaFilter === 'all') return c.score >= 50
        return c.rel === ideaFilter
      })
      .sort((x, y) => y.c.score - x.c.score)
  }, [a, tracks, ideaFilter])

  useEffect(() => { setIdeaIdx(0) }, [a?.id, ideaFilter])

  // Load the current idea into Deck B.
  useEffect(() => {
    if (mode === 'mashup' && ideas.length) {
      const idea = ideas[Math.min(ideaIdx, ideas.length - 1)]
      if (idea && idea.track.id !== b?.id) setB(idea.track)
    }
  }, [ideaIdx, ideas, mode]) // eslint-disable-line

  // --- Audio wiring ---------------------------------------------------
  useEffect(() => { const el = audioA.current; if (el && realA) { el.src = a.audioUrl; el.load() } }, [a, realA])
  useEffect(() => { const el = audioB.current; if (el && realB) { el.src = b.audioUrl; el.load() } }, [b, realB])
  useEffect(() => { if (audioA.current) audioA.current.volume = gainA }, [gainA])
  useEffect(() => { if (audioB.current) audioB.current.volume = gainB }, [gainB])
  useEffect(() => { if (audioA.current) audioA.current.playbackRate = Math.pow(2, shiftA / 12) }, [shiftA, a])
  useEffect(() => { if (audioB.current) audioB.current.playbackRate = Math.pow(2, shiftB / 12) }, [shiftB, b])

  useEffect(() => { const el = audioA.current; if (realA && el) { playA ? el.play().catch(() => {}) : el.pause() } }, [playA, realA, a])
  useEffect(() => { const el = audioB.current; if (realB && el) { playB ? el.play().catch(() => {}) : el.pause() } }, [playB, realB, b])

  useEffect(() => {
    if (!playA || realA) { cancelAnimationFrame(rafA.current); return }
    let last = performance.now()
    const tick = (now) => {
      const dt = (now - last) / 1000; last = now
      setProgA((p) => { const n = p + dt / (a?.duration || 300); if (n >= 1) { setPlayA(false); return 1 } return n })
      rafA.current = requestAnimationFrame(tick)
    }
    rafA.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafA.current)
  }, [playA, a, realA])

  useEffect(() => {
    if (!playB || realB) { cancelAnimationFrame(rafB.current); return }
    let last = performance.now()
    const tick = (now) => {
      const dt = (now - last) / 1000; last = now
      setProgB((p) => { const n = p + dt / (b?.duration || 300); if (n >= 1) { setPlayB(false); return 1 } return n })
      rafB.current = requestAnimationFrame(tick)
    }
    rafB.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafB.current)
  }, [playB, b, realB])

  const seekA = (f) => { setProgA(f); if (realA && audioA.current?.duration) audioA.current.currentTime = f * audioA.current.duration }
  const seekB = (f) => { setProgB(f); if (realB && audioB.current?.duration) audioB.current.currentTime = f * audioB.current.duration }

  const compat = useMemo(() => mixCompatibility(a, b), [a, b])
  const both = playA && playB

  // Smart cue pairing: pick a random cue on Deck A, then the Deck B cue whose
  // energy is closest (so the two sections feel like they belong together).
  const [cuePair, setCuePair] = useState(null)

  const pickCues = () => {
    const aCues = a?.cues || []
    const bCues = b?.cues || []
    const aCue = aCues.length ? aCues[Math.floor(Math.random() * aCues.length)] : null
    let bCue = null
    if (bCues.length) {
      if (aCue) {
        // Smart match: closest energy, with a little randomness among ties.
        const ranked = [...bCues].sort((x, y) =>
          Math.abs(x.energy - aCue.energy) - Math.abs(y.energy - aCue.energy))
        const topE = Math.abs(ranked[0].energy - aCue.energy)
        const pool = ranked.filter((c) => Math.abs(c.energy - aCue.energy) === topE)
        bCue = pool[Math.floor(Math.random() * pool.length)]
      } else {
        bCue = bCues[Math.floor(Math.random() * bCues.length)]
      }
    }
    const pair = { aCue, bCue }
    setCuePair(pair)
    seekA(aCue ? aCue.pos : 0)
    seekB(bCue ? bCue.pos : 0)
    return pair
  }

  const testMashup = () => {
    if (both) { setPlayA(false); setPlayB(false); return }
    pickCues()
    setPlayA(true); setPlayB(true)
  }

  const shuffleCues = () => { pickCues(); setPlayA(true); setPlayB(true) }
  const saveMashup = () => { if (a && b) setSaved((s) => [...s, { a, b, score: compat?.score }]) }
  const swapToA = () => { setA(b); setShiftA(shiftB) }
  const exportDeck = (t) => console.log('Export deck track', t?.title)

  const visible = useMemo(() => {
    if (!search) return tracks
    const q = search.toLowerCase()
    return tracks.filter((t) => t.artist.toLowerCase().includes(q) || t.title.toLowerCase().includes(q))
  }, [tracks, search])

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scroll-thin p-4">
      <audio ref={audioA} onTimeUpdate={() => { const el = audioA.current; if (el?.duration) setProgA(el.currentTime / el.duration) }} onEnded={() => setPlayA(false)} />
      <audio ref={audioB} onTimeUpdate={() => { const el = audioB.current; if (el?.duration) setProgB(el.currentTime / el.duration) }} onEnded={() => setPlayB(false)} />

      {/* Decks + center control */}
      <div className="flex items-stretch gap-3">
        <Deck side="A" track={a} tracks={tracks} onPick={setA} playing={playA} onTogglePlay={() => setPlayA((p) => !p)} progress={progA} onSeek={seekA}
          shift={shiftA} onShift={(d) => setShiftA((v) => v + d)} stems={stemsA} onStems={() => setStemsA((v) => !v)} loop={loopA} onLoop={setLoopA} onExport={() => exportDeck(a)} />

        {/* Center control panel */}
        <div className="w-[210px] shrink-0 rounded-2xl bg-white dark:bg-[#11161f] border border-slate-200 dark:border-slate-800 p-3 flex flex-col items-center gap-3">
          {/* Mode toggle */}
          <div className="w-full grid grid-cols-2 rounded-full bg-slate-100 dark:bg-slate-800 p-0.5 text-[12px] font-semibold">
            {[['mashup', 'Mashup'], ['djmix', 'DJ Mix']].map(([id, label]) => (
              <button key={id} onClick={() => setMode(id)}
                className={`rounded-full py-1.5 transition-colors ${mode === id ? 'bg-white dark:bg-slate-600 text-ink dark:text-white shadow' : 'text-slate-500'}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Compatibility score */}
          {compat && <CompatBadge score={compat.score} />}
          {compat && <div className="text-[12px] font-bold -mt-1" style={{ color: compat.color }}>{compat.verdict}</div>}

          {mode === 'mashup' && (
            <>
              <div className="text-[12px] font-semibold text-slate-500">Mashup ideas</div>
              <div className="flex items-center gap-3">
                <button onClick={() => setIdeaIdx((i) => Math.max(0, i - 1))} disabled={ideaIdx <= 0}
                  className="grid place-items-center w-8 h-8 rounded-full bg-brand text-white disabled:opacity-30"><SkipBack size={15} /></button>
                <span className="text-[13px] tabular-nums text-ink dark:text-slate-200 font-semibold">{ideas.length ? ideaIdx + 1 : 0} / {ideas.length}</span>
                <button onClick={() => setIdeaIdx((i) => Math.min(ideas.length - 1, i + 1))} disabled={ideaIdx >= ideas.length - 1}
                  className="grid place-items-center w-8 h-8 rounded-full bg-brand text-white disabled:opacity-30"><SkipForward size={15} /></button>
              </div>

              <div className="relative w-full">
                <button onClick={() => setFilterOpen((o) => !o)}
                  className="w-full flex items-center justify-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 py-1.5 text-[12px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
                  <Filter size={13} /> {FILTERS.find((f) => f[0] === ideaFilter)[1]}
                </button>
                {filterOpen && (
                  <div className="absolute z-20 mt-1 w-full rounded-lg bg-white dark:bg-[#1a2230] border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
                    {FILTERS.map(([id, label]) => (
                      <button key={id} onClick={() => { setIdeaFilter(id); setFilterOpen(false) }}
                        className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-slate-100 dark:hover:bg-slate-800 ${ideaFilter === id ? 'text-brand font-semibold' : 'text-slate-600 dark:text-slate-300'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <button onClick={testMashup}
            className={`w-full flex items-center justify-center gap-1.5 rounded-full py-2 text-[13px] font-semibold text-white transition-colors ${both ? 'bg-rose-500 hover:bg-rose-600' : 'bg-brand hover:bg-brand-dark'}`}>
            {both ? <><Pause size={15} /> Stop</> : <><Play size={15} /> Test mashup</>}
          </button>

          {cuePair && (cuePair.aCue || cuePair.bCue) && (
            <div className="w-full rounded-lg bg-brand/5 border border-brand/20 px-2 py-1.5 text-center">
              <div className="text-[11px] font-semibold text-ink dark:text-slate-200">
                A {cuePair.aCue ? `Cue ${cuePair.aCue.id}` : '—'} <span className="text-slate-400">x</span> B {cuePair.bCue ? `Cue ${cuePair.bCue.id}` : '—'}
              </div>
              <div className="text-[10px] text-slate-400">
                Energy {cuePair.aCue?.energy ?? '?'} / {cuePair.bCue?.energy ?? '?'}
              </div>
              {both && (
                <button onClick={shuffleCues} className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline">
                  <Shuffle size={11} /> Shuffle cues
                </button>
              )}
            </div>
          )}
          <button onClick={saveMashup}
            className="w-full flex items-center justify-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 py-2 text-[13px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
            <Star size={15} /> Save mashup{saved.length ? ` (${saved.length})` : ''}
          </button>

          {/* Crossfader */}
          <div className="w-full mt-auto pt-2">
            <div className="flex items-center gap-2 text-[12px] font-bold text-slate-500">
              <span>A</span>
              <input type="range" min="0" max="100" value={fader} onChange={(e) => setFader(Number(e.target.value))} className="flex-1 accent-brand" />
              <span>B</span>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="flex justify-end">
            <button onClick={swapToA} disabled={!b}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-[12px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40">
              <ArrowRightToLine size={13} /> Move to Deck A
            </button>
          </div>
          <Deck side="B" track={b} tracks={tracks} onPick={setB} playing={playB} onTogglePlay={() => setPlayB((p) => !p)} progress={progB} onSeek={seekB}
            shift={shiftB} onShift={(d) => setShiftB((v) => v + d)} stems={stemsB} onStems={() => setStemsB((v) => !v)} loop={loopB} onLoop={setLoopB} onExport={() => exportDeck(b)} />
        </div>
      </div>

      {/* Track library */}
      <div className="mt-4 rounded-2xl bg-white dark:bg-[#11161f] border border-slate-200 dark:border-slate-800 flex flex-col" style={{ height: 360 }}>
        <div className="flex items-center gap-3 px-4 h-12 border-b border-slate-100 dark:border-slate-800">
          <span className="text-[13px] font-semibold text-ink dark:text-slate-100">All Music <span className="text-slate-400 font-normal">({tracks.length} tracks)</span></span>
          <div className="ml-auto relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search"
              className="w-56 rounded-full bg-slate-100 dark:bg-slate-800 pl-9 pr-3 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-brand/40" />
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <TrackTable tracks={visible} selectedId={b?.id} onSelect={(t) => { setB(t); setMode('djmix') }} />
        </div>
      </div>
    </div>
  )
}
