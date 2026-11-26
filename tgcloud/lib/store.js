import { api, db } from 'sdk';
import { eq, and, desc, sql } from 'sdk/db';
import {
  settings,
  allowedUsers,
  wallets,
  transactions,
  referrals,
  pointTransactions,
  depositRequests,
  orders,
} from '../schema.js';
import { DEFAULT_BASE_URL, DEFAULT_MARKUP_PERCENT } from './provider.js';
import { normalizeLang } from './i18n.js';

export const DEFAULT_STARS_PER_USD = 50;
export const DEFAULT_REFERRAL_REWARD_POINTS = 10;
export const DEFAULT_REFERRAL_WELCOME_POINTS = 0;
export const DEFAULT_POINTS_PER_USD = 100;

export function usdToCents(usd) {
  const num = Number(usd);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 100);
}

export function centsToUsdString(cents) {
  const num = Number(cents || 0) / 100;
  return `$${num.toFixed(2)}`;
}

export async function getSetting(key) {
  const row = await db.select().from(settings).where(eq(settings.key, key)).get();
  return row ? row.value : null;
}

export async function setSetting(key, value) {
  await db
    .insert(settings)
    .values({ key, value: String(value), updatedAt: new Date() })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: String(value), updatedAt: new Date() },
    })
    .run();
}

export async function deleteSetting(key) {
  await db.delete(settings).where(eq(settings.key, key)).run();
}

export async function getApiConfig() {
  const apiKey =
    (await getSetting('provider_api_key')) || (await getSetting('secondnumber_api_key'));
  const baseUrl =
    (await getSetting('provider_base_url')) ||
    (await getSetting('secondnumber_base_url')) ||
    DEFAULT_BASE_URL;
  return { apiKey, baseUrl };
}

export async function getMarkupPercent() {
  const raw = await getSetting('markup_percent');
  if (raw === null || raw === '') return DEFAULT_MARKUP_PERCENT;
  const num = Number(raw);
  return Number.isFinite(num) && num >= 0 ? num : DEFAULT_MARKUP_PERCENT;
}

export async function setMarkupPercent(percent) {
  await setSetting('markup_percent', String(percent));
}

export async function getStarsPerUsd() {
  const raw = await getSetting('stars_per_usd');
  if (!raw) return DEFAULT_STARS_PER_USD;
  const num = Number(raw);
  return Number.isFinite(num) && num > 0 ? Math.round(num) : DEFAULT_STARS_PER_USD;
}

export async function setStarsPerUsd(rate) {
  await setSetting('stars_per_usd', String(Math.round(Number(rate))));
}

export async function getPayInfo() {
  return await getSetting('crypto_pay_info');
}

export async function setPayInfo(info) {
  await setSetting('crypto_pay_info', String(info));
}

export async function getPaymentAddresses() {
  const [binanceUid, usdtBep20, usdcBep20, binanceApiKey, binanceApiSecret] =
    await Promise.all([
      getSetting('pay_binance_uid'),
      getSetting('pay_usdt_bep20'),
      getSetting('pay_usdc_bep20'),
      getSetting('binance_api_key'),
      getSetting('binance_api_secret'),
    ]);
  return {
    binance: binanceUid || '',
    usdt_bep20: usdtBep20 || usdcBep20 || '',
    usdc_bep20: usdcBep20 || usdtBep20 || '',
    binanceApiKey: binanceApiKey || '',
    binanceApiSecret: binanceApiSecret || '',
  };
}

export async function setPaymentAddress(method, value) {
  const m = String(method || '').toLowerCase();
  const v = String(value || '').trim();
  if (m === 'binance' || m === 'uid') {
    await setSetting('pay_binance_uid', v);
  } else if (m === 'bep20' || m === 'bsc') {
    await setSetting('pay_usdt_bep20', v);
    await setSetting('pay_usdc_bep20', v);
  } else if (m === 'usdt_bep20' || m === 'usdt') {
    await setSetting('pay_usdt_bep20', v);
  } else if (m === 'usdc_bep20' || m === 'usdc') {
    await setSetting('pay_usdc_bep20', v);
  } else {
    throw new Error('Unknown payment method. Use: binance, bep20, usdt_bep20, or usdc_bep20.');
  }
}

