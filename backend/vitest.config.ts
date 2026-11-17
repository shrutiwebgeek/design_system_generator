import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: { name: 'generator', include: ['src/**/*.test.ts'], environment: 'node' },
      },
      {
        // Predefined component tests. They run against the raw templates; the same
        // test ships next to the generated component in a download.
        plugins: [react()],
        test: {
          name: 'templates',
          include: ['templates/**/*.test.tsx'],
          environment: 'jsdom',
          setupFiles: ['./templates/setup.ts'],
        },
      },
    ],
  },
})
