import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  project: process.env.TRIGGER_PROJECT_REF!, // Read from env variables (.env / .env.local)
  maxDuration: 3600,            // Required: default timeout for all tasks in seconds (must be >= 5)
  runtime: 'node',
  dirs: ["./trigger"],
  retries: {
    enabledInDev: false,       // Set to true if you want to test retries locally during development
    default: {
      maxAttempts: 3,          // Retry up to 3 times on failure
      minTimeoutInMs: 1000,    // Initial delay before first retry (1 second)
      maxTimeoutInMs: 10000,   // Maximum delay between retries (10 seconds)
      factor: 2,               // Exponential backoff multiplier
      randomize: true,         // Adds randomness to retry interval to prevent synchronized retries
    },
  },
  // No prismaExtension needed — the project uses @prisma/adapter-pg (driver adapter),
  // so the query engine runs as WASM, not as a native binary.
});