export async function setBinanceApiCredentials(apiKey, apiSecret) {
  await setSetting('binance_api_key', String(apiKey).trim());
  await setSetting('binance_api_secret', String(apiSecret).trim());
}

export async function hasUserSelectedLang(userId) {
  if (!userId) return false;
  const saved = await getSetting(`user_lang:${userId}`);
  return Boolean(saved);
}

export async function getUserLang(userId, fallbackCode = 'en') {
  if (userId) {
    const saved = await getSetting(`user_lang:${userId}`);
    if (saved) return normalizeLang(saved);
  }
  return normalizeLang(fallbackCode);
}

export async function setUserLang(userId, lang) {
  if (!userId) return 'en';
  const norm = normalizeLang(lang);
  await setSetting(`user_lang:${userId}`, norm);
  return norm;
}

export async function setUserState(userId, state) {
  const payload = {
    ...state,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 min TTL
  };
  await setSetting(`ui_state:${userId}`, JSON.stringify(payload));
}

export async function getUserState(userId) {
  const raw = await getSetting(`ui_state:${userId}`);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      await clearUserState(userId);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function clearUserState(userId) {
  await deleteSetting(`ui_state:${userId}`);
}

export async function getOwnerId() {
  const val = await getSetting('owner_id');
  return val ? Number(val) : null;
}

export async function setOwner(tgId, label) {
  await setSetting('owner_id', String(tgId));
  await db
    .insert(allowedUsers)
    .values({ tgId: Number(tgId), role: 'owner', label: label || 'Owner' })
    .onConflictDoUpdate({
      target: allowedUsers.tgId,
      set: { role: 'owner', label: label || 'Owner' },
    })
    .run();
}

export async function blockUser(tgId, reason) {
  await db
    .insert(allowedUsers)
    .values({ tgId: Number(tgId), role: 'blocked', label: reason || 'Blocked' })
    .onConflictDoUpdate({
      target: allowedUsers.tgId,
      set: { role: 'blocked', label: reason || 'Blocked' },
    })
    .run();
}

export async function unblockUser(tgId) {
  await db.delete(allowedUsers).where(eq(allowedUsers.tgId, Number(tgId))).run();
}

export async function listBlockedUsers() {
  return await db
    .select()
    .from(allowedUsers)
    .where(eq(allowedUsers.role, 'blocked'))
    .all();
}

/**
 * Open-access model: every user is authorized unless explicitly blocked by the owner.
 * Returns { authorized, isOwner, isBlocked, hasOwner }
 */
export async function checkAccess(tgId) {
  const ownerId = await getOwnerId();
  if (!ownerId) {
    return { authorized: false, isOwner: false, isBlocked: false, hasOwner: false };
  }
  if (Number(tgId) === ownerId) {
    return { authorized: true, isOwner: true, isBlocked: false, hasOwner: true };
  }
  const record = await db
    .select()
    .from(allowedUsers)
    .where(eq(allowedUsers.tgId, Number(tgId)))
    .get();
  const isBlocked = Boolean(record && record.role === 'blocked');
  return { authorized: !isBlocked, isOwner: false, isBlocked, hasOwner: true };
}

// ==========================================
// Wallet & Ledger Operations
// ==========================================

export async function ensureWallet(userId) {
  const uid = Number(userId);
  await db
    .insert(wallets)
    .values({ userId: uid, balanceCents: 0, totalDepositedCents: 0, totalSpentCents: 0 })
    .onConflictDoNothing({ target: wallets.userId })
    .run();
  return await db.select().from(wallets).where(eq(wallets.userId, uid)).get();
}

export async function getWallet(userId) {
  return await ensureWallet(userId);
}

export async function creditWallet({ userId, amountCents, type = 'deposit', referenceId = null, note = null }) {
  const uid = Number(userId);
  const cents = Math.round(Number(amountCents));
  if (!Number.isFinite(cents) || cents <= 0) {
    throw new Error('Credit amount must be positive.');
  }

  await ensureWallet(uid);
  const isDeposit = type === 'deposit' || type === 'admin_credit';

  await db.run(
    sql`UPDATE wallets
        SET balance_cents = balance_cents + ${cents},
            total_deposited_cents = total_deposited_cents + ${isDeposit ? cents : 0},
            updated_at = unixepoch()
        WHERE user_id = ${uid}`
  );

  const updated = await db.select().from(wallets).where(eq(wallets.userId, uid)).get();
  const balanceAfterCents = updated ? updated.balanceCents : cents;

  await db
    .insert(transactions)
    .values({
      userId: uid,
      type,
      amountCents: cents,
      balanceAfterCents,
      referenceId: referenceId ? String(referenceId) : null,
      note: note ? String(note) : null,
    })
    .run();

  return updated;
}

/**
 * Atomically deducts `amountCents` from the user's wallet only if balance >= amountCents.
 * Returns { ok: true, wallet } or { ok: false, wallet } if insufficient funds.
 */
export async function debitWalletAtomic({
  userId,
  amountCents,
  type = 'purchase',
  referenceId = null,
  note = null,
}) {
  const uid = Number(userId);
  const cents = Math.round(Number(amountCents));
  if (!Number.isFinite(cents) || cents <= 0) {
    throw new Error('Debit amount must be positive.');
  }

  await ensureWallet(uid);
  const isSpend = type === 'purchase';

  const result = await db.run(
    sql`UPDATE wallets
        SET balance_cents = balance_cents - ${cents},
            total_spent_cents = total_spent_cents + ${isSpend ? cents : 0},
            updated_at = unixepoch()
        WHERE user_id = ${uid} AND balance_cents >= ${cents}`
  );

  const current = await db.select().from(wallets).where(eq(wallets.userId, uid)).get();

  if (!result || result.rowsAffected === 0) {
    return { ok: false, wallet: current };
  }

  await db
    .insert(transactions)
    .values({
      userId: uid,
      type,
      amountCents: -cents,
      balanceAfterCents: current ? current.balanceCents : 0,
      referenceId: referenceId ? String(referenceId) : null,
      note: note ? String(note) : null,
    })
    .run();

  return { ok: true, wallet: current };
}

export async function getRecentTransactions(userId, limit = 10) {
  return await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, Number(userId)))
    .orderBy(desc(transactions.id))
    .limit(limit)
    .all();
}

