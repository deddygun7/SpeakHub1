-- Optional rollback migration
BEGIN;

DROP INDEX IF EXISTS users_last_seen_idx;
DROP INDEX IF EXISTS users_username_idx;
DROP TABLE IF EXISTS users;

COMMIT;
