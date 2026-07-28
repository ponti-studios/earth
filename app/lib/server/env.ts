import "dotenv/config";
import { z } from "zod";

export const EarthServerEnv = z
  .object({
    PUBLIC_DATA_URL: z.string().default("https://public-data-production.up.railway.app"),
  })
  .transform((env) => ({
    publicDataUrl: env.PUBLIC_DATA_URL,
  }));

export type EarthServerEnv = z.infer<typeof EarthServerEnv>;
