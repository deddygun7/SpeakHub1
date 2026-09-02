module.exports = {
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    // Use DATABASE_URL from environment (suitable for Render). Fallback to local URL.
    url: process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/app_db",
  },
};
