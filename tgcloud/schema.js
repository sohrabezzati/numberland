import { table, integer, text, index, sql } from 'sdk/db';

/**
 * Key-value bot settings (e.g. secondnumber_api_key, owner_id, base_url).
 */
export const settings = table('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

/**
 * Authorized Telegram users allowed to operate the bot.
 */
export const allowedUsers = table('allowed_users', {
  tgId: integer('tg_id').primaryKey(),
  role: text('role').notNull().default('admin'), // 'owner' | 'admin'
  label: text('label'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

/**
 * History of rented/activated virtual numbers from SecondNumber.io.
 */
export const orders = table(
  'orders',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    activationId: text('activation_id').unique().notNull(),
    phoneNumber: text('phone_number').notNull(),
    serviceCode: text('service_code').notNull(),
    countryId: text('country_id').notNull(),
    userId: integer('user_id').notNull(),
    chatId: integer('chat_id').notNull(),
    status: text('status').notNull().default('WAIT_CODE'),
    smsCode: text('sms_code'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  },
  (t) => ({
    userCreatedIdx: index('idx_orders_user_created').on(t.userId, t.createdAt),
  })
);
