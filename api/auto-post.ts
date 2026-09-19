import { Redis } from '@upstash/redis'
import crypto from 'crypto'
import OAuth from 'oauth-1.0a'
import type { VercelRequest, VercelResponse } from '@vercel/node'

// Self-contained deliberately (no local './_lib' imports) — matching the
// exact pattern already proven to work in api/reminders.ts.
const redis = new Redis({
  url: process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? '',
  token: process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? '',
})

const COUNTER_KEY = 'cookware:remind-vlad:count'
const SITE_URL = 'https://cookwarehood.xyz'

// This route is meant to be called by an EXTERNAL scheduler (e.g.
// cron-job.org), not Vercel's own built-in cron — so there's no automatic
// CRON_SECRET here. Instead, the caller must send a custom shared secret
// (set as AUTOPOST_SECRET in Vercel's env vars) in an x-autopost-secret
// header, or anyone who finds this URL could trigger a real tweet.
function isAuthorized(req: VercelRequest): boolean {
  const expected = process.env.AUTOPOST_SECRET
  const provided = req.headers['x-autopost-secret']
  return Boolean(expected) && provided === expected
}

const oauth = new OAuth({
  consumer: {
    key: process.env.X_API_KEY ?? '',
    secret: process.env.X_API_KEY_SECRET ?? '',
  },
  signature_method: 'HMAC-SHA1',
  hash_function(baseString, key) {
    return crypto.createHmac('sha1', key).update(baseString).digest('base64')
  },
})

const token = {
  key: process.env.X_ACCESS_TOKEN ?? '',
  secret: process.env.X_ACCESS_TOKEN_SECRET ?? '',
}

function buildTweetText(reminders: number): string {
  // Pitches isn't tracked server-side yet — reported as 0 honestly rather
  // than fabricated, until real pitch tracking exists.
  return [
    `🍳 ${reminders.toLocaleString()} reminders sent to Vlad.`,
    '',
    '0 pitches made.',
    '',
    "The pot is patient. It's not going anywhere.",
    '',
    SITE_URL,
  ].join('\n')
}

export const config = {
  maxDuration: 30,
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const reminders = (await redis.get<number>(COUNTER_KEY)) ?? 0
    const text = buildTweetText(reminders)

    const requestData = { url: 'https://api.x.com/2/tweets', method: 'POST' }
    const authHeader = oauth.toHeader(oauth.authorize(requestData, token))

    const tweetRes = await fetch(requestData.url, {
      method: 'POST',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    })

    const data = await tweetRes.json()
    if (!tweetRes.ok) {
      const message =
        (data && (data.detail || data.title)) || `X API returned ${tweetRes.status}`
      throw new Error(message)
    }

    return res.status(200).json({ posted: true, text, reminders })
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Unknown error posting to X.',
    })
  }
}
