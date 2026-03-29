import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  ENVIRONMENT: string
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS — restrict to first-party OMDALA surfaces in production
app.use('/*', cors({
  origin: (origin) => {
    const allowed = [
      'https://omdala.com',
      'https://app.omdala.com',
      'https://docs.omdala.com',
      'https://trust.omdala.com',
      'https://admin.omdala.com',
    ]
    return allowed.includes(origin) ? origin : null
  },
  allowMethods:  ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders:  ['Content-Type', 'Authorization'],
  maxAge:         86400,
  credentials:    true,
}))

// Health
app.get('/health', (c) => {
  return c.json({ ok: true, service: 'omdala-api', env: c.env.ENVIRONMENT })
})

// Robots — API must never be indexed
app.get('/robots.txt', (c) => {
  return c.text('User-agent: *\nDisallow: /')
})

export default app
