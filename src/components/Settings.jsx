import React, { useEffect, useState } from 'react'
import {
  UserCog, MessageSquare, Tag, Bookmark, FileText, Music2,
  Gauge, Headphones, Monitor, Piano, Check, ExternalLink,
} from 'lucide-react'

const SECTIONS = [
  ['personalize', 'Personalize Your Copy', UserCog],
  ['feedback', 'Send Feedback', MessageSquare],
  ['tags', 'Update Tags', Tag],
  ['cues', 'Export Cue Points', Bookmark],
  ['rename', 'Rename Files', FileText],
  ['notation', 'Key Notation', Music2],
  ['tempo', 'Tempo', Gauge],
  ['player', 'Audio Player', Headphones],
  ['display', 'Display Options', Monitor],
  ['midi', 'MIDI Settings', Piano],
]

const DEFAULTS = {
  vipCode: '',
  validated: false,
  analytics: true,
  feedback: '',
  updateCommonTags: true,
  whatToWrite: 'keyEnergyWord',
  whereToWrite: 'beforeComments',
  customInitialKey: true,
  energyInGrouping: false,
  updateTempoTag: false,
  keepExistingTempo: false,
  customEnergyLevel: true,
  cueFormat: 'rekordbox',
  renamePattern: '{artist} - {title} - {key}',
  notation: 'camelot',
  tempoRange: 'half',
  detectTempo: true,
  autoplay: true,
  preGain: 0,
  cuePreview: 2,
  density: 'comfortable',
  showWaveform: true,
  showBeatgrid: false,
  midiInput: 'none',
  midiSync: false,
}

function load() {
  try {
    const raw = localStorage.getItem('ak-settings')
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {}
  return DEFAULTS
}

// ---- Reusable bits -------------------------------------------------
const Title = ({ children }) => (
  <h2 className="text-[22px] font-semibold text-ink dark:text-white mb-6">{children}</h2>
)
const Group = ({ label }) => (
  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 mt-8 first:mt-0">{label}</div>
)
const Hint = ({ children }) => (
  <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">{children}</p>
)
const Link = ({ children }) => (
  <button className="text-[11px] font-bold uppercase tracking-wide text-brand bg-brand/10 hover:bg-brand/20 px-2.5 py-1 rounded transition-colors">{children}</button>
)

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <span
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-brand' : 'bg-slate-300 dark:bg-slate-600'}`}
      >
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </span>
      {label && <span className="text-[14px] text-ink dark:text-slate-200">{label}</span>}
    </label>
  )
}

function Check2({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <span
        onClick={() => onChange(!checked)}
        className={`grid place-items-center w-[18px] h-[18px] rounded border transition-colors ${checked ? 'bg-brand border-brand text-white' : 'border-slate-300 dark:border-slate-600'}`}
      >
        {checked && <Check size={13} strokeWidth={3} />}
      </span>
      <span className="text-[14px] text-ink dark:text-slate-200">{label}</span>
    </label>
  )
}

const field = 'rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f141d] px-3 py-2 text-[13px] text-ink dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand/40'

function Radio({ value, current, onChange, label, hint }) {
  const active = value === current
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <span className={`mt-0.5 grid place-items-center w-[18px] h-[18px] rounded-full border-2 transition-colors ${active ? 'border-brand' : 'border-slate-300 dark:border-slate-600'}`}>
        {active && <span className="w-2 h-2 rounded-full bg-brand" />}
      </span>
      <span>
        <span className="text-[14px] text-ink dark:text-slate-200">{label}</span>
        {hint && <span className="block text-[12px] text-slate-400">{hint}</span>}
      </span>
      <input type="radio" className="hidden" checked={active} onChange={() => onChange(value)} />
    </label>
  )
}

