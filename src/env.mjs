import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    ASSEMBLYAI_API_KEY: z.string().min(1),
    ASSEMBLYAI_MAX_DURATION_SEC: z.string().default("300"),
    ASSEMBLYAI_LANGUAGE: z.string().default("en"),
  },
  client: {},
  runtimeEnv: {
    ASSEMBLYAI_API_KEY: process.env.ASSEMBLYAI_API_KEY,
    ASSEMBLYAI_MAX_DURATION_SEC: process.env.ASSEMBLYAI_MAX_DURATION_SEC,
    ASSEMBLYAI_LANGUAGE: process.env.ASSEMBLYAI_LANGUAGE,
  },
}); 