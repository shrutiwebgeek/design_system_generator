import express, { type ErrorRequestHandler } from 'express'
import {
  componentList,
  defaultTokens,
  mapping,
  type ApiError,
  type ComponentSummary,
  type GenerateRequest,
  type GenerateResponse,
  type Tier,
  type TokenFile,
} from '@dsg/design-data'
import { generateComponent, hasTemplate, TemplateNotFoundError } from '../generator/generate.ts'

/** Shallow shape check. Deep validation (aliases, mode parity, contrast) is the token validator's job. */
function isTokenFile(value: unknown): value is TokenFile {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  const meta = v.meta as Record<string, unknown> | undefined
  return (
    typeof meta === 'object' && meta !== null && typeof meta.defaultMode === 'string' &&
    typeof v.primitive === 'object' && v.primitive !== null &&
    typeof v.modes === 'object' && v.modes !== null && meta.defaultMode in (v.modes as object)
  )
}

export function createApp() {
  const app = express()
  app.use(express.json({ limit: '1mb' }))

  app.get('/api/components', async (_req, res) => {
    const tiers = Object.keys(componentList) as Tier[]
    const summaries: ComponentSummary[] = []
    for (const tier of tiers) {
      for (const entry of componentList[tier]) {
        summaries.push({ ...entry, tier, available: entry.source !== null && (await hasTemplate(entry.source)) })
      }
    }
    res.json(summaries)
  })

  app.post('/api/components/:source/generate', async (req, res) => {
    const body = (req.body ?? {}) as GenerateRequest
    if (body.tokens !== undefined && !isTokenFile(body.tokens)) {
      const error: ApiError = { error: 'Invalid token file', detail: 'Expected meta.defaultMode, primitive and modes, with defaultMode present in modes.' }
      res.status(400).json(error)
      return
    }
    try {
      const result: GenerateResponse = await generateComponent(req.params.source, body.tokens ?? defaultTokens, mapping)
      res.json(result)
    } catch (err) {
      if (err instanceof TemplateNotFoundError) {
        res.status(404).json({ error: err.message } satisfies ApiError)
        return
      }
      // Token resolution errors (missing path, alias cycle, bad px value) are the caller's to fix.
      res.status(422).json({ error: 'Tokens could not be resolved', detail: (err as Error).message } satisfies ApiError)
    }
  })

  // Malformed JSON bodies and anything unexpected end up here instead of an HTML stack trace.
  const onError: ErrorRequestHandler = (err, _req, res, _next) => {
    const status = typeof err?.status === 'number' ? err.status : 500
    res.status(status).json({ error: status === 500 ? 'Internal error' : String(err.message) } satisfies ApiError)
  }
  app.use(onError)

  return app
}
