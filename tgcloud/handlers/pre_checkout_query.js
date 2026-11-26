import { api } from 'sdk';
import { checkAccess } from '../lib/store.js';

export default async function (preCheckoutQuery) {
  if (!preCheckoutQuery) return;

  const userId = preCheckoutQuery.from?.id;
  const payload = preCheckoutQuery.invoice_payload || '';
  const access = await checkAccess(userId);

  if (!access.authorized) {
    await api.answerPreCheckoutQuery({
      pre_checkout_query_id: preCheckoutQuery.id,
      ok: false,
      error_message: 'Your account is restricted from making deposits.',
    });
    return;
  }

  if (!payload.startsWith('topup:') && !payload.startsWith('svc:')) {
    await api.answerPreCheckoutQuery({
      pre_checkout_query_id: preCheckoutQuery.id,
      ok: false,
      error_message: 'Invalid invoice payload.',
    });
    return;
  }

  await api.answerPreCheckoutQuery({
    pre_checkout_query_id: preCheckoutQuery.id,
    ok: true,
  });
}
