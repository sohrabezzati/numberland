import { db } from 'sdk';
import { eq, desc } from 'sdk/db';
import { settings, allowedUsers, orders } from '../schema.js';
import { DEFAULT_BASE_URL } from './secondnumber.js';

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

export async function getApiConfig() {
  const apiKey = await getSetting('secondnumber_api_key');
  const baseUrl = (await getSetting('secondnumber_base_url')) || DEFAULT_BASE_URL;
  return { apiKey, baseUrl };
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

export async function addAllowedUser(tgId, label) {
  await db
    .insert(allowedUsers)
    .values({ tgId: Number(tgId), role: 'admin', label: label || null })
    .onConflictDoUpdate({
      target: allowedUsers.tgId,
      set: { label: label || null },
    })
    .run();
}

export async function removeAllowedUser(tgId) {
  await db.delete(allowedUsers).where(eq(allowedUsers.tgId, Number(tgId))).run();
}

export async function listAllowedUsers() {
  return await db.select().from(allowedUsers).all();
}

/**
 * Returns { authorized, isOwner, hasOwner }
 * If no owner has been configured yet, returns hasOwner: false.
 */
export async function checkAccess(tgId) {
  const ownerId = await getOwnerId();
  if (!ownerId) {
    return { authorized: false, isOwner: false, hasOwner: false };
  }
  if (Number(tgId) === ownerId) {
    return { authorized: true, isOwner: true, hasOwner: true };
  }
  const allowed = await db
    .select()
    .from(allowedUsers)
    .where(eq(allowedUsers.tgId, Number(tgId)))
    .get();
  return { authorized: Boolean(allowed), isOwner: false, hasOwner: true };
}

export async function saveOrder({
  activationId,
  phoneNumber,
  serviceCode,
  countryId,
  userId,
  chatId,
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

export async function getOrderByActivationId(activationId) {
  return await db
    .select()
    .from(orders)
    .where(eq(orders.activationId, String(activationId)))
    .get();
}

export async function getRecentOrders(userId, limit = 8) {
  return await db
    .select()
    .from(orders)
    .where(eq(orders.userId, Number(userId)))
    .orderBy(desc(orders.id))
    .limit(limit)
    .all();
}
