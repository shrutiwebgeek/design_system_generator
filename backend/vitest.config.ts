import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: { name: 'generator', include: ['src/**/*.test.ts'], environment: 'node' },
      },
    ],
  },
})
