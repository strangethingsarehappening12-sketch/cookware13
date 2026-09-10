import { useRef, useState } from 'react'

interface ReminderCardProps {
  reminders: number
  pitches: number
}

export default function ReminderCard({ reminders, pitches }: ReminderCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'idle' | 'capturing'>('idle')

  const handleScreenshot = async () => {
    if (!cardRef.current || status === 'capturing') return
    setStatus('capturing')

    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // sharper output for sharing
        ignoreElements: (el) => el.getAttribute('data-screenshot-ignore') === 'true',
      })

      const dataUrl = canvas.toDataURL('image/png')

      // On mobile, try the native share sheet first — lets people share
      // straight into the X/Twitter app instead of just downloading a file.
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
          // Share was cancelled or unsupported mid-flight — fall through to download.
        }
      }

      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `cookware-reminder-${reminders}.png`
      link.click()
    } catch (err) {
      console.error('Screenshot failed', err)
    } finally {
      setStatus('idle')
    }
  }

  return (
    <div
      ref={cardRef}
      className="mx-auto max-w-xl rounded-3xl border-[3px] border-ink bg-white p-8 shadow-thick sm:p-12"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border-2 border-ink px-4 py-3 text-center">
          <p className="font-display text-2xl font-bold">{reminders}</p>
          <p className="font-mono text-[11px] text-ink/60">REMINDER{reminders === 1 ? '' : 'S'}</p>
        </div>
        <div className="rounded-xl border-2 border-ink px-4 py-3 text-center">
          <p className="font-display text-2xl font-bold">{pitches}</p>
          <p className="font-mono text-[11px] text-ink/60">PITCH{pitches === 1 ? '' : 'ES'}</p>
        </div>
      </div>

      <p className="mt-6 font-display text-xl font-semibold sm:text-2xl">
        Vlad, it's time to pitch tokenized Cookware.
      </p>

      <button
        onClick={handleScreenshot}
        disabled={status === 'capturing'}
        data-screenshot-ignore="true"
        className="mt-6 rounded-full border-[3px] border-ink bg-clay px-6 py-3 font-display text-sm font-bold text-cream shadow-thickSm transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 sm:text-base"
      >
        {status === 'capturing' ? 'CAPTURING…' : '📸 SCREENSHOT TO SHARE'}
      </button>
    </div>
  )
}
