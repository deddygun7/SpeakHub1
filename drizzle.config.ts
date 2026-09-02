const drizzleConfig = {
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    // Prefer DATABASE_URL from the environment, fall back to the original local URL
    url: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5432/app_db",
  },
};

export default drizzleConfig;
