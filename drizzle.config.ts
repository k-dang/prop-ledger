import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Next loads .env.local automatically, but drizzle-kit does not — load it here.
config({ path: ".env.local" });

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  schemaFilter: ["rental"],
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
