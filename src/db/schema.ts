import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  boolean,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: text('username').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  avatar_url: text('avatar_url'),
  displayName: text('display_name'),
  nameColor: text('name_color'),
  title: text('title'),
  status: text('status'),
  xp: integer('xp').default(0),
  lastSeen: timestamp('last_seen').defaultNow(),
  isBot: boolean('is_bot').default(false),
  role: text('role').default('user'), // 'user' | 'admin' | 'founder'
  created_at: timestamp('created_at').defaultNow(),
});
