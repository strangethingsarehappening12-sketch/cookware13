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
 * Renders a live tweet using X's official oEmbed widget, fixed to dark
 * theme (the site itself is dark-only now).
 *
 * widgetHostRef is a plain div that React never renders children into via
 * JSX — X's widget script replaces content by mutating the DOM directly,
 * outside React's knowledge, so this container is built and updated by
 * hand instead of relying on React to reconcile it.
 */
export default function TweetEmbed({ tweetUrl, className }: TweetEmbedProps) {
  const widgetHostRef = useRef<HTMLDivElement>(null)
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
    const host = widgetHostRef.current
    if (!host) return

    let cancelled = false
    host.innerHTML = ''
    const blockquote = document.createElement('blockquote')
    blockquote.className = 'twitter-tweet'
    blockquote.setAttribute('data-theme', 'dark')
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
  }, [tweetUrl])

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
