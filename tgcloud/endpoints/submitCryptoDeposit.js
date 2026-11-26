import { EndpointError } from 'sdk';
import {
  checkAccess,
  usdToCents,
  centsToUsdString,
  createDepositRequest,
  getOwnerId,
} from '../lib/store.js';
import { escapeHtml, sendHtml, buildDepositApprovalKeyboard } from '../lib/ui.js';

export default async function (input, ctx) {
  const user = ctx.initData?.user;
  if (!user?.id) {
    throw new EndpointError('Unauthorized', { code: 'UNAUTHORIZED' });
  }

  const access = await checkAccess(user.id);
  if (!access.authorized) {
    throw new EndpointError('Your account is restricted.', { code: 'RESTRICTED' });
  }

  const amountUsd = Number(input?.amountUsd);
  const proofText = String(input?.proofText || '').trim();
  const amountCents = usdToCents(amountUsd);

  if (!Number.isFinite(amountUsd) || amountCents < 100 || amountCents > 1000000) {
    throw new EndpointError('Amount must be between $1.00 and $10,000.00.', { code: 'BAD_INPUT' });
  }
  if (!proofText) {
    throw new EndpointError('Please enter your TX Hash or Binance Order ID.', { code: 'BAD_INPUT' });
  }

  const dep = await createDepositRequest({
    userId: user.id,
    chatId: user.id,
    amountCents,
    method: 'crypto',
    proofText,
  });

  const ownerId = await getOwnerId();
  const username = user.username ? `@${user.username}` : user.first_name || `User ${user.id}`;
  if (ownerId && dep) {
    try {
      await sendHtml(
        ownerId,
        [
          '🟡 <b>New Binance / Crypto Deposit (Mini App)</b>',
          '',
          `🆔 <b>Request ID:</b> <code>#${dep.id}</code>`,
          `👤 <b>User:</b> ${escapeHtml(username)} (<code>${user.id}</code>)`,
          `💵 <b>Amount:</b> <code>${escapeHtml(centsToUsdString(amountCents))}</code>`,
          `🧾 <b>Proof / TXID:</b> <code>${escapeHtml(proofText)}</code>`,
        ].join('\n'),
        buildDepositApprovalKeyboard(dep.id)
      );
    } catch (err) {
      console.warn('Could not notify owner of Mini App deposit:', err.message);
    }
  }

  return {
    ok: true,
    depositId: dep ? dep.id : null,
    amountCents,
  };
}
