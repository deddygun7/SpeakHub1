import {
  pgTable,
  text,
  uuid,
  timestamp,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  nick: text('nick').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  avatar_url: text('avatar_url'),
  role: text('role').default('user'), // 'user' | 'admin' | 'founder'
  created_at: timestamp('created_at').defaultNow(),
});
