import { useEffect, useState } from 'react'
import { cookwareConfig, getPriceHistory, PriceHistorySnapshot } from '../config'

function formatPrice(price: number): string {
  if (price >= 1) return `$${price.toFixed(2)}`
  // Small memecoin prices need more precision — show enough significant digits.
  return `$${price.toPrecision(3)}`
}

function Sparkline({ points }: { points: { time: number; price: number }[] }) {
  const width = 600
  const height = 160
  const padding = 8

  const prices = points.map((p) => p.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = max - min || 1

  const coords = points.map((p, i) => {
    const x = padding + (i / (points.length - 1 || 1)) * (width - padding * 2)
    const y = height - padding - ((p.price - min) / range) * (height - padding * 2)
    return [x, y] as const
  })

  const linePath = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ')
  const areaPath = `${linePath} L${coords[coords.length - 1][0]},${height} L${coords[0][0]},${height} Z`

  const isUp = prices[prices.length - 1] >= prices[0]

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkline-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00C805" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#00C805" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sparkline-fill)" />
      <path
        d={linePath}
        fill="none"
        stroke={isUp ? '#00C805' : '#E8560F'}
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function PriceChart() {
  const [snapshot, setSnapshot] = useState<PriceHistorySnapshot>({
    points: [],
    currentPrice: null,
    isLive: false,
  })

  useEffect(() => {
    let cancelled = false

    const poll = () => {
      getPriceHistory().then((snap) => {
        if (!cancelled) setSnapshot(snap)
      })
    }

    poll()
    const id = setInterval(poll, cookwareConfig.pollIntervalMs)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  return (
    <div className="rounded-3xl border-[3px] border-ink bg-cream p-8 shadow-thick sm:p-12">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-3xl font-bold sm:text-4xl">$COOKWARE PRICE</h2>
        {snapshot.isLive && snapshot.currentPrice !== null && (
          <p className="font-display text-2xl font-bold text-clay">
            {formatPrice(snapshot.currentPrice)}
          </p>
        )}
      </div>
      <p className="mt-2 text-sm text-ink/60">
        {snapshot.isLive
          ? 'Live from GeckoTerminal · last 48 hours'
          : snapshot.error ?? 'Loading price history…'}
      </p>
      <div className="mt-6">
        {snapshot.points.length > 1 ? (
          <Sparkline points={snapshot.points} />
        ) : (
          <div className="flex h-40 items-center justify-center rounded-2xl border-2 border-ink/20 text-sm text-ink/40">
            No chart data yet
          </div>
        )}
      </div>
    </div>
  )
}
