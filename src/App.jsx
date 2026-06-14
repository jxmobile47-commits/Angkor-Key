import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Library, Tag, Settings, Search, KeyRound, Gauge, Activity,
  Disc, RotateCcw, ChevronDown, Moon, Sun, Upload, Headphones,
} from 'lucide-react'
import Sidebar from './components/Sidebar'
import Player from './components/Player'
import TrackTable from './components/TrackTable'
import TagEditor from './components/TagEditor'
import SettingsPanel from './components/Settings'
import MixStudio from './components/MixStudio'
import ExportMenu from './components/ExportMenu'
import { TRACKS, MY_MUSIC } from './data/tracks'
import { compatibleKeys, harmonicMatches } from './data/camelot'
import { fileToTrack } from './data/audio'

const TABS = [
  ['collection', 'My collection', Library],
  ['tag', 'Tag editor', Tag],
  ['mix', 'DJ Mix', Headphones],
  ['settings', 'Settings', Settings],
]

const FILTERS = [
  ['key', 'Key', KeyRound],
  ['tempo', 'Tempo', Gauge],
  ['energy', 'Energy', Activity],
  ['genre', 'Genre', Disc],
]

export default function App() {
  const [tab, setTab] = useState('collection')
  const [playlist, setPlaylist] = useState('all')
  const [tracks, setTracks] = useState(TRACKS)
  const [selected, setSelected] = useState(TRACKS[0] || null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [filterByKey, setFilterByKey] = useState(false)
  const [dark, setDark] = useState(() => localStorage.getItem('ak-theme') === 'dark')
  const [members, setMembers] = useState({}) // { playlistId: number[] }
  const [myMusic, setMyMusic] = useState(MY_MUSIC)
  const [importing, setImporting] = useState(false)
  const [dropping, setDropping] = useState(false)
  const [snap, setSnap] = useState(true)
  const [beatgrid, setBeatgrid] = useState(false)
  const raf = useRef(null)
  const audioRef = useRef(null)
  const fileRef = useRef(null)

  const activeKey = selected?.key
  const isRealAudio = !!selected?.audioUrl

  // Theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('ak-theme', dark ? 'dark' : 'light')
  }, [dark])

  // Simulated playback (only for mock tracks without real audio)
  useEffect(() => {
    if (!playing || isRealAudio) {
      cancelAnimationFrame(raf.current)
      return
    }
    let last = performance.now()
    const tick = (now) => {
      const dt = (now - last) / 1000
      last = now
      setProgress((p) => {
        const next = p + dt / (selected?.duration || 300)
        if (next >= 1) { setPlaying(false); return 1 }
        return next
      })
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [playing, selected, isRealAudio])

  // Real audio: load src on track change
  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    if (isRealAudio) {
      el.src = selected.audioUrl
      el.load()
    } else {
      el.removeAttribute('src')
    }
  }, [selected, isRealAudio])

  // Real audio: play/pause
  useEffect(() => {
    const el = audioRef.current
    if (!el || !isRealAudio) return
    if (playing) el.play().catch(() => {})
    else el.pause()
  }, [playing, isRealAudio, selected])

  const onAudioTime = () => {
    const el = audioRef.current
    if (el && el.duration) setProgress(el.currentTime / el.duration)
  }

  const selectTrack = (t) => {
    setSelected(t)
    setProgress(0)
    setPlaying(true)
  }

  const seek = (frac) => {
    setProgress(frac)
    const el = audioRef.current
    if (isRealAudio && el && el.duration) el.currentTime = frac * el.duration
  }

  const step = (dir) => {
    const i = tracks.findIndex((t) => t.id === selected.id)
    const ni = (i + dir + tracks.length) % tracks.length
    selectTrack(tracks[ni])
  }

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  // Import audio files
  const importFiles = async (fileList) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith('audio/'))
    if (!files.length) return
    setImporting(true)
    const added = []
    for (const f of files) {
      try { added.push(await fileToTrack(f)) } catch (e) { console.warn(e) }
    }
    setTracks((prev) => [...added, ...prev])
    setImporting(false)
    if (added[0]) selectTrack(added[0])
  }

  const onFileInput = (e) => { importFiles(e.target.files); e.target.value = '' }

  const onDropFiles = (e) => {
    e.preventDefault()
    setDropping(false)
    if (e.dataTransfer.files?.length) importFiles(e.dataTransfer.files)
  }

  // Reorder tracks (manual order only when not sorted)
  const reorder = (fromId, toId) => {
    if (fromId === toId) return
    setTracks((prev) => {
      const arr = [...prev]
      const from = arr.findIndex((t) => t.id === fromId)
      const to = arr.findIndex((t) => t.id === toId)
      if (from < 0 || to < 0) return prev
      const [moved] = arr.splice(from, 1)
      arr.splice(to, 0, moved)
      return arr
    })
  }

  // Update a track's metadata (used by the Tag editor)
  const updateTrack = (id, patch) => {
    setTracks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
    setSelected((s) => (s && s.id === id ? { ...s, ...patch } : s))
  }

  // Cue points
  const addCue = () => {
    if (!selected) return
    let pos = progress
    if (snap) {
      // snap to the nearest bar (4 beats) based on tempo
      const barFrac = ((60 / selected.tempo) * 4) / selected.duration
      if (barFrac > 0) pos = Math.round(pos / barFrac) * barFrac
    }
    pos = Math.max(0, Math.min(0.999, pos))
    const cues = [...selected.cues, { pos, energy: selected.energy }]
      .sort((a, b) => a.pos - b.pos)
      .map((c, i) => ({ ...c, id: i + 1 }))
    updateTrack(selected.id, { cues })
  }

  const removeCue = (cueId) => {
    if (!selected) return
    const cues = selected.cues
      .filter((c) => c.id !== cueId)
      .map((c, i) => ({ ...c, id: i + 1 }))
    updateTrack(selected.id, { cues })
  }

  // Add a track to a My Music playlist via drag-and-drop
  const addToPlaylist = (playlistId, trackId) => {
    setMembers((prev) => {
      const set = new Set(prev[playlistId] || [])
      set.add(trackId)
      return { ...prev, [playlistId]: [...set] }
    })
  }

  const isMyMusic = myMusic.some((m) => m.id === playlist)

  // Create / edit / delete My Music playlists
  const createPlaylist = ({ name, emoji }) => {
    const id = `pl-${Date.now().toString(36)}`
    setMyMusic((prev) => [...prev, { id, name, emoji }])
    setPlaylist(id)
  }

  const updatePlaylist = (id, patch) => {
    setMyMusic((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }

  const deletePlaylist = (id) => {
    setMyMusic((prev) => prev.filter((m) => m.id !== id))
    setMembers((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setPlaylist((p) => (p === id ? 'all' : p))
  }

  const visible = useMemo(() => {
    let list = tracks.filter((t) => {
      if (isMyMusic) {
        const ids = members[playlist] || []
        if (!ids.includes(t.id)) return false
      }
      if (!search) return true
      const q = search.toLowerCase()
      return t.artist.toLowerCase().includes(q) || t.title.toLowerCase().includes(q)
    })
    if (sortKey) {
      const dir = sortDir === 'asc' ? 1 : -1
      list = [...list].sort((a, b) => {
        let av = a[sortKey]
        let bv = b[sortKey]
        if (sortKey === 'cues') { av = a.cues.length; bv = b.cues.length }
        if (typeof av === 'string') return av.localeCompare(bv) * dir
        return (av - bv) * dir
      })
    }
    return list
  }, [tracks, search, sortKey, sortDir, isMyMusic, members, playlist])

  const compat = useMemo(() => (activeKey ? compatibleKeys(activeKey) : []), [activeKey])
  const dimUnmatched = filterByKey ? (k) => compat.includes(k) : null

  // Smart harmonic suggestions for the current track, with track counts.
  const suggestions = useMemo(() => {
    if (!activeKey) return []
    return harmonicMatches(activeKey).map((m) => ({
      ...m,
      count: tracks.filter((t) => t.key === m.code && t.id !== selected?.id).length,
    }))
  }, [activeKey, tracks, selected])

  // Jump to the next library track that matches a suggested key.
  const playKey = (code) => {
    const match = tracks.find((t) => t.key === code && t.id !== selected?.id)
    if (match) selectTrack(match)
  }

  return (
    <div
      className="h-screen w-screen flex bg-panel dark:bg-[#0b0f17] text-ink dark:text-slate-200 overflow-hidden"
      onDragOver={(e) => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); setDropping(true) } }}
      onDragLeave={(e) => { if (e.currentTarget === e.target) setDropping(false) }}
      onDrop={onDropFiles}
    >
      <audio
        ref={audioRef}
        onTimeUpdate={onAudioTime}
        onEnded={() => setPlaying(false)}
      />

      <Sidebar
        activeKey={activeKey}
        onSelectKey={() => setFilterByKey(true)}
        activePlaylist={playlist}
        onSelectPlaylist={setPlaylist}
        onAddTracks={() => fileRef.current?.click()}
        onDropToPlaylist={addToPlaylist}
        myMusic={myMusic}
        onCreatePlaylist={createPlaylist}
        onUpdatePlaylist={updatePlaylist}
        onDeletePlaylist={deletePlaylist}
        suggestions={suggestions}
        currentTrack={selected}
        onPlayKey={playKey}
      />

      <input
        ref={fileRef}
        type="file"
        accept="audio/*"
        multiple
        className="hidden"
        onChange={onFileInput}
      />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 flex items-center gap-2 px-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#11161f]">
          <div className="flex items-center gap-1">
            {TABS.map(([id, label, Icon]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                  tab === id
                    ? 'bg-slate-100 dark:bg-slate-800 text-ink dark:text-white'
                    : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ExportMenu tracks={tracks} />
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="w-56 rounded-full bg-slate-100 dark:bg-slate-800 dark:text-slate-200 pl-9 pr-3 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-brand/40"
              />
            </div>
            <button
              onClick={() => setDark((d) => !d)}
              title="Toggle theme"
              className="grid place-items-center w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-amber-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col min-h-0 p-4 gap-4">
          {/* Player */}
          {tab !== 'settings' && tab !== 'mix' && (
          <Player
            track={selected}
            playing={playing}
            onTogglePlay={() => setPlaying((p) => !p)}
            progress={progress}
            onSeek={seek}
            onPrev={() => step(-1)}
            onNext={() => step(1)}
            onAddCue={addCue}
            onRemoveCue={removeCue}
            snap={snap}
            onToggleSnap={() => setSnap((s) => !s)}
            beatgrid={beatgrid}
            onToggleBeatgrid={() => setBeatgrid((b) => !b)}
          />
          )}

          {/* Library panel */}
          <section className={`relative flex-1 min-h-0 rounded-2xl flex flex-col ${tab === 'mix' ? '' : 'bg-white dark:bg-[#11161f] shadow-soft border border-slate-200 dark:border-slate-800'}`}>
            {tab === 'settings' ? (
              <SettingsPanel />
            ) : tab === 'mix' ? (
              <MixStudio tracks={tracks} />
            ) : tab === 'tag' ? (
              <TagEditor
                tracks={tracks}
                selectedId={selected?.id}
                onSelect={setSelected}
                onUpdate={updateTrack}
              />
            ) : (
            <>
            {/* Toolbar */}
            <div className="flex items-center gap-3 px-4 h-12 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-[13px] font-semibold text-ink dark:text-slate-100">
                <Disc size={15} className="text-slate-400" />
                {isMyMusic ? 'Playlist' : 'All Music'}
                <span className="text-slate-400 font-normal">({visible.length} tracks)</span>
                {importing && <span className="text-brand text-[12px] ml-2">Importing…</span>}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-full bg-brand hover:bg-brand-dark text-white px-3 py-1.5 text-[12px] font-semibold transition-colors"
                >
                  <Upload size={13} /> Import audio
                </button>
                {FILTERS.map(([id, label, Icon]) => (
                  <button
                    key={id}
                    onClick={() => id === 'key' && setFilterByKey((v) => !v)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                      id === 'key' && filterByKey
                        ? 'border-brand text-brand bg-brand/5'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon size={13} /> {label} <ChevronDown size={12} />
                  </button>
                ))}
                <button
                  onClick={() => { setSortKey(null); setSearch(''); setFilterByKey(false) }}
                  className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 hover:text-ink dark:hover:text-white"
                >
                  <RotateCcw size={13} /> Reset
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0">
              <TrackTable
                tracks={visible}
                selectedId={selected?.id}
                onSelect={selectTrack}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
                dimUnmatched={dimUnmatched}
                canReorder={!sortKey && !search}
                onReorder={reorder}
              />
            </div>

            {dropping && (
              <div className="absolute inset-0 rounded-2xl bg-brand/10 border-2 border-dashed border-brand grid place-items-center pointer-events-none">
                <div className="flex items-center gap-2 text-brand font-semibold">
                  <Upload size={18} /> Drop audio files to import
                </div>
              </div>
            )}
            </>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
