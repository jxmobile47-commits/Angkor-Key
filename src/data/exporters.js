// Export helpers for real DJ software: Rekordbox XML + Serato/standard ID3 tags.

// Camelot -> Rekordbox "Tonality" notation.
const CAMELOT_REKORDBOX = {
  '1A': 'Abm', '2A': 'Ebm', '3A': 'Bbm', '4A': 'Fm', '5A': 'Cm', '6A': 'Gm',
  '7A': 'Dm', '8A': 'Am', '9A': 'Em', '10A': 'Bm', '11A': 'F#m', '12A': 'Dbm',
  '1B': 'B', '2B': 'F#', '3B': 'Db', '4B': 'Ab', '5B': 'Eb', '6B': 'Bb',
  '7B': 'F', '8B': 'C', '9B': 'G', '10B': 'D', '11B': 'A', '12B': 'E',
}

function esc(s = '') {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

// Build a file:// URL Rekordbox understands from an absolute path.
function toLocation(filePath) {
  if (!filePath) return ''
  let p = filePath.replace(/\\/g, '/')
  if (!p.startsWith('/')) p = '/' + p // Windows drive letter
  const encoded = p.split('/').map((seg) => encodeURIComponent(seg)).join('/')
  return `file://localhost${encoded}`
}

// Generate a Rekordbox-compatible collection XML (DJ_PLAYLISTS 1.0.0).
export function buildRekordboxXML(tracks) {
  const lines = []
  lines.push('<?xml version="1.0" encoding="UTF-8"?>')
  lines.push('<DJ_PLAYLISTS Version="1.0.0">')
  lines.push('  <PRODUCT Name="Angkor Key" Version="0.1.0" Company="Angkor Key"/>')
  lines.push(`  <COLLECTION Entries="${tracks.length}">`)

  tracks.forEach((t) => {
    const bpm = Number(t.tempo || 0).toFixed(2)
    const tonality = CAMELOT_REKORDBOX[t.key] || ''
    const total = Math.round(t.duration || 0)
    const loc = toLocation(t.filePath)
    lines.push(
      `    <TRACK TrackID="${t.id}" Name="${esc(t.title)}" Artist="${esc(t.artist)}" ` +
      `Genre="${esc(t.genre)}" AverageBpm="${bpm}" Tonality="${esc(tonality)}" ` +
      `TotalTime="${total}" Comments="${esc(t.comment)}" Location="${loc}">`
    )
    // Beatgrid anchor at the first downbeat.
    const inizio = Number(t.firstBeat || 0).toFixed(3)
    lines.push(`      <TEMPO Inizio="${inizio}" Bpm="${bpm}" Metro="4/4" Battito="1"/>`)
    // Cue points -> memory cues (Num=-1) + hot cues (Num 0..7).
    ;(t.cues || []).forEach((cue, i) => {
      const start = ((cue.pos || 0) * (t.duration || 0)).toFixed(3)
      lines.push(`      <POSITION_MARK Name="Cue ${i + 1}" Type="0" Start="${start}" Num="-1"/>`)
      if (i < 8) {
        lines.push(`      <POSITION_MARK Name="Cue ${i + 1}" Type="0" Start="${start}" Num="${i}"/>`)
      }
    })
    lines.push('    </TRACK>')
  })

  lines.push('  </COLLECTION>')
  lines.push('  <PLAYLISTS>')
  lines.push('    <NODE Type="0" Name="ROOT" Count="1">')
  lines.push(`      <NODE Name="Angkor Key" Type="1" KeyType="0" Entries="${tracks.length}">`)
  tracks.forEach((t) => lines.push(`        <TRACK Key="${t.id}"/>`))
  lines.push('      </NODE>')
  lines.push('    </NODE>')
  lines.push('  </PLAYLISTS>')
  lines.push('</DJ_PLAYLISTS>')
  return lines.join('\n')
}

const isDesktop = () => typeof window !== 'undefined' && window.angkorKey?.isDesktop

// Save the Rekordbox XML. Uses Electron save dialog when available, else browser download.
export async function exportRekordbox(tracks) {
  const xml = buildRekordboxXML(tracks)
  if (isDesktop()) {
    const res = await window.angkorKey.saveFile('angkorkey_rekordbox.xml', xml)
    if (res.ok) return { ok: true, message: `Saved: ${res.filePath}` }
    if (res.canceled) return { ok: false, message: 'Cancelled' }
    return { ok: false, message: res.error || 'Save failed' }
  }
  // Browser fallback
  const blob = new Blob([xml], { type: 'application/xml' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'angkorkey_rekordbox.xml'
  a.click()
  URL.revokeObjectURL(a.href)
  return { ok: true, message: 'Downloaded angkorkey_rekordbox.xml' }
}

// Write Serato/standard ID3 tags into the imported MP3 files (desktop only).
export async function exportSeratoTags(tracks) {
  if (!isDesktop()) {
    return { ok: false, message: 'ID3 writing requires the desktop app.' }
  }
  const withFiles = tracks.filter((t) => t.filePath)
  if (!withFiles.length) {
    return { ok: false, message: 'No tracks with a file path. Import audio files first.' }
  }
  let written = 0
  const errors = []
  for (const t of withFiles) {
    const seratoCues = (t.cues || []).slice(0, 8).map((cue, i) => ({
      index: i,
      name: `Cue ${i + 1}`,
      positionMs: Math.round((cue.pos || 0) * (t.duration || 0) * 1000),
    }))
    const res = await window.angkorKey.writeId3(t.filePath, {
      key: t.key,
      bpm: t.tempo,
      comment: `Camelot ${t.key} - Energy ${t.energy}`,
      artist: t.artist,
      title: t.title,
      seratoCues,
    })
    if (res.ok) written++
    else errors.push(`${t.title}: ${res.error || 'failed'}`)
  }
  return {
    ok: written > 0,
    message: `Wrote tags to ${written}/${withFiles.length} file(s).` + (errors.length ? ` Errors: ${errors.length}` : ''),
  }
}
