// Camelot Wheel utilities + color mapping.
// Each Camelot code maps to a musical key and a wheel color.

export const CAMELOT_COLORS = {
  '1A': '#7be0c9', '1B': '#7be0c9',
  '2A': '#8fe6a8', '2B': '#8fe6a8',
  '3A': '#b9ec8f', '3B': '#b9ec8f',
  '4A': '#e9e08a', '4B': '#e9e08a',
  '5A': '#f3c98b', '5B': '#f3c98b',
  '6A': '#f6b09a', '6B': '#f6b09a',
  '7A': '#f4a0b6', '7B': '#f4a0b6',
  '8A': '#e79ad0', '8B': '#e79ad0',
  '9A': '#cfa0e6', '9B': '#cfa0e6',
  '10A': '#aab0f0', '10B': '#aab0f0',
  '11A': '#8fc4f2', '11B': '#8fc4f2',
  '12A': '#8ad9e6', '12B': '#8ad9e6',
}

export const CAMELOT_TO_KEY = {
  '1A': 'Ab Min', '1B': 'B Maj',
  '2A': 'Eb Min', '2B': 'F# Maj',
  '3A': 'Bb Min', '3B': 'Db Maj',
  '4A': 'F Min', '4B': 'Ab Maj',
  '5A': 'C Min', '5B': 'Eb Maj',
  '6A': 'G Min', '6B': 'Bb Maj',
  '7A': 'D Min', '7B': 'F Maj',
  '8A': 'A Min', '8B': 'C Maj',
  '9A': 'E Min', '9B': 'G Maj',
  '10A': 'B Min', '10B': 'D Maj',
  '11A': 'F# Min', '11B': 'A Maj',
  '12A': 'Db Min', '12B': 'E Maj',
}

export function keyColor(code) {
  return CAMELOT_COLORS[code] || '#d7dbe6'
}

// Return harmonically compatible Camelot codes for a given code.
// Compatible = same number (relative major/minor), +/-1 on same letter.
export function compatibleKeys(code) {
  if (!code) return []
  const num = parseInt(code, 10)
  const letter = code.replace(/[0-9]/g, '')
  const other = letter === 'A' ? 'B' : 'A'
  const up = (num % 12) + 1
  const down = num === 1 ? 12 : num - 1
  return [code, `${num}${other}`, `${up}${letter}`, `${down}${letter}`]
}

// Metadata describing each harmonic-mixing relationship.
export const REL_META = {
  perfect: { label: 'Perfect match', short: '=', color: '#10b981' },
  boost: { label: 'Energy boost (+1)', short: '+1', color: '#3b6cf6' },
  drop: { label: 'Energy drop (-1)', short: '-1', color: '#f59e0b' },
  mood: { label: 'Mood change', short: '~', color: '#a855f7' },
}

// Analyze how two tracks mix together: harmonic relationship + tempo + energy.
// Returns { rel, label, score (0-100), color, tempoDiff, tempoPct, verdict }.
export function mixCompatibility(a, b) {
  if (!a?.key || !b?.key) return null
  const ca = a.key, cb = b.key
  const na = parseInt(ca, 10), la = ca.replace(/[0-9]/g, '')
  const nb = parseInt(cb, 10), lb = cb.replace(/[0-9]/g, '')

  let rel, label, color, keyScore
  if (ca === cb) {
    rel = 'perfect'; label = 'Same key — perfect match'; color = '#10b981'; keyScore = 100
  } else if (na === nb && la !== lb) {
    rel = 'mood'; label = 'Relative major/minor — smooth mood change'; color = '#a855f7'; keyScore = 90
  } else if (la === lb && ((na % 12) + 1 === nb)) {
    rel = 'boost'; label = 'Energy boost (+1)'; color = '#3b6cf6'; keyScore = 85
  } else if (la === lb && ((nb % 12) + 1 === na)) {
    rel = 'drop'; label = 'Energy drop (-1)'; color = '#f59e0b'; keyScore = 85
  } else if (la === lb && Math.abs(na - nb) === 2) {
    rel = 'energy2'; label = 'Two-step jump (+2) — bold but works'; color = '#f59e0b'; keyScore = 60
  } else {
    rel = 'clash'; label = 'Key clash — not harmonically compatible'; color = '#ef4444'; keyScore = 20
  }

  // Tempo proximity: closer BPM = better. Within ~6% is mixable.
  const ta = a.tempo || 0, tb = b.tempo || 0
  const tempoDiff = Math.abs(ta - tb)
  const tempoPct = ta ? (tempoDiff / ta) * 100 : 0
  let tempoScore = 100
  if (tempoPct > 8) tempoScore = 30
  else if (tempoPct > 6) tempoScore = 55
  else if (tempoPct > 3) tempoScore = 80

  const score = Math.round(keyScore * 0.65 + tempoScore * 0.35)
  let verdict
  if (score >= 85) verdict = 'Great mix'
  else if (score >= 70) verdict = 'Good mix'
  else if (score >= 50) verdict = 'Risky mix'
  else verdict = 'Avoid'

  return { rel, label, color, score, keyScore, tempoScore, tempoDiff, tempoPct, verdict }
}

// Smart harmonic suggestions: which keys mix well from `code`, with the reason.
export function harmonicMatches(code) {
  if (!code) return []
  const num = parseInt(code, 10)
  const letter = code.replace(/[0-9]/g, '')
  const other = letter === 'A' ? 'B' : 'A'
  const up = num === 12 ? 1 : num + 1
  const down = num === 1 ? 12 : num - 1
  return [
    { code: `${num}${letter}`, rel: 'perfect' },
    { code: `${up}${letter}`, rel: 'boost' },
    { code: `${down}${letter}`, rel: 'drop' },
    { code: `${num}${other}`, rel: 'mood', label: letter === 'B' ? 'Mood change (to minor)' : 'Mood change (to major)' },
  ]
}
