import { useRef, useState } from 'react'

interface ReminderCardProps {
  reminders: number
  pitches: number
}

type ActionStatus = 'idle' | 'sharing' | 'downloading'

export default function ReminderCard({ reminders, pitches }: ReminderCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<ActionStatus>('idle')

  // Renders just the card (border, background, counters, text) to a canvas —
  // the buttons themselves are excluded via the data-screenshot-ignore tag.
  const captureCard = async () => {
    if (!cardRef.current) return null
    const { default: html2canvas } = await import('html2canvas')
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: '#ffffff',
      scale: 2, // sharper output for sharing/downloading
      ignoreElements: (el) => el.getAttribute('data-screenshot-ignore') === 'true',
    })
    return canvas
  }

  const handleShare = async () => {
    if (status !== 'idle') return
    setStatus('sharing')
    try {
      const canvas = await captureCard()
      if (!canvas) return
      const dataUrl = canvas.toDataURL('image/png')

      if (navigator.share && navigator.canShare) {
        try {
          const blob = await (await fetch(dataUrl)).blob()
          const file = new File([blob], 'cookware-reminder.png', { type: 'image/png' })
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              text: "Vlad, it's time to pitch tokenized Cookware. 🍳",
            })
            return
          }
        } catch {
          // Share was cancelled or unsupported mid-flight — fall through.
        }
      }

      // No native share sheet available (most desktop browsers) — download
      // the image so it's ready to attach, and open a pre-filled X compose
      // tab so posting is still one step away instead of a dead end.
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `cookware-reminder-${reminders}.png`
      link.click()

      const tweetText = encodeURIComponent("Vlad, it's time to pitch tokenized Cookware. 🍳")
      window.open(`https://x.com/intent/post?text=${tweetText}`, '_blank', 'noopener,noreferrer')
    } catch (err) {
      console.error('Share failed', err)
    } finally {
      setStatus('idle')
    }
  }

  const handleDownload = async () => {
    if (status !== 'idle') return
    setStatus('downloading')
    try {
      const canvas = await captureCard()
      if (!canvas) return
      const dataUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `cookware-reminder-${reminders}.png`
      link.click()
    } catch (err) {
      console.error('Download failed', err)
    } finally {
      setStatus('idle')
    }
  }

  return (
    <div
      ref={cardRef}
      className="relative mx-auto max-w-xl overflow-hidden rounded-3xl border-[3px] border-ink bg-white p-8 shadow-thick sm:p-12"
    >
      <img
        src="/cookware-logo.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 w-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.08]"
      />

      <div className="relative z-10 grid grid-cols-2 gap-4">
        <div className="rounded-xl border-2 border-ink px-4 py-3 text-center">
          <p className="font-display text-2xl font-bold">{reminders}</p>
          <p className="font-mono text-[11px] text-ink/60">REMINDER{reminders === 1 ? '' : 'S'}</p>
        </div>
        <div className="rounded-xl border-2 border-ink px-4 py-3 text-center">
          <p className="font-display text-2xl font-bold">{pitches}</p>
          <p className="font-mono text-[11px] text-ink/60">PITCH{pitches === 1 ? '' : 'ES'}</p>
        </div>
      </div>

      <p className="relative z-10 mt-6 font-display text-xl font-semibold sm:text-2xl">
        Vlad, it's time to pitch tokenized Cookware.
      </p>

      <div data-screenshot-ignore="true" className="relative z-10 mt-6 flex flex-wrap gap-3">
        <button
          onClick={handleShare}
          disabled={status !== 'idle'}
          className="rounded-full border-[3px] border-ink bg-clay px-6 py-3 font-display text-sm font-bold text-cream shadow-thickSm transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 sm:text-base"
        >
          {status === 'sharing' ? 'SHARING…' : '📤 SHARE'}
        </button>
        <button
          onClick={handleDownload}
          disabled={status !== 'idle'}
          className="rounded-full border-[3px] border-ink bg-white px-6 py-3 font-display text-sm font-bold text-ink shadow-thickSm transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 sm:text-base"
        >
          {status === 'downloading' ? 'SAVING…' : '⬇️ DOWNLOAD'}
        </button>
      </div>
    </div>
  )
}
