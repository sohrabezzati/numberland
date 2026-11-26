import { EndpointError } from 'sdk';
import {
  checkAccess,
  getApiConfig,
  getUserLang,
  getOrderByActivationId,
  updateOrderStatus,
} from '../lib/store.js';
import { createProviderClient } from '../lib/provider.js';
import {
  sendHtml,
  formatOrderStatusText,
  buildActivationControlKeyboard,
} from '../lib/ui.js';

export default async function (input, ctx) {
  const user = ctx.initData?.user;
  if (!user?.id) {
    throw new EndpointError('Unauthorized', { code: 'UNAUTHORIZED' });
  }

  const access = await checkAccess(user.id);
  if (!access.authorized) {
    throw new EndpointError('Your account is restricted.', { code: 'RESTRICTED' });
  }

  const activationId = String(input?.activationId || '').trim();
  if (!activationId) {
    throw new EndpointError('activationId is required.', { code: 'BAD_INPUT' });
  }

  const order = await getOrderByActivationId(activationId);
  if (!order || (Number(order.userId) !== Number(user.id) && !access.isOwner)) {
    throw new EndpointError('Order not found.', { code: 'NOT_FOUND' });
  }

  const { apiKey, baseUrl } = await getApiConfig();
  if (!apiKey) {
    throw new EndpointError('Platform gateway is not configured yet.', { code: 'NO_GATEWAY' });
  }

  const client = createProviderClient(apiKey, baseUrl);
  const res = await client.getStatus(activationId);

  const isNewCode = Boolean(res.ok && res.state === 'OK' && res.code && res.code !== order.smsCode);

  if (order && res.ok) {
    await updateOrderStatus(activationId, res.state, res.code);
  }

  // Send a brand-new message directly in the Telegram Bot chat whenever a new SMS arrives
  if (isNewCode) {
    try {
      const targetChatId = order.chatId || order.userId;
      const userLang = await getUserLang(order.userId, user.language_code);
      const text = formatOrderStatusText(activationId, res, order, userLang);
      const kb = buildActivationControlKeyboard(
        activationId,
        order.serviceCode || '',
        order.countryId || '',
        userLang
      );
      await sendHtml(targetChatId, text, kb);
    } catch (err) {
      console.warn('Could not push new SMS message to bot chat:', err.message);
    }
  }

  return {
    ok: res.ok,
    state: res.state,
    code: res.code || null,
    isNewCode,
    error: res.error || null,
  };
}
