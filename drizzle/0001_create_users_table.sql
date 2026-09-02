-- Drizzle SQL migration: create users table compatible with app routes
-- File: drizzle/0001_create_users_table.sql

BEGIN;

-- ensure pgcrypto for gen_random_uuid() is available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  avatar_url text,
  display_name text,
  name_color text,
  title text,
  status text,
  xp integer DEFAULT 0,
  last_seen timestamptz DEFAULT now(),
  is_bot boolean DEFAULT false,
  role text DEFAULT 'user',
  created_at timestamptz DEFAULT now()
);

-- helpful indexes
CREATE INDEX IF NOT EXISTS users_last_seen_idx ON users (last_seen DESC);
CREATE INDEX IF NOT EXISTS users_username_idx ON users (lower(username));

COMMIT;
