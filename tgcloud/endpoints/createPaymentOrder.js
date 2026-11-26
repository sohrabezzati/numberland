import { EndpointError } from 'sdk';
import {
  checkAccess,
  getPaymentAddresses,
  createDepositRequest,
} from '../lib/store.js';
import {
  PAYMENT_METHODS,
  formatKabulTime,
  buildQrImageUrl,
} from '../lib/verifier.js';

export default async function (input, ctx) {
  const user = ctx.initData?.user;
  if (!user?.id) {
    throw new EndpointError('Unauthorized', { code: 'UNAUTHORIZED' });
  }

  const access = await checkAccess(user.id);
  if (!access.authorized) {
    throw new EndpointError('Your account is restricted.', { code: 'RESTRICTED' });
  }

  const method = String(input?.method || '').trim().toLowerCase();
  const meta = PAYMENT_METHODS[method];
  if (!meta) {
    throw new EndpointError('Unsupported payment method.', { code: 'BAD_METHOD' });
  }

  const amountCents = Math.round(Number(input?.amountCents || 0));
  if (!Number.isFinite(amountCents) || amountCents < 1 || amountCents > 1000000) {
    throw new EndpointError('Invalid payment amount.', { code: 'BAD_AMOUNT' });
  }

  const addresses = await getPaymentAddresses();
  const address = addresses[method];
  if (!address) {
    throw new EndpointError(`${meta.title} is not configured by the admin yet.`, {
      code: 'NOT_CONFIGURED',
    });
  }

  const targetService = input?.serviceCode ? String(input.serviceCode).trim() : null;
  const targetCountry = input?.countryId ? String(input.countryId).trim() : null;

  const deposit = await createDepositRequest({
    userId: user.id,
    chatId: user.id,
    amountCents,
    method,
    targetService,
    targetCountry,
    sessionMinutes: meta.sessionMinutes,
  });

  if (!deposit) {
    throw new EndpointError('Could not create payment order.', { code: 'DB_ERROR' });
  }

  const expiresDate = deposit.expiresAt
    ? new Date(deposit.expiresAt)
    : new Date(Date.now() + meta.sessionMinutes * 60 * 1000);

  return {
    orderId: deposit.id,
    method: meta.id,
    title: meta.title,
    currency: meta.currency,
    network: meta.network,
    amountCents: deposit.amountCents,
    address,
    qrUrl: meta.hasQr ? buildQrImageUrl(address) : null,
    sessionMinutes: meta.sessionMinutes,
    expiresAtMs: expiresDate.getTime(),
    kabulDeadline: formatKabulTime(expiresDate),
    targetService,
    targetCountry,
  };
}