// ---- Panels --------------------------------------------------------
function Panel({ id, s, set }) {
  switch (id) {
    case 'personalize':
      return (
        <>
          <Title>Personalize Your Copy</Title>
          <div className="flex items-end gap-3 max-w-xl">
            <div className="flex-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Your VIP Code</label>
              <input
                value={s.vipCode}
                onChange={(e) => set({ vipCode: e.target.value, validated: false })}
                className="w-full border-0 border-b border-slate-300 dark:border-slate-600 bg-transparent py-2 text-[14px] text-ink dark:text-slate-100 outline-none focus:border-brand"
                placeholder="VIP CODE"
              />
            </div>
            <button
              onClick={() => set({ validated: !!s.vipCode })}
              className="flex items-center gap-1.5 rounded-lg bg-brand hover:bg-brand-dark text-white px-4 py-2 text-[13px] font-semibold transition-colors"
            >
              <Check size={15} /> Validate
            </button>
          </div>
          {s.validated && <Hint>VIP code applied. Thank you!</Hint>}
          <div className="flex gap-2 mt-3">
            <Link>Look up my VIP code</Link>
            <Link>Contact us</Link>
          </div>

          <Group label="Privacy" />
          <Check2 checked={s.analytics} onChange={(v) => set({ analytics: v })} label="Send analytics to Angkor Key" />
          <Hint>Help improve Angkor Key by automatically sending diagnostic and usage data. Diagnostic data is collected anonymously and cannot be used to identify you.</Hint>
          <div className="mt-3"><Link>Privacy policy</Link></div>
        </>
      )
    case 'feedback':
      return (
        <>
          <Title>Send Feedback</Title>
          <Hint>Tell us what you love or what could be better. We read every message.</Hint>
          <textarea
            value={s.feedback}
            onChange={(e) => set({ feedback: e.target.value })}
            rows={6}
            placeholder="Your feedback…"
            className={`${field} w-full max-w-xl mt-4 resize-none`}
          />
          <div className="mt-3">
            <button className="rounded-lg bg-brand hover:bg-brand-dark text-white px-4 py-2 text-[13px] font-semibold transition-colors">Send feedback</button>
          </div>
        </>
      )
    case 'tags': {
      const WHAT = [
        ['key', 'The key', '10A'],
        ['energyWord', 'The energy level with the word "Energy"', 'Energy 7'],
        ['keyEnergyWord', 'The key and energy level with the word "Energy"', '10A - Energy 7'],
        ['energy', 'The energy level', '7'],
        ['keyEnergy', 'The key and energy level', '10A - 7'],
        ['keyTempo', 'The key and tempo', '10A - 126'],
      ]
      const WHERE = [
        ['beforeArtist', 'Before artist name', '10A - Axwell'],
        ['beforeSong', 'Before song name', '10A - Feel The Vibe'],
        ['afterSong', 'After song name', 'Feel The Vibe - 10A'],
        ['beforeComments', 'Before comments', '10A - www.beatport.com'],
        ['overwriteComments', 'Overwrite comments', '10A'],
      ]
      const disabled = !s.updateCommonTags
      return (
        <>
          <Title>Update Tags</Title>
          <Check2 checked={s.updateCommonTags} onChange={(v) => set({ updateCommonTags: v })} label="Update common tags" />

          <div className={disabled ? 'opacity-40 pointer-events-none' : ''}>
            <Group label="What to write" />
            <div className="space-y-2.5">
              {WHAT.map(([val, label, ex]) => (
                <Radio key={val} value={val} current={s.whatToWrite} onChange={(v) => set({ whatToWrite: v })} label={label} hint={`Example: ${ex}`} />
              ))}
            </div>

            <Group label="Where to write it" />
            <div className="space-y-2.5">
              {WHERE.map(([val, label, ex]) => (
                <Radio key={val} value={val} current={s.whereToWrite} onChange={(v) => set({ whereToWrite: v })} label={label} hint={`Example: ${ex}`} />
              ))}
            </div>

            <div className="mt-8 space-y-4">
              <div>
                <Check2 checked={s.customInitialKey} onChange={(v) => set({ customInitialKey: v })} label='Update custom "Initial Key" tag (viewable in Serato, Traktor, etc.)' />
                <p className="text-[12px] text-brand ml-[30px] mt-0.5">Store the song key in the tag's dedicated key field</p>
              </div>
              <div>
                <Check2 checked={s.energyInGrouping} onChange={(v) => set({ energyInGrouping: v })} label='Write Energy Level in front of the Grouping' />
                <p className="text-[12px] text-brand ml-[30px] mt-0.5">Example: "7 - Old School"</p>
              </div>
              <div>
                <Check2 checked={s.updateTempoTag} onChange={(v) => set({ updateTempoTag: v })} label="Update Tempo Tag" />
                <div className={`ml-[30px] mt-1.5 ${s.updateTempoTag ? '' : 'opacity-40 pointer-events-none'}`}>
                  <Check2 checked={s.keepExistingTempo} onChange={(v) => set({ keepExistingTempo: v })} label="Keep existing tempo values" />
                </div>
              </div>
              <div>
                <Check2 checked={s.customEnergyLevel} onChange={(v) => set({ customEnergyLevel: v })} label='Update custom "Energy Level" tag' />
                <p className="text-[12px] text-brand ml-[30px] mt-0.5">Stores the energy level in a dedicated field</p>
              </div>
            </div>
          </div>
        </>
      )
    }
    case 'cues':
      return (
        <>
          <Title>Export Cue Points</Title>
          <Hint>Select the DJ software format used when exporting cue points.</Hint>
          <div className="space-y-3 mt-5 max-w-md">
            <Radio value="rekordbox" current={s.cueFormat} onChange={(v) => set({ cueFormat: v })} label="Rekordbox" hint="XML collection with memory cues & hot cues" />
            <Radio value="serato" current={s.cueFormat} onChange={(v) => set({ cueFormat: v })} label="Serato" hint="ID3 GEOB Markers2 hot-cue tags" />
            <Radio value="traktor" current={s.cueFormat} onChange={(v) => set({ cueFormat: v })} label="Traktor" hint="NML collection" />
          </div>
        </>
      )
    case 'rename':
      return (
        <>
          <Title>Rename Files</Title>
          <Hint>Define the filename pattern. Available tokens: {'{artist} {title} {key} {tempo} {energy}'}</Hint>
          <input value={s.renamePattern} onChange={(e) => set({ renamePattern: e.target.value })} className={`${field} w-full max-w-xl mt-4`} />
          <Hint>Example: <span className="font-mono text-ink dark:text-slate-200">Daft Punk - One More Time - 8A.mp3</span></Hint>
        </>
      )
    case 'notation':
      return (
        <>
          <Title>Key Notation</Title>
          <Hint>How musical keys are displayed throughout the app.</Hint>
          <div className="space-y-3 mt-5 max-w-md">
            <Radio value="camelot" current={s.notation} onChange={(v) => set({ notation: v })} label="Camelot" hint="8A, 9B, 12A…" />
            <Radio value="open" current={s.notation} onChange={(v) => set({ notation: v })} label="Open Key" hint="1m, 2d…" />
            <Radio value="musical" current={s.notation} onChange={(v) => set({ notation: v })} label="Musical" hint="Am, C, F#m…" />
          </div>
        </>
      )
    case 'tempo':
      return (
        <>
          <Title>Tempo</Title>
          <Check2 checked={s.detectTempo} onChange={(v) => set({ detectTempo: v })} label="Detect tempo automatically on import" />
          <Group label="BPM Range" />
          <div className="space-y-3 max-w-md">
            <Radio value="half" current={s.tempoRange} onChange={(v) => set({ tempoRange: v })} label="Smart range" hint="Auto half/double-time detection" />
            <Radio value="full" current={s.tempoRange} onChange={(v) => set({ tempoRange: v })} label="Full range" hint="60 – 200 BPM" />
          </div>
        </>
      )
    case 'player':
      return (
        <>
          <Title>Audio Player</Title>
          <div className="space-y-4">
            <Toggle checked={s.autoplay} onChange={(v) => set({ autoplay: v })} label="Autoplay when selecting a track" />
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Pre-gain: {s.preGain > 0 ? '+' : ''}{s.preGain} dB</label>
              <input type="range" min="-12" max="12" value={s.preGain} onChange={(e) => set({ preGain: Number(e.target.value) })} className="w-full max-w-md accent-brand block mt-1" />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Cue preview length: {s.cuePreview}s</label>
              <input type="range" min="1" max="8" value={s.cuePreview} onChange={(e) => set({ cuePreview: Number(e.target.value) })} className="w-full max-w-md accent-brand block mt-1" />
            </div>
          </div>
        </>
      )
    case 'display':
      return (
        <>
          <Title>Display Options</Title>
          <Group label="Density" />
          <div className="space-y-3 max-w-md">
            <Radio value="comfortable" current={s.density} onChange={(v) => set({ density: v })} label="Comfortable" />
            <Radio value="compact" current={s.density} onChange={(v) => set({ density: v })} label="Compact" />
          </div>
          <Group label="Player" />
          <div className="space-y-4">
            <Toggle checked={s.showWaveform} onChange={(v) => set({ showWaveform: v })} label="Show waveform" />
            <Toggle checked={s.showBeatgrid} onChange={(v) => set({ showBeatgrid: v })} label="Show beatgrid overlay" />
          </div>
        </>
      )
    case 'midi':
      return (
        <>
          <Title>MIDI Settings</Title>
          <Hint>Connect a MIDI controller to trigger cues and transport.</Hint>
          <div className="mt-5 max-w-md space-y-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400 block mb-1">MIDI input device</label>
              <select value={s.midiInput} onChange={(e) => set({ midiInput: e.target.value })} className={`${field} w-full`}>
                <option value="none">No device</option>
                <option value="auto">Auto-detect</option>
              </select>
            </div>
            <Toggle checked={s.midiSync} onChange={(v) => set({ midiSync: v })} label="Send MIDI clock sync" />
          </div>
        </>
      )
    default:
      return null
  }
}

export default function Settings() {
  const [active, setActive] = useState('personalize')
  const [s, setS] = useState(load)

  useEffect(() => {
    localStorage.setItem('ak-settings', JSON.stringify(s))
  }, [s])

  const set = (patch) => setS((prev) => ({ ...prev, ...patch }))

  return (
    <div className="flex-1 min-h-0 flex">
      {/* Section nav */}
      <div className="w-60 shrink-0 border-r border-slate-100 dark:border-slate-800 overflow-y-auto scroll-thin py-2">
        {SECTIONS.map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-[13px] font-medium transition-colors ${
              active === id
                ? 'bg-brand/10 text-brand border-r-2 border-brand'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scroll-thin p-8">
        <Panel id={active} s={s} set={set} />
      </div>
    </div>
  )
}
