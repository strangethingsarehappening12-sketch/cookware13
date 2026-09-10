import { useEffect, useRef, useState } from 'react'

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
 */
export default function TweetEmbed({ tweetUrl, className }: TweetEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
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
  }, [tweetUrl])

  return (
    <div ref={containerRef} className={className}>
      {!rendered && (
        <div className="rounded-2xl border-[3px] border-ink bg-white p-6 text-sm text-ink/50">
          Loading tweet…
        </div>
      )}
      <blockquote className="twitter-tweet" data-theme="light">
        <a href={tweetUrl}>Loading tweet…</a>
      </blockquote>
    </div>
  )
}