// ==========================================
// Deposit & Payment Orders (Binance Pay / BEP20 / TON)
// ==========================================

export async function createDepositRequest({
  userId,
  chatId,
  amountCents,
  method = 'usdt_bep20',
  proofText = null,
  targetService = null,
  targetCountry = null,
  sessionMinutes = 10,
}) {
  const expiresAt = new Date(Date.now() + sessionMinutes * 60 * 1000);
  const rows = await db
    .insert(depositRequests)
    .values({
      userId: Number(userId),
      chatId: Number(chatId),
      amountCents: Math.round(Number(amountCents)),
      method: String(method),
      proofText: proofText ? String(proofText) : null,
      targetService: targetService ? String(targetService) : null,
      targetCountry: targetCountry ? String(targetCountry) : null,
      autoVerified: false,
      expiresAt,
      status: 'pending',
    })
    .returning()
    .run();
  return rows[0] || null;
}

export async function getDepositRequest(id) {
  return await db
    .select()
    .from(depositRequests)
    .where(eq(depositRequests.id, Number(id)))
    .get();
}

export async function findDepositByTxId(txId) {
  if (!txId) return null;
  return await db
    .select()
    .from(depositRequests)
    .where(eq(depositRequests.txId, String(txId).trim()))
    .get();
}

export async function attachDepositTxId(id, txId, proofText, newStatus = 'review', autoVerified = false) {
  await db
    .update(depositRequests)
    .set({
      txId: txId ? String(txId).trim() : null,
      proofText: proofText ? String(proofText) : null,
      status: newStatus,
      autoVerified: Boolean(autoVerified),
    })
    .where(eq(depositRequests.id, Number(id)))
    .run();
}

export async function resolveDepositRequest(id, newStatus) {
  const res = await db.run(
    sql`UPDATE deposit_requests
        SET status = ${newStatus}
        WHERE id = ${Number(id)} AND status IN ('pending', 'review')`
  );
  return Boolean(res && res.rowsAffected > 0);
}

// ==========================================
// Orders & Analytics
// ==========================================

