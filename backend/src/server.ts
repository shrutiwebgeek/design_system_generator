import { createApp } from './api/app.ts'

const port = Number(process.env.PORT ?? 3001)

createApp().listen(port, () => {
  console.log(`design-system-generator API on http://localhost:${port}`)
})
