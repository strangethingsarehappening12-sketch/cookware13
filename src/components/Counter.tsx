import { useEffect, useState } from 'react'

interface CounterProps {
  label: string
  value: number
  accent?: boolean
  prefix?: string
  /** Custom formatter for the displayed number (e.g. compact "$1bn"). Overrides prefix. */
  formatValue?: (value: number) => string
  /** Use a smaller value font — for longer text values that would otherwise overflow the card. */
  compact?: boolean
}

export default function Counter({
  label,
  value,
  accent = false,
  prefix = '',
  formatValue,
  compact = false,
}: CounterProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const [bump, setBump] = useState(false)

  useEffect(() => {
    if (value === displayValue) return
    setBump(true)
    setDisplayValue(value)
    const t = setTimeout(() => setBump(false), 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div
      className={`rounded-2xl border-[3px] border-ink bg-white px-6 py-8 shadow-thick transition-transform ${
        bump ? 'scale-[1.03]' : 'scale-100'
      }`}
    >
      <p className="font-mono text-xs tracking-wide text-ink/60">{label}</p>
      <p
        key={displayValue}
        className={`animate-count mt-2 font-display font-bold tabular-nums ${
          compact ? 'text-3xl sm:text-4xl' : 'text-5xl sm:text-6xl'
        } ${accent ? 'text-clay' : 'text-ink'}`}
      >
        {prefix}
        {formatValue ? formatValue(displayValue) : displayValue.toLocaleString()}
      </p>
    </div>
  )
}