export async function saveOrder({
  activationId,
  phoneNumber,
  serviceCode,
  countryId,
  userId,
  chatId,
  wholesaleCents = 0,
  retailCents = 0,
  commissionCents = 0,
  paymentMethod = 'wallet',
  pointsSpent = 0,
}) {
  await db
    .insert(orders)
    .values({
      activationId: String(activationId),
      phoneNumber: String(phoneNumber),
      serviceCode: String(serviceCode),
      countryId: String(countryId),
      userId: Number(userId),
      chatId: Number(chatId),
      status: 'WAIT_CODE',
      wholesaleCents: Math.round(Number(wholesaleCents || 0)),
      retailCents: Math.round(Number(retailCents || 0)),
      commissionCents: Math.round(Number(commissionCents || 0)),
      paymentMethod: paymentMethod === 'points' ? 'points' : 'wallet',
      pointsSpent: Math.max(0, Math.round(Number(pointsSpent || 0))),
      refunded: false,
    })
    .onConflictDoNothing({ target: orders.activationId })
    .run();
}

export async function updateOrderStatus(activationId, status, smsCode) {
  const updateFields = { status };
  if (smsCode !== undefined) {
    updateFields.smsCode = smsCode;
  }
  await db
    .update(orders)
    .set(updateFields)
    .where(eq(orders.activationId, String(activationId)))
    .run();
}

export async function markOrderRefunded(activationId) {
  const res = await db.run(
    sql`UPDATE orders
        SET refunded = 1
        WHERE activation_id = ${String(activationId)} AND (refunded = 0 OR refunded IS NULL)`
  );
  return Boolean(res && res.rowsAffected > 0);
}

export async function getOrderByActivationId(activationId) {
  return await db
    .select()
    .from(orders)
    .where(eq(orders.activationId, String(activationId)))
    .get();
}

export async function getRecentOrders(userId, limit = 10) {
  return await db
    .select()
    .from(orders)
    .where(eq(orders.userId, Number(userId)))
    .orderBy(desc(orders.id))
    .limit(limit)
    .all();
}

export async function getPlatformStats() {
  const [walletAgg, orderAgg, refAgg] = await Promise.all([
    db.get(
      sql`SELECT COUNT(*) AS user_count,
                 COALESCE(SUM(balance_cents), 0) AS total_user_balances,
                 COALESCE(SUM(total_deposited_cents), 0) AS total_deposited,
                 COALESCE(SUM(points_balance), 0) AS total_points_balance,
                 COALESCE(SUM(total_points_earned), 0) AS total_points_earned,
                 COALESCE(SUM(total_points_spent), 0) AS total_points_spent
          FROM wallets`
    ),
    db.get(
      sql`SELECT COUNT(*) AS total_orders,
                 SUM(CASE WHEN refunded = 0 OR refunded IS NULL THEN 1 ELSE 0 END) AS active_orders,
                 SUM(CASE WHEN payment_method = 'points' AND (refunded = 0 OR refunded IS NULL) THEN 1 ELSE 0 END) AS points_orders,
                 COALESCE(SUM(CASE WHEN refunded = 0 OR refunded IS NULL THEN retail_cents ELSE 0 END), 0) AS total_revenue,
                 COALESCE(SUM(CASE WHEN refunded = 0 OR refunded IS NULL THEN wholesale_cents ELSE 0 END), 0) AS total_wholesale,
                 COALESCE(SUM(CASE WHEN refunded = 0 OR refunded IS NULL THEN commission_cents ELSE 0 END), 0) AS total_commission
          FROM orders`
    ),
    db.get(sql`SELECT COUNT(*) AS total_referrals FROM referrals`),
  ]);

  return {
    userCount: Number(walletAgg?.user_count || 0),
    totalUserBalancesCents: Number(walletAgg?.total_user_balances || 0),
    totalDepositedCents: Number(walletAgg?.total_deposited || 0),
    totalPointsBalance: Number(walletAgg?.total_points_balance || 0),
    totalPointsEarned: Number(walletAgg?.total_points_earned || 0),
    totalPointsSpent: Number(walletAgg?.total_points_spent || 0),
    totalReferrals: Number(refAgg?.total_referrals || 0),
    totalOrders: Number(orderAgg?.total_orders || 0),
    activeOrders: Number(orderAgg?.active_orders || 0),
    pointsOrders: Number(orderAgg?.points_orders || 0),
    totalRevenueCents: Number(orderAgg?.total_revenue || 0),
    totalWholesaleCents: Number(orderAgg?.total_wholesale || 0),
    totalCommissionCents: Number(orderAgg?.total_commission || 0),
  };
}

