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
 * Renders a live tweet using X's official oEmbed widget.
 * The widget replaces the <blockquote> with the real, up-to-date tweet
 * (text, media, like/reply counts) and makes it clickable — clicking
 * anywhere on it opens the tweet on x.com (or the X app, on mobile,
 * if installed) in a new tab, exactly like any embedded tweet on the web.
 *
 * Themed to match the site: X's widget only picks up data-theme at the
 * moment it converts the <blockquote> into an iframe, so toggling theme
 * later needs a genuinely fresh <blockquote> (the `key={theme}` below)
 * for the re-render to actually take effect.
 */
export default function TweetEmbed({ tweetUrl, className }: TweetEmbedProps) {
  const { theme } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
    setRendered(false)
    let cancelled = false

    const tryRender = () => {
      if (cancelled) return
      if (window.twttr?.widgets) {
        window.twttr.widgets.load(containerRef.current ?? undefined)
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
    <div ref={containerRef} className={className}>
      {!rendered && (
        <div className="rounded-2xl border-[3px] border-ink bg-cream p-6 text-sm text-ink/50">
          Loading tweet…
        </div>
      )}
      <blockquote key={theme} className="twitter-tweet" data-theme={theme}>
        <a href={tweetUrl}>Loading tweet…</a>
      </blockquote>
    </div>
  )
}
