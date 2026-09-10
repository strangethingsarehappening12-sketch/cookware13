import { Redis } from '@upstash/redis'
import type { VercelRequest, VercelResponse } from '@vercel/node'

// Works with either env-var naming Vercel might inject, depending on how
// the Redis database was connected:
//  - KV_REST_API_URL / KV_REST_API_TOKEN        (Upstash-via-Vercel-Marketplace integration)
//  - UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN (raw Upstash console link)
const redis = new Redis({
  url: process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? '',
  token: process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? '',
})

// One fixed key for the single global "REMIND VLAD" counter.
const COUNTER_KEY = 'cookware:remind-vlad:count'

// Where the counter starts the very first time this key is touched on the
// new backend — e.g. the live count from the old counter, so the number
// keeps climbing instead of resetting to 0.
//
// Set this from a Vercel env var (REMINDERS_STARTING_COUNT, no redeploy
// needed to change it before the key is first created) so it doesn't
// require a code change. Falls back to 0 if unset.
//
// This ONLY takes effect once: it seeds the key via SETNX ("set if not
// exists"), so it's safe to leave the env var in place permanently — it
// will never overwrite a count that's already accumulating.
const STARTING_COUNT = Number(process.env.REMINDERS_STARTING_COUNT ?? 655)

async function ensureSeeded() {
  if (STARTING_COUNT > 0) {
    await redis.setnx(COUNTER_KEY, STARTING_COUNT)
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      await ensureSeeded()
      const value = (await redis.get<number>(COUNTER_KEY)) ?? 0
      return res.status(200).json({ value })
    }

    if (req.method === 'POST') {
      await ensureSeeded()
      const value = await redis.incr(COUNTER_KEY)
      return res.status(200).json({ value })
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Unknown error reading/writing the counter.',
    })
  }
}
