// Real-audio helpers: decode a File into a waveform + duration, build a track.
import { makeWaveform } from './tracks'
import { detectKey } from './keyDetect'
import { CAMELOT_TO_KEY } from './camelot'

const COVERS = [
  ['#ff7a59', '#ffd66b'], ['#5b8cff', '#9be7ff'], ['#ff6b9d', '#ffd1e8'],
  ['#7bd389', '#d9f5c9'], ['#b06bff', '#e2c6ff'], ['#33c1c9', '#a6f0ef'],
]

let _ctx = null
function ctx() {
  if (!_ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    _ctx = new AC()
  }
  return _ctx
}

// Reduce channel data to `bars` normalized peak values.
function peaks(channel, bars = 220) {
  const block = Math.floor(channel.length / bars) || 1
  const out = []
  let max = 0.0001
  for (let i = 0; i < bars; i++) {
    let peak = 0
    const start = i * block
    for (let j = 0; j < block; j++) {
      const v = Math.abs(channel[start + j] || 0)
      if (v > peak) peak = v
    }
    out.push(peak)
    if (peak > max) max = peak
  }
  return out.map((v) => v / max)
}

// Rough BPM estimate via energy-onset autocorrelation (approximate).
function estimateTempo(channel, sampleRate) {
  try {
    const step = Math.floor(sampleRate / 100) // 10ms
    const env = []
    for (let i = 0; i < channel.length; i += step) {
      let sum = 0
      for (let j = 0; j < step; j++) sum += Math.abs(channel[i + j] || 0)
      env.push(sum / step)
    }
    let best = 0
    let bestLag = 0
    for (let lag = 30; lag < 120; lag++) {
      let corr = 0
      for (let i = 0; i < env.length - lag; i++) corr += env[i] * env[i + lag]
      if (corr > best) { best = corr; bestLag = lag }
    }
    const bpm = bestLag ? Math.round(6000 / bestLag) : 0
    if (bpm >= 60 && bpm <= 200) return bpm
  } catch { /* ignore */ }
  return 120
}

function fmt(sec) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

const KEYS = ['1A','2A','3A','4A','5A','6A','7A','8A','9A','10A','11A','12A',
              '1B','2B','3B','4B','5B','6B','7B','8B','9B','10B','11B','12B']

let _id = 1000

export async function fileToTrack(file) {
  const url = URL.createObjectURL(file)
  const id = ++_id
  let waveform = makeWaveform(id)
  let duration = 240
  let tempo = 120
  let key = KEYS[id % KEYS.length]
  let keyConfidence = 0

  try {
    const buf = await file.arrayBuffer()
    const decoded = await ctx().decodeAudioData(buf)
    const ch = decoded.getChannelData(0)
    waveform = peaks(ch)
    duration = decoded.duration
    tempo = estimateTempo(ch, decoded.sampleRate)
    const detected = detectKey(ch, decoded.sampleRate)
    if (detected) { key = detected.camelot; keyConfidence = detected.confidence }
  } catch (e) {
    console.warn('decode failed, using fallback waveform', e)
  }

  const name = file.name.replace(/\.[^.]+$/, '')
  const [artist, title] = name.includes(' - ')
    ? name.split(' - ')
    : ['Unknown Artist', name]

  const energy = 4 + (id % 6)
  const cueCount = 4 + (id % 4)
  const cues = Array.from({ length: cueCount }, (_, c) => ({
    id: c + 1,
    pos: (c + 0.5) / cueCount,
    energy: 3 + ((id + c) % 7),
  }))

  return {
    id,
    artist: artist.trim(),
    title: title.trim(),
    key,
    keyName: CAMELOT_TO_KEY[key] || '',
    keyConfidence,
    energy,
    tempo,
    sharp: 6 + (id % 4),
    genre: 'Imported',
    cues,
    comment: `${key} - Energy ${energy}`,
    duration,
    durationLabel: fmt(duration),
    cover: COVERS[id % COVERS.length],
    waveform,
    audioUrl: url,
    filePath: file.path || null,
  }
}
