import { table, integer, text, boolean, index, check, sql } from 'sdk/db';

/**
 * Key-value bot settings (e.g. provider_api_key, owner_id, markup_percent, pay_info, stars_rate, referral/points settings).
 */
export const settings = table('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

/**
 * User access control records (owner & blocked users).
 */
export const allowedUsers = table('allowed_users', {
  tgId: integer('tg_id').primaryKey(),
  role: text('role').notNull().default('admin'), // 'owner' | 'admin' | 'blocked'
  label: text('label'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

/**
 * Per-user USD wallets (cents) and Referral Points balances.
 */
export const wallets = table(
  'wallets',
  {
    userId: integer('user_id').primaryKey(),
    balanceCents: integer('balance_cents').notNull().default(0),
    totalDepositedCents: integer('total_deposited_cents').notNull().default(0),
    totalSpentCents: integer('total_spent_cents').notNull().default(0),
    pointsBalance: integer('points_balance').notNull().default(0),
    totalPointsEarned: integer('total_points_earned').notNull().default(0),
    totalPointsSpent: integer('total_points_spent').notNull().default(0),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  },
  (t) => ({
    nonNegativeBalance: check('chk_wallets_balance_non_negative', sql`${t.balanceCents} >= 0`),
  })
);

/**
 * Immutable USD wallet ledger for deposits, purchases, refunds, and admin adjustments.
 */
export const transactions = table(
  'transactions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').notNull(),
    type: text('type').notNull(), // 'deposit' | 'purchase' | 'refund' | 'admin_credit' | 'admin_debit'
    amountCents: integer('amount_cents').notNull(), // positive for credit, negative for debit
    balanceAfterCents: integer('balance_after_cents').notNull(),
    referenceId: text('reference_id'),
    note: text('note'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  },
  (t) => ({
    userCreatedIdx: index('idx_transactions_user_created').on(t.userId, t.createdAt),
  })
);

/**
 * Referral attribution records (strictly 1 referral per unique Telegram user ID).
 */
export const referrals = table(
  'referrals',
  {
    referredUserId: integer('referred_user_id').primaryKey(),
    referrerUserId: integer('referrer_user_id').notNull(),
    pointsAwarded: integer('points_awarded').notNull().default(0),
    welcomeBonusPoints: integer('welcome_bonus_points').notNull().default(0),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  },
  (t) => ({
    referrerCreatedIdx: index('idx_referrals_referrer_created').on(t.referrerUserId, t.createdAt),
  })
);

/**
 * Immutable points ledger for referral rewards, welcome bonuses, points purchases, refunds, and admin adjustments.
 */
export const pointTransactions = table(
  'point_transactions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').notNull(),
    type: text('type').notNull(), // 'referral_reward' | 'referral_welcome' | 'purchase' | 'refund' | 'admin_credit' | 'admin_debit'
    amountPoints: integer('amount_points').notNull(), // positive for credit, negative for debit
    balanceAfterPoints: integer('balance_after_points').notNull(),
    referenceId: text('reference_id'),
    note: text('note'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  },
  (t) => ({
    userCreatedIdx: index('idx_point_tx_user_created').on(t.userId, t.createdAt),
  })
);

/**
 * Payment & deposit orders (Binance Pay, USDT/USDC BEP20, USDT TON, Stars)
 * supporting both wallet top-ups and direct single-service checkout.
 */
export const depositRequests = table(
  'deposit_requests',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').notNull(),
    chatId: integer('chat_id').notNull(),
    amountCents: integer('amount_cents').notNull(),
    method: text('method').notNull().default('crypto'), // 'binance' | 'usdt_bep20' | 'usdc_bep20' | 'usdt_ton' | 'stars'
    proofText: text('proof_text'),
    txId: text('tx_id'),
    targetService: text('target_service'),
    targetCountry: text('target_country'),
    autoVerified: boolean('auto_verified').default(false),
    expiresAt: integer('expires_at', { mode: 'timestamp' }),
    status: text('status').notNull().default('pending'), // 'pending' | 'review' | 'approved' | 'rejected' | 'expired'
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  },
  (t) => ({
    statusIdx: index('idx_deposit_requests_status').on(t.status, t.createdAt),
    txIdx: index('idx_deposit_requests_tx').on(t.txId),
  })
);

/**
 * History of rented/activated virtual numbers with wholesale, retail, commission, and points tracking.
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
    wholesaleCents: integer('wholesale_cents').default(0),
    retailCents: integer('retail_cents').default(0),
    commissionCents: integer('commission_cents').default(0),
    paymentMethod: text('payment_method').notNull().default('wallet'), // 'wallet' | 'points'
    pointsSpent: integer('points_spent').notNull().default(0),
    refunded: boolean('refunded').default(false),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  },
  (t) => ({
    userCreatedIdx: index('idx_orders_user_created').on(t.userId, t.createdAt),
  })
);