export async function getAdminUsersPage({ page = 0, pageSize = 10 } = {}) {
  const safeSize = Math.max(1, Math.min(20, Number(pageSize) || 10));
  const countRow = await db.get(sql`SELECT COUNT(*) AS c FROM wallets`);
  const total = Number(countRow?.c || 0);
  const totalPages = Math.max(1, Math.ceil(total / safeSize));
  const safePage = Math.max(0, Math.min(Number(page) || 0, totalPages - 1));
  const offset = safePage * safeSize;

  const rows = await db.all(
    sql`SELECT
          w.user_id,
          w.balance_cents,
          w.total_deposited_cents,
          w.total_spent_cents,
          w.points_balance,
          w.total_points_earned,
          w.total_points_spent,
          (SELECT COUNT(*) FROM orders o WHERE o.user_id = w.user_id) AS order_count,
          (SELECT COUNT(*) FROM referrals r WHERE r.referrer_user_id = w.user_id) AS referral_count,
          (SELECT role FROM allowed_users a WHERE a.tg_id = w.user_id LIMIT 1) AS access_role
        FROM wallets w
        ORDER BY (w.balance_cents + w.points_balance) DESC, w.updated_at DESC
        LIMIT ${safeSize} OFFSET ${offset}`
  );

  const users = (rows || []).map((r) => ({
    userId: Number(r.user_id),
    balanceCents: Number(r.balance_cents || 0),
    totalDepositedCents: Number(r.total_deposited_cents || 0),
    totalSpentCents: Number(r.total_spent_cents || 0),
    pointsBalance: Number(r.points_balance || 0),
    totalPointsEarned: Number(r.total_points_earned || 0),
    totalPointsSpent: Number(r.total_points_spent || 0),
    orderCount: Number(r.order_count || 0),
    referralCount: Number(r.referral_count || 0),
    role: r.access_role || 'user',
  }));

  return { users, total, page: safePage, totalPages };
}


// ==========================================
// Referral & Points Economy
// ==========================================

export async function getBotUsername() {
  const cached = await getSetting('bot_username');
  if (cached) return cached;
  try {
    const me = await api.getMe();
    if (me && me.username) {
      await setSetting('bot_username', String(me.username));
      return String(me.username);
    }
  } catch (err) {
    console.warn('getBotUsername fallback:', err.message);
  }
  return '';
}

export async function buildReferralLink(userId) {
  const username = await getBotUsername();
  if (!username) return '';
  return `https://t.me/${username}?start=ref_${Number(userId)}`;
}

export async function getReferralRewardPoints() {
  const raw = await getSetting('referral_reward_points');
  if (raw === null || raw === '') return DEFAULT_REFERRAL_REWARD_POINTS;
  const n = Math.round(Number(raw));
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_REFERRAL_REWARD_POINTS;
}

export async function setReferralRewardPoints(points) {
  await setSetting('referral_reward_points', String(Math.max(0, Math.round(Number(points)))));
}

export async function getReferralWelcomePoints() {
  const raw = await getSetting('referral_welcome_points');
  if (raw === null || raw === '') return DEFAULT_REFERRAL_WELCOME_POINTS;
  const n = Math.round(Number(raw));
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_REFERRAL_WELCOME_POINTS;
}

export async function setReferralWelcomePoints(points) {
  await setSetting('referral_welcome_points', String(Math.max(0, Math.round(Number(points)))));
}

export async function getPointsPerUsd() {
  const raw = await getSetting('points_per_usd');
  if (raw === null || raw === '') return DEFAULT_POINTS_PER_USD;
  const n = Math.round(Number(raw));
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_POINTS_PER_USD;
}

export async function setPointsPerUsd(rate) {
  await setSetting('points_per_usd', String(Math.max(1, Math.round(Number(rate)))));
}

