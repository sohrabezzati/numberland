import { api, EndpointError } from 'sdk';
import { checkAccess, getStarsPerUsd, usdToCents } from '../lib/store.js';

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
  const amountCents = input?.amountCents
    ? Math.round(Number(input.amountCents))
    : usdToCents(amountUsd);

  if (!Number.isFinite(amountCents) || amountCents < 1 || amountCents > 50000) {
    throw new EndpointError('Invalid amount.', { code: 'BAD_INPUT' });
  }

  const usd = amountCents / 100;
  const starsPerUsd = await getStarsPerUsd();
  const starAmount = Math.max(1, Math.round(usd * starsPerUsd));

  const serviceCode = input?.serviceCode ? String(input.serviceCode).trim() : null;
  const countryId = input?.countryId ? String(input.countryId).trim() : null;
  const payload =
    serviceCode && countryId
      ? `svc:${user.id}:${amountCents}:${serviceCode}:${countryId}`
      : `topup:${user.id}:${amountCents}`;

  const invoiceUrl = await api.createInvoiceLink({
    title:
      serviceCode && countryId
        ? `YekTap Number (${serviceCode.toUpperCase()} · $${usd.toFixed(2)})`
        : `YekTap Wallet Top-Up ($${usd.toFixed(2)})`,
    description:
      serviceCode && countryId
        ? `Instant payment of $${usd.toFixed(2)} USD to activate your virtual number.`
        : `Instant credit of $${usd.toFixed(2)} USD to your YekTap wallet.`,
    payload,
    provider_token: '',
    currency: 'XTR',
    prices: [{ label: `$${usd.toFixed(2)} USD`, amount: starAmount }],
  });

  return { invoiceUrl, starAmount, amountCents };
}
