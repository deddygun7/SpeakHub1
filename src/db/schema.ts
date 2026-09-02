import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    username: varchar("username", { length: 32 }).notNull(),
    displayName: varchar("display_name", { length: 48 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    bio: varchar("bio", { length: 240 }).default("").notNull(),
    status: varchar("status", { length: 80 }).default("").notNull(),
    favoriteWhisky: varchar("favorite_whisky", { length: 80 }).default("").notNull(),
    title: varchar("title", { length: 40 }).default("").notNull(),
    nameColor: varchar("name_color", { length: 16 }).default("amber").notNull(),
    theme: varchar("theme", { length: 16 }).default("amber").notNull(),
    xp: integer("xp").default(0).notNull(),
    coins: integer("coins").default(20).notNull(),
    messagesCount: integer("messages_count").default(0).notNull(),
    reactionsCount: integer("reactions_count").default(0).notNull(),
    cheersGiven: integer("cheers_given").default(0).notNull(),
    cheersReceived: integer("cheers_received").default(0).notNull(),
    dailyClaims: integer("daily_claims").default(0).notNull(),
    dailyStreak: integer("daily_streak").default(0).notNull(),
    lastDailyClaim: timestamp("last_daily_claim", { withTimezone: true }),
    lastSeen: timestamp("last_seen", { withTimezone: true }).defaultNow().notNull(),
    isBot: boolean("is_bot").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("users_username_idx").on(t.username), index("users_last_seen_idx").on(t.lastSeen)],
);

export const sessions = pgTable(
  "sessions",
  {
    token: varchar("token", { length: 96 }).primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const channels = pgTable(
  "channels",
  {
    id: serial("id").primaryKey(),
    type: varchar("type", { length: 8 }).notNull(), // 'room' | 'dm'
    slug: varchar("slug", { length: 48 }),
    name: varchar("name", { length: 48 }).notNull(),
    description: varchar("description", { length: 200 }).default("").notNull(),
    icon: varchar("icon", { length: 8 }).default("🥃").notNull(),
    topic: varchar("topic", { length: 160 }).default("").notNull(),
    isPrivate: boolean("is_private").default(false).notNull(),
    passwordHash: text("password_hash"),
    createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("channels_slug_idx").on(t.slug), index("channels_type_idx").on(t.type)],
);

export const channelMembers = pgTable(
  "channel_members",
  {
    id: serial("id").primaryKey(),
    channelId: integer("channel_id")
      .notNull()
      .references(() => channels.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lastReadId: integer("last_read_id").default(0).notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("channel_members_unique_idx").on(t.channelId, t.userId),
    index("channel_members_user_idx").on(t.userId),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    channelId: integer("channel_id")
      .notNull()
      .references(() => channels.id, { onDelete: "cascade" }),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    content: text("content").notNull(),
    kind: varchar("kind", { length: 8 }).default("text").notNull(), // text | system | bot | me
    replyToId: integer("reply_to_id"),
    isPinned: boolean("is_pinned").default(false).notNull(),
    editedAt: timestamp("edited_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("messages_channel_id_idx").on(t.channelId, t.id),
    index("messages_channel_updated_idx").on(t.channelId, t.updatedAt),
  ],
);

export const reactions = pgTable(
  "reactions",
  {
    id: serial("id").primaryKey(),
    messageId: integer("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    emoji: varchar("emoji", { length: 16 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("reactions_unique_idx").on(t.messageId, t.userId, t.emoji)],
);

export const userAchievements = pgTable(
  "user_achievements",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 32 }).notNull(),
    unlockedAt: timestamp("unlocked_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("user_achievements_unique_idx").on(t.userId, t.code)],
);

export const cheers = pgTable(
  "cheers",
  {
    id: serial("id").primaryKey(),
    fromUserId: integer("from_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    toUserId: integer("to_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("cheers_pair_idx").on(t.fromUserId, t.toUserId, t.createdAt)],
);

export type User = typeof users.$inferSelect;
export type Channel = typeof channels.$inferSelect;
export type Message = typeof messages.$inferSelect;
