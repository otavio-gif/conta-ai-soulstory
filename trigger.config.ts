import { defineConfig } from "@trigger.dev/sdk/v3";

// Substitua "project" pelo ref do seu projeto no dashboard do Trigger.dev
// (Settings -> General). Em dev: `pnpm trigger:dev`.
export default defineConfig({
  project: process.env.TRIGGER_PROJECT_REF ?? "proj_soulstory_visao_externa",
  runtime: "node",
  logLevel: "info",
  dirs: ["./src/trigger"],
  maxDuration: 3600,
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 1,
    },
  },
});
