import { defineConfig } from '@prisma/config'
// Explicitly load env when using prisma.config.* (CLI skips auto-loading)
import 'dotenv/config'

export default defineConfig({
  // Move deprecated package.json#prisma.seed here
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
})
