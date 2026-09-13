import { useEffect, useState } from 'react'
import { cookwareConfig, getPriceHistory, PriceHistorySnapshot, PricePoint } from '../config'

function formatPrice(price: number): string {
  if (price >= 1) return `$${price.toFixed(2)}`
  // Small memecoin prices need more precision — show enough significant digits.
  return `$${price.toPrecision(3)}`
}

function CandlestickChart({ points }: { points: PricePoint[] }) {
  const width = 600
  const height = 200
  const paddingY = 10
  const gap = 2 // gap between candles, in px

  const highs = points.map((p) => p.high)
  const lows = points.map((p) => p.low)
  const min = Math.min(...lows)
  const max = Math.max(...highs)
  const range = max - min || 1

  const candleWidth = width / points.length
  const bodyWidth = Math.max(1, candleWidth - gap)

  const yFor = (value: number) =>
    height - paddingY - ((value - min) / range) * (height - paddingY * 2)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
      {points.map((p, i) => {
        const isUp = p.close >= p.open
        const color = isUp ? '#00C805' : '#E8560F'
        const x = i * candleWidth + candleWidth / 2

        const bodyTop = yFor(Math.max(p.open, p.close))
        const bodyBottom = yFor(Math.min(p.open, p.close))
        const bodyHeight = Math.max(1.5, bodyBottom - bodyTop)

        return (
          <g key={p.time}>
            {/* wick: full high-low range */}
            <line
              x1={x}
              x2={x}
              y1={yFor(p.high)}
              y2={yFor(p.low)}
              stroke={color}
              strokeWidth={1}
            />
            {/* body: open-close range */}
            <rect
              x={x - bodyWidth / 2}
              y={bodyTop}
              width={bodyWidth}
              height={bodyHeight}
              fill={color}
            />
          </g>
        )
      })}
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
          ? 'Live from GeckoTerminal · last 48 hours, 1h candles'
          : snapshot.error ?? 'Loading price history…'}
      </p>
      <div className="mt-6">
        {snapshot.points.length > 1 ? (
          <CandlestickChart points={snapshot.points} />
        ) : (
          <div className="flex h-40 items-center justify-center rounded-2xl border-2 border-ink/20 text-sm text-ink/40">
            No chart data yet
          </div>
        )}
      </div>
    </div>
  )
}
