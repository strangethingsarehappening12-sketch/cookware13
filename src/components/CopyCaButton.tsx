import { useState } from 'react'

interface CopyCaButtonProps {
  address: string
}

export default function CopyCaButton({ address }: CopyCaButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address)
    } catch {
      // Clipboard API unavailable — fail silently, nothing else to fall back to here.
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={handleCopy}
        className="rounded-full border-[3px] border-ink bg-cream px-8 py-4 font-display text-lg font-bold text-ink shadow-thick transition-transform hover:-translate-y-0.5 active:translate-y-0"
      >
        {copied ? 'COPIED!' : 'COPY CA'}
      </button>
      {copied && (
        <span className="absolute -top-9 left-1/2 -translate-x-1/2 rounded-full border-2 border-ink bg-clay px-3 py-1 font-mono text-xs text-cream shadow-thickSm">
          Copied!
        </span>
      )}
    </div>
  )
}
