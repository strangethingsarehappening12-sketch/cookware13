import { useState } from 'react'
import { isSoundEnabled, setSoundEnabled } from '../lib/sounds'

export default function SoundToggle() {
  const [enabled, setEnabled] = useState(isSoundEnabled)

  const handleClick = () => {
    const next = !enabled
    setSoundEnabled(next)
    setEnabled(next)
  }

  return (
    <button
      onClick={handleClick}
      aria-label={enabled ? 'Mute sound' : 'Unmute sound'}
      className="flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-ink bg-cream text-ink transition-transform hover:-translate-y-0.5 active:translate-y-0"
    >
      {enabled ? (
        // Speaker with sound waves
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="4,9 8,9 12,5 12,19 8,15 4,15" fill="currentColor" stroke="none" />
          <path d="M16 8a5 5 0 010 8M18.5 5.5a9 9 0 010 13" />
        </svg>
      ) : (
        // Speaker with a slash (muted)
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="4,9 8,9 12,5 12,19 8,15 4,15" fill="currentColor" stroke="none" />
          <line x1="16" y1="8" x2="22" y2="14" />
          <line x1="22" y1="8" x2="16" y2="14" />
        </svg>
      )}
    </button>
  )
}
