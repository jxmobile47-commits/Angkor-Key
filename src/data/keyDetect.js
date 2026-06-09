// Musical key detection using a chromagram + Krumhansl-Schmuckler key profiles.
// Pure JS, runs on decoded PCM in the renderer. Returns a Camelot code.

// In-place iterative radix-2 FFT.
function fft(re, im) {
  const n = re.length
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      const tr = re[i]; re[i] = re[j]; re[j] = tr
      const ti = im[i]; im[i] = im[j]; im[j] = ti
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len
    const wre = Math.cos(ang), wim = Math.sin(ang)
    for (let i = 0; i < n; i += len) {
      let cre = 1, cim = 0
      for (let k = 0; k < len / 2; k++) {
        const a = i + k
        const b = i + k + len / 2
        const vre = re[b] * cre - im[b] * cim
        const vim = re[b] * cim + im[b] * cre
        re[b] = re[a] - vre; im[b] = im[a] - vim
        re[a] = re[a] + vre; im[a] = im[a] + vim
        const ncre = cre * wre - cim * wim
        cim = cre * wim + cim * wre
        cre = ncre
      }
    }
  }
}

// Krumhansl-Schmuckler profiles (C-based).
const MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]
const MINOR = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]

// Camelot codes indexed by tonic pitch class (0 = C ... 11 = B).
const MAJOR_CAMELOT = ['8B', '3B', '10B', '5B', '12B', '7B', '2B', '9B', '4B', '11B', '6B', '1B']
const MINOR_CAMELOT = ['5A', '12A', '7A', '2A', '9A', '4A', '11A', '6A', '1A', '8A', '3A', '10A']

function corr(a, b) {
  const n = a.length
  let ma = 0, mb = 0
  for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i] }
  ma /= n; mb /= n
  let num = 0, da = 0, db = 0
  for (let i = 0; i < n; i++) {
    const x = a[i] - ma, y = b[i] - mb
    num += x * y; da += x * x; db += y * y
  }
  const den = Math.sqrt(da * db)
  return den === 0 ? 0 : num / den
}

function rotate(arr, t) {
  const out = new Array(12)
  for (let i = 0; i < 12; i++) out[i] = arr[(i - t + 12) % 12]
  return out
}

// Build a 12-bin chroma vector from PCM samples.
function chromagram(channel, sampleRate) {
  // Downsample to ~11025 Hz mono for speed and adequate resolution.
  const factor = Math.max(1, Math.round(sampleRate / 11025))
  const sr = sampleRate / factor
  const N = 4096
  const hop = 2048
  const chroma = new Float64Array(12)

  // Analyze up to ~120 seconds from the middle of the track.
  const totalDs = Math.floor(channel.length / factor)
  const maxSamples = Math.min(totalDs, Math.floor(sr * 120))
  const startDs = Math.max(0, Math.floor((totalDs - maxSamples) / 2))

  const re = new Float64Array(N)
  const im = new Float64Array(N)
  // Hann window
  const win = new Float64Array(N)
  for (let i = 0; i < N; i++) win[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1))

  for (let f = startDs; f + N * factor < (startDs + maxSamples) * factor && f + N * factor < channel.length; f += hop * factor) {
    for (let i = 0; i < N; i++) {
      re[i] = (channel[f + i * factor] || 0) * win[i]
      im[i] = 0
    }
    fft(re, im)
    for (let k = 1; k < N / 2; k++) {
      const freq = (k * sr) / N
      if (freq < 55 || freq > 2200) continue // A1..~C7 range
      const mag = Math.sqrt(re[k] * re[k] + im[k] * im[k])
      const pitch = 69 + 12 * Math.log2(freq / 440)
      const pc = ((Math.round(pitch) % 12) + 12) % 12
      chroma[pc] += mag
    }
  }
  return chroma
}

// Detect key. Returns { camelot, confidence }.
export function detectKey(channel, sampleRate) {
  try {
    const chroma = chromagram(channel, sampleRate)
    const sum = chroma.reduce((a, b) => a + b, 0)
    if (sum === 0) return null

    let best = { score: -Infinity, camelot: null }
    for (let t = 0; t < 12; t++) {
      const sMaj = corr(chroma, rotate(MAJOR, t))
      if (sMaj > best.score) best = { score: sMaj, camelot: MAJOR_CAMELOT[t] }
      const sMin = corr(chroma, rotate(MINOR, t))
      if (sMin > best.score) best = { score: sMin, camelot: MINOR_CAMELOT[t] }
    }
    return { camelot: best.camelot, confidence: Math.max(0, best.score) }
  } catch (e) {
    console.warn('key detection failed', e)
    return null
  }
}
