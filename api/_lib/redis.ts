import { Redis } from '@upstash/redis'

// Works with either env-var naming Vercel might inject, depending on how
// the Redis database was connected:
//  - KV_REST_API_URL / KV_REST_API_TOKEN        (Upstash-via-Vercel-Marketplace integration)
//  - UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN (raw Upstash console link)
export const redis = new Redis({
  url: process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? '',
  token: process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? '',
})
