import { defineConfig } from '@prisma/client/runtime';

export default defineConfig({
  datasource: {
    db: {
      provider: "postgresql",
      url: process.env.DATABASE_URL,
    },
  },
  generator: {
    client: {
      provider: "prisma-client-js",
    },
  },
  migrations: {
    seed: "node ./prisma/seed.js",
  },
});
