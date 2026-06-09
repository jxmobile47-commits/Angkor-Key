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

const RAW = [
  ['Latmun', 'Just Play (Original Mix)', '6A', 6, 129, 8, 'Minimal / Deep Tech'],
  ['Robbie Doherty', "It's My Beat (Extended Mix)", '2A', 6, 130, 7, 'Minimal / Deep Tech'],
  ['Dombresky', 'IRLY (I Really Love You) (Ext...)', '5A', 6, 127, 8, 'Dance / Electro Pop'],
  ['Volen Sentir, Makebo', 'Into The Stars (Original Mix)', '9B', 6, 120, 8, 'Organic House / Downtempo'],
  ['Ryan Nichols', 'Insane (Extended Mix)', '6A', 6, 127, 8, 'Tech House'],
  ['David Guetta, Bebe Rexha', "I'm Good (Blue) (Extended)", '6A', 6, 128, 7, 'Dance / Electro Pop'],
  ['Benny Page, Dope Ammo', 'I Need Your Loving (Blade...)', '12A', 7, 88, 6, 'Drum & Bass'],
  ['Echoes, John Summit', 'Human (feat. Echoes) (Ext...)', '4A', 6, 126, 8, 'Dance / Electro Pop'],
  ['Biscits', 'House All The Time (Exte...)', '4A', 6, 127, 6, 'Tech House'],
  ['ARTBAT', 'Horizon (Original Mix)', '4A', 6, 124, 8, 'Melodic House & Techno'],
  ['Josh Wink', 'Higher State Of Conscio...', '6A', 7, 124, 8, 'House'],
  ['Cyber Legenda', 'Halloween Acid (Original...)', '12A', 6, 122, 8, 'Tech House'],
  ['Fred again..', 'Delilah (pull me out of this)', '8A', 7, 130, 7, 'Melodic House & Techno'],
  ['CamelPhat, Anyma', 'The Sign (Extended Mix)', '11A', 6, 123, 9, 'Melodic House & Techno'],
  ['Disclosure', 'You & Me (Flume Remix)', '3A', 5, 121, 6, 'Dance / Electro Pop'],
  ['Bicep', 'Glue (Original Mix)', '7A', 7, 130, 8, 'Melodic House & Techno'],
  ['Â Black Coffee', 'Drive (feat. David Guetta)', '1A', 5, 119, 7, 'Organic House / Downtempo'],
  ['Solomun', 'Home (Original Mix)', '10A', 6, 122, 7, 'Melodic House & Techno'],
  ['Chris Lake, Green Velvet', 'Deceiver (Extended)', '5A', 7, 128, 8, 'Tech House'],
  ['John Summit, Hayla', 'Where You Are (Extended)', '8B', 6, 126, 8, 'Dance / Electro Pop'],
  ['Adriatique', 'Strangers (Original Mix)', '9A', 6, 122, 7, 'Melodic House & Techno'],
  ['MEDUZA', 'Lose Control (Extended)', '11A', 6, 124, 7, 'Dance / Electro Pop'],
  ['Tiësto', 'The Business (Extended)', '6A', 7, 120, 8, 'Dance / Electro Pop'],
  ['Vintage Culture', 'Weak (Extended Mix)', '7B', 6, 124, 8, 'Melodic House & Techno'],
  ['Kollektiv Turmstrasse', 'Sorry I Am Late', '2A', 5, 121, 6, 'Organic House / Downtempo'],
  ['HoneyLuv', 'Sneaky Link (Original Mix)', '3A', 7, 128, 8, 'Tech House'],
  ['Mau P', 'Drugs From Amsterdam', '12A', 7, 128, 9, 'Tech House'],
  ['Rüfüs Du Sol', 'Innerbloom (Extended)', '10A', 5, 118, 6, 'Melodic House & Techno'],
  ['Dom Dolla', 'Miracle Maker (Extended)', '4A', 6, 126, 8, 'Tech House'],
  ['Cassian, RÜFÜS', 'Don\'t Be Afraid (Extended)', '1B', 6, 122, 7, 'Melodic House & Techno'],
]

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
  { id: 'improve', name: 'Improve Tracks', count: 106, icon: 'improve' },
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
