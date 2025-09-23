import { defineConfig } from '@prisma/config'

export default defineConfig({
  // Move deprecated package.json#prisma.seed here
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
})

