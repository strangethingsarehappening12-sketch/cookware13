// A tiny synthesized "cha-ching" chime using the Web Audio API — no audio
// file to load, no network dependency, no licensing to worry about.
//
// IMPORTANT: only ONE AudioContext is created, lazily, and reused for every
// call. Browsers cap how many concurrent AudioContexts a page can have —
// creating a fresh one per click (the original version of this file) works
// for a handful of clicks, then silently stops producing sound once that
// cap is hit.
let sharedCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (sharedCtx) return sharedCtx
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    sharedCtx = new AudioCtx()
    return sharedCtx
  } catch {
    return null
  }
}

export function playChaChing() {
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    // Some browsers create contexts in a suspended state, or auto-suspend
    // them after a period of inactivity — resume is a no-op if already running.
    if (ctx.state === 'suspended') ctx.resume()

    const now = ctx.currentTime

    const playNote = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, now + start)
      gain.gain.setValueAtTime(0.0001, now + start)
      gain.gain.exponentialRampToValueAtTime(0.25, now + start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + start)
      osc.stop(now + start + duration + 0.02)
    }

    // Two quick ascending notes — a bright little "coin register" chime.
    playNote(1046.5, 0, 0.12) // C6
    playNote(1568.0, 0.09, 0.22) // G6
  } catch {
    // Not critical to the UX — fail silently rather than break the click.
  }
}