export async function getServicePointsOverride(serviceCode) {
  const code = String(serviceCode || '').trim().toLowerCase();
  if (!code) return null;
  const raw = await getSetting(`service_points:${code}`);
  if (raw === null || raw === '') return null;
  const n = Math.round(Number(raw));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function setServicePointsOverride(serviceCode, points) {
  const code = String(serviceCode || '').trim().toLowerCase();
  if (!code) throw new Error('Invalid service code.');
  const pts = Math.round(Number(points));
  if (!Number.isFinite(pts) || pts <= 0) throw new Error('Points must be a positive integer.');
  await setSetting(`service_points:${code}`, String(pts));
  return { code, points: pts };
}

export async function clearServicePointsOverride(serviceCode) {
  const code = String(serviceCode || '').trim().toLowerCase();
  if (!code) return;
  await deleteSetting(`service_points:${code}`);
}

export async function listServicePointsOverrides() {
  const all = await db.select().from(settings).all();
  const overrides = {};
  for (const row of all) {
    if (row.key && row.key.startsWith('service_points:')) {
      const code = row.key.slice('service_points:'.length);
      const pts = Math.round(Number(row.value));
      if (code && Number.isFinite(pts) && pts > 0) {
        overrides[code] = pts;
      }
    }
  }
  return overrides;
}

export async function calculateRequiredPoints(serviceCode, retailCents) {
  const override = await getServicePointsOverride(serviceCode);
  if (override !== null) return override;
  const rate = await getPointsPerUsd();
  const usd = Math.max(0, Number(retailCents || 0)) / 100;
  return Math.max(1, Math.ceil(usd * rate));
}

export function computeRequiredPointsSync(serviceCode, retailCents, pointsPerUsd, overridesMap = {}) {
  const code = String(serviceCode || '').trim().toLowerCase();
  if (code && overridesMap && overridesMap[code] > 0) {
    return overridesMap[code];
  }
  const usd = Math.max(0, Number(retailCents || 0)) / 100;
  return Math.max(1, Math.ceil(usd * (pointsPerUsd || DEFAULT_POINTS_PER_USD)));
}

export async function creditPoints({
  userId,
  amountPoints,
  type = 'referral_reward',
  referenceId = null,
  note = null,
}) {
  const uid = Number(userId);
  const pts = Math.round(Number(amountPoints));
  if (!Number.isFinite(pts) || pts <= 0) {
    throw new Error('Points credit must be positive.');
  }

  await ensureWallet(uid);
  const isEarned = type === 'referral_reward' || type === 'referral_welcome' || type === 'admin_credit';

  await db.run(
    sql`UPDATE wallets
        SET points_balance = points_balance + ${pts},
            total_points_earned = total_points_earned + ${isEarned ? pts : 0},
            updated_at = unixepoch()
        WHERE user_id = ${uid}`
  );

  const updated = await db.select().from(wallets).where(eq(wallets.userId, uid)).get();
  const balanceAfterPoints = updated ? Number(updated.pointsBalance || 0) : pts;

  await db
    .insert(pointTransactions)
    .values({
      userId: uid,
      type,
      amountPoints: pts,
      balanceAfterPoints,
      referenceId: referenceId ? String(referenceId) : null,
      note: note ? String(note) : null,
    })
    .run();

  return updated;
}

export async function debitPointsAtomic({
  userId,
  amountPoints,
  type = 'purchase',
  referenceId = null,
  note = null,
}) {
  const uid = Number(userId);
  const pts = Math.round(Number(amountPoints));
  if (!Number.isFinite(pts) || pts <= 0) {
    throw new Error('Points debit must be positive.');
  }

  await ensureWallet(uid);
  const isSpend = type === 'purchase';

  const result = await db.run(
    sql`UPDATE wallets
        SET points_balance = points_balance - ${pts},
            total_points_spent = total_points_spent + ${isSpend ? pts : 0},
            updated_at = unixepoch()
        WHERE user_id = ${uid} AND points_balance >= ${pts}`
  );

  const current = await db.select().from(wallets).where(eq(wallets.userId, uid)).get();
  if (!result || result.rowsAffected === 0) {
    return { ok: false, wallet: current };
  }

  await db
    .insert(pointTransactions)
    .values({
      userId: uid,
      type,
      amountPoints: -pts,
      balanceAfterPoints: current ? Number(current.pointsBalance || 0) : 0,
      referenceId: referenceId ? String(referenceId) : null,
      note: note ? String(note) : null,
    })
    .run();

  return { ok: true, wallet: current };
}

export async function getRecentPointTransactions(userId, limit = 10) {
  return await db
    .select()
    .from(pointTransactions)
    .where(eq(pointTransactions.userId, Number(userId)))
    .orderBy(desc(pointTransactions.id))
    .limit(limit)
    .all();
}

/**
 * Attributes a brand-new user to a referrer and credits points atomically.
 * Guards against self-referrals, blocked referrers, existing users, and duplicate claims.
 */
export async function processReferralJoin({ referredUserId, referrerUserId }) {
  const referred = Number(referredUserId);
  const referrer = Number(referrerUserId);

  if (!Number.isFinite(referred) || !Number.isFinite(referrer) || referred <= 0 || referrer <= 0) {
    return { awarded: false, reason: 'invalid_ids' };
  }
  if (referred === referrer) {
    return { awarded: false, reason: 'self_referral' };
  }

  // Referrer must not be blocked
  const refAccess = await checkAccess(referrer);
  if (!refAccess.authorized) {
    return { awarded: false, reason: 'referrer_restricted' };
  }

  // Ensure the referred user is genuinely new (no existing referral, wallet, or saved language)
  const [existingRef, existingWallet, existingLang] = await Promise.all([
    db.select().from(referrals).where(eq(referrals.referredUserId, referred)).get(),
    db.select().from(wallets).where(eq(wallets.userId, referred)).get(),
    getSetting(`user_lang:${referred}`),
  ]);

  if (existingRef || existingWallet || existingLang) {
    return { awarded: false, reason: 'already_registered' };
  }

  const [rewardPoints, welcomePoints] = await Promise.all([
    getReferralRewardPoints(),
    getReferralWelcomePoints(),
  ]);

  // Atomic insert guarded by primary key on referred_user_id
  const inserted = await db
    .insert(referrals)
    .values({
      referredUserId: referred,
      referrerUserId: referrer,
      pointsAwarded: rewardPoints,
      welcomeBonusPoints: welcomePoints,
    })
    .onConflictDoNothing({ target: referrals.referredUserId })
    .returning()
    .run();

  if (!inserted || inserted.length === 0) {
    return { awarded: false, reason: 'duplicate' };
  }

  let referrerWallet = null;
  if (rewardPoints > 0) {
    referrerWallet = await creditPoints({
      userId: referrer,
      amountPoints: rewardPoints,
      type: 'referral_reward',
      referenceId: `ref:${referred}`,
      note: `Referral reward (user ${referred})`,
    });
  }

  let referredWallet = null;
  if (welcomePoints > 0) {
    referredWallet = await creditPoints({
      userId: referred,
      amountPoints: welcomePoints,
      type: 'referral_welcome',
      referenceId: `ref_by:${referrer}`,
      note: 'Referral welcome bonus',
    });
  }

  return {
    awarded: true,
    pointsAwarded: rewardPoints,
    welcomeBonusPoints: welcomePoints,
    referrerBalance: referrerWallet ? Number(referrerWallet.pointsBalance || 0) : null,
    referredBalance: referredWallet ? Number(referredWallet.pointsBalance || 0) : null,
  };
}

export async function getReferralSummary(userId) {
  const uid = Number(userId);
  const [wallet, agg, rewardPoints, welcomePoints, pointsPerUsd, inviteLink, recentPointTx, overrides] =
    await Promise.all([
      getWallet(uid),
      db.get(
        sql`SELECT COUNT(*) AS ref_count,
                   COALESCE(SUM(points_awarded), 0) AS total_ref_points
            FROM referrals
            WHERE referrer_user_id = ${uid}`
      ),
      getReferralRewardPoints(),
      getReferralWelcomePoints(),
      getPointsPerUsd(),
      buildReferralLink(uid),
      getRecentPointTransactions(uid, 12),
      listServicePointsOverrides(),
    ]);

  return {
    inviteLink,
    referralCount: Number(agg?.ref_count || 0),
    totalEarnedFromReferrals: Number(agg?.total_ref_points || 0),
    pointsBalance: Number(wallet?.pointsBalance || 0),
    totalPointsEarned: Number(wallet?.totalPointsEarned || 0),
    totalPointsSpent: Number(wallet?.totalPointsSpent || 0),
    rewardPoints,
    welcomePoints,
    pointsPerUsd,
    servicePointsOverrides: overrides,
    pointTransactions: recentPointTx,
  };
}
