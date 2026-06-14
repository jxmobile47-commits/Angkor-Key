// Web Audio processing chain for a DJ deck.
//
// Provides two real DJ-style features for imported (real) audio:
//   1. 3-band kill EQ — Low / Mid / High bands can each be cut to silence,
//      exactly like the kill switches on a DJ mixer.
//   2. Acapella mode — isolates the vocal range by extracting the centre
//      channel (where vocals usually sit) and band-passing it to the vocal
//      frequency band, while muting the full "instrumental" signal. This is a
//      DSP approximation (true stem separation needs ML), but it gives the
//      authentic "drop the beat, keep the vocal" feel of a modern controller.

let sharedCtx = null

export function getAudioContext() {
  if (!sharedCtx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    sharedCtx = new AC()
  }
  return sharedCtx
}

const KILL_DB = -60 // effectively silent

export function createDeckChain(audioEl) {
  const ctx = getAudioContext()
  if (!ctx || !audioEl) return null

  let source
  try {
    source = ctx.createMediaElementSource(audioEl)
  } catch (e) {
    // A source can only be created once per element.
    console.warn('createMediaElementSource failed', e)
    return null
  }

  // --- Dry bus: full track through a 3-band kill EQ ---
  const low = ctx.createBiquadFilter()
  low.type = 'lowshelf'; low.frequency.value = 200; low.gain.value = 0
  const mid = ctx.createBiquadFilter()
  mid.type = 'peaking'; mid.frequency.value = 1000; mid.Q.value = 0.9; mid.gain.value = 0
  const high = ctx.createBiquadFilter()
  high.type = 'highshelf'; high.frequency.value = 4000; high.gain.value = 0
  const dryGain = ctx.createGain(); dryGain.gain.value = 1

  source.connect(low); low.connect(mid); mid.connect(high); high.connect(dryGain)

  // --- Acapella bus: centre extraction + vocal band-pass ---
  const splitter = ctx.createChannelSplitter(2)
  const monoMix = ctx.createGain(); monoMix.gain.value = 0.5
  source.connect(splitter)
  splitter.connect(monoMix, 0)
  splitter.connect(monoMix, 1)
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 180; hp.Q.value = 0.7
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200; lp.Q.value = 0.7
  const presence = ctx.createBiquadFilter(); presence.type = 'peaking'; presence.frequency.value = 2500; presence.Q.value = 1; presence.gain.value = 5
  const acaGain = ctx.createGain(); acaGain.gain.value = 0
  monoMix.connect(hp); hp.connect(lp); lp.connect(presence); presence.connect(acaGain)

  // --- Master ---
  const master = ctx.createGain(); master.gain.value = 1
  dryGain.connect(master); acaGain.connect(master)
  master.connect(ctx.destination)

  const bandNode = (band) => (band === 'low' ? low : band === 'mid' ? mid : high)

  return {
    ctx,
    setBand(band, killed) {
      bandNode(band).gain.setTargetAtTime(killed ? KILL_DB : 0, ctx.currentTime, 0.02)
    },
    setAcapella(on) {
      dryGain.gain.setTargetAtTime(on ? 0 : 1, ctx.currentTime, 0.03)
      acaGain.gain.setTargetAtTime(on ? 1 : 0, ctx.currentTime, 0.03)
    },
    resume() { if (ctx.state === 'suspended') ctx.resume() },
  }
}
