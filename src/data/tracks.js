import { CAMELOT_TO_KEY } from './camelot'

// Deterministic pseudo-random for stable waveform per track id.
function seeded(seed) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

// Build a normalized waveform array for a track id.
export function makeWaveform(id, bars = 220) {
  const rnd = seeded(id * 9301 + 49297)
  const out = []
  for (let i = 0; i < bars; i++) {
    const env = 0.55 + 0.45 * Math.sin((i / bars) * Math.PI * 4 + id)
    const v = (0.25 + 0.75 * rnd()) * Math.max(0.2, env)
    out.push(Math.min(1, v))
  }
  return out
}

// Library starts empty — users import their own audio files.
const RAW = []

const COVERS = [
  ['#ff7a59', '#ffd66b'], ['#5b8cff', '#9be7ff'], ['#ff6b9d', '#ffd1e8'],
  ['#7bd389', '#d9f5c9'], ['#b06bff', '#e2c6ff'], ['#ffb56b', '#fff0c9'],
  ['#33c1c9', '#a6f0ef'], ['#ff5d73', '#ffc1b6'], ['#6b7bff', '#c6d0ff'],
  ['#3fae7e', '#bdf0d8'],
]

function fmtDuration(id) {
  const total = 240 + (id * 37) % 200
  const m = Math.floor(total / 60)
  const s = total % 60
  return { total, label: `${m}:${String(s).padStart(2, '0')}` }
}

export const TRACKS = RAW.map((r, i) => {
  const [artist, title, key, energy, tempo, sharp, genre] = r
  const dur = fmtDuration(i + 1)
  // cue points as fractions of the track
  const cueCount = 4 + (i % 4)
  const cues = Array.from({ length: cueCount }, (_, c) => ({
    id: c + 1,
    pos: (c + 0.5) / cueCount + (((i * 7 + c) % 5) - 2) * 0.015,
    energy: 3 + ((i + c) % 7),
  }))
  return {
    id: i + 1,
    artist,
    title,
    key,
    keyName: CAMELOT_TO_KEY[key],
    energy,
    tempo,
    sharp,
    genre,
    cues,
    comment: `${key} - Energy ${energy}`,
    duration: dur.total,
    durationLabel: dur.label,
    cover: COVERS[i % COVERS.length],
    waveform: makeWaveform(i + 1),
  }
})

export const PLAYLISTS = [
  { id: 'all', name: 'All Music', count: TRACKS.length, icon: 'all' },
  { id: 'queue', name: 'Analysis Queue', count: 0, icon: 'queue', muted: 'empty' },
  { id: 'improve', name: 'Improve Tracks', count: 0, icon: 'improve' },
  { id: 'recent', name: 'Recently Added', count: TRACKS.length, icon: 'recent' },
]

export const MY_MUSIC = [
  { id: 'gigs', name: 'DJ Gigs', emoji: '🎧' },
  { id: 'melodic', name: 'Melodic Techno', emoji: '⚫' },
  { id: 'tech', name: 'Tech House', emoji: '🎹' },
  { id: 'warmup', name: 'Warm-up', emoji: '🌅' },
  { id: 'house', name: 'House', emoji: '🏠' },
  { id: 'latin', name: 'Latin', emoji: '💃' },
  { id: 'chill', name: 'Chill out', emoji: '🛋️' },
  { id: 'tropical', name: 'Tropical House', emoji: '🌴' },
]
