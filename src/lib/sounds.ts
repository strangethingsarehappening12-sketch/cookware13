// A tiny synthesized "cha-ching" chime using the Web Audio API — no audio
// file to load, no network dependency, no licensing to worry about.
export function playChaChing() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    const ctx = new AudioCtx()
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
    // Web Audio unavailable (rare) — not critical, fail silently.
  }
}
