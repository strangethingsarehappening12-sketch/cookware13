import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../hooks/useTheme'

// Twitter/X's own embed script — loaded once via index.html — exposes this.
declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (el?: HTMLElement) => void
      }
    }
  }
}

interface TweetEmbedProps {
  /** Full tweet URL, e.g. https://x.com/vladtenev/status/1955761344390815995 */
  tweetUrl: string
  className?: string
}

/**
 * Renders a live tweet using X's official oEmbed widget, re-themed to match
 * the site's light/dark toggle.
 *
 * IMPORTANT: X's widget script replaces the <blockquote> with an iframe by
 * mutating the DOM directly — React never finds out. `widgetHostRef` below
 * is therefore a plain, permanently-childless-in-JSX div: React never
 * renders anything into it via JSX, so it never expects to reconcile its
 * contents, and it's safe to imperatively clear/rebuild it by hand on every
 * theme change without React and the widget script fighting over the same
 * nodes (which is what caused stale/duplicate widgets stacking on top of
 * each other when this used a React `key` to force a remount instead).
 */
export default function TweetEmbed({ tweetUrl, className }: TweetEmbedProps) {
  const { theme } = useTheme()
  const widgetHostRef = useRef<HTMLDivElement>(null)
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
    const host = widgetHostRef.current
    if (!host) return

    setRendered(false)
    let cancelled = false

    // Wipe out whatever the widget script previously inserted here, then
    // build a fresh, un-converted blockquote by hand for it to process.
    host.innerHTML = ''
    const blockquote = document.createElement('blockquote')
    blockquote.className = 'twitter-tweet'
    blockquote.setAttribute('data-theme', theme)
    const link = document.createElement('a')
    link.href = tweetUrl
    link.textContent = 'Loading tweet…'
    blockquote.appendChild(link)
    host.appendChild(blockquote)

    const tryRender = () => {
      if (cancelled) return
      if (window.twttr?.widgets) {
        window.twttr.widgets.load(host)
        setRendered(true)
      } else {
        // widgets.js loads async — poll briefly until it's ready.
        setTimeout(tryRender, 200)
      }
    }
    tryRender()

    return () => {
      cancelled = true
    }
  }, [tweetUrl, theme])

  return (
    <div className={className}>
      {!rendered && (
        <div className="rounded-2xl border-[3px] border-ink bg-cream p-6 text-sm text-ink/50">
          Loading tweet…
        </div>
      )}
      <div ref={widgetHostRef} />
    </div>
  )
}
