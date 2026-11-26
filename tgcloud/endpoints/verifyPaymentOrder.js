import { EndpointError } from 'sdk';
import {
  checkAccess,
  getUserLang,
  getApiConfig,
  getMarkupPercent,
  usdToCents,
  debitWalletAtomic,
  creditWallet,
  saveOrder,
} from '../lib/store.js';
import { createProviderClient, applyMarkup } from '../lib/provider.js';
import { findService, findCountry } from '../lib/catalog.js';
import { processPaymentProof } from '../lib/payments.js';

export default async function (input, ctx) {
  const user = ctx.initData?.user;
  if (!user?.id) {
    throw new EndpointError('Unauthorized', { code: 'UNAUTHORIZED' });
  }

  const access = await checkAccess(user.id);
  if (!access.authorized) {
    throw new EndpointError('Your account is restricted.', { code: 'RESTRICTED' });
  }

  const orderId = Number(input?.orderId || 0);
  const txId = String(input?.txId || '').trim();
  if (!orderId || !txId) {
    throw new EndpointError('Order ID and TxID are required.', { code: 'BAD_INPUT' });
  }

  const lang = await getUserLang(user.id, user.language_code);
  const username = user.username ? `@${user.username}` : user.first_name || String(user.id);

  const res = await processPaymentProof({
    depositId: orderId,
    userId: user.id,
    chatId: user.id,
    rawInput: txId,
    username,
    lang,
  });

  if (res.status === 'retry' || res.status === 'error') {
    throw new EndpointError(res.reason || 'Verification failed.', { code: res.status.toUpperCase() });
  }

  let activatedOrder = null;
  let finalBalanceCents = res.wallet ? res.wallet.balanceCents : null;

  // If approved and linked to a specific service, auto-purchase the number immediately!
  if (
    res.status === 'approved' &&
    res.deposit?.targetService &&
    res.deposit?.targetCountry
  ) {
    const serviceCode = res.deposit.targetService;
    const countryId = res.deposit.targetCountry;
    const { apiKey, baseUrl } = await getApiConfig();
    if (apiKey) {
      const client = createProviderClient(apiKey, baseUrl);
      const markupPercent = await getMarkupPercent();
      const priceRes = await client.getPrices(serviceCode, countryId);
      const live = priceRes.ok ? priceRes.byCountry.get(countryId) : null;
      if (live && Number.isFinite(live.basePrice)) {
        const retailPrice = applyMarkup(live.basePrice, markupPercent);
        const wholesaleCents = usdToCents(live.basePrice);
        const retailCents = Math.max(1, usdToCents(retailPrice));
        const commissionCents = Math.max(0, retailCents - wholesaleCents);
        const ctry = findCountry(countryId);

        const debit = await debitWalletAtomic({
          userId: user.id,
          amountCents: retailCents,
          type: 'purchase',
          note: `Number: ${serviceCode.toUpperCase()} (${ctry ? ctry.name : countryId})`,
        });

        if (debit.ok) {
          const numRes = await client.getNumber(serviceCode, countryId, live.basePrice);
          if (numRes.ok && numRes.activationId && numRes.phoneNumber) {
            await saveOrder({
              activationId: numRes.activationId,
              phoneNumber: numRes.phoneNumber,
              serviceCode,
              countryId,
              userId: user.id,
              chatId: user.id,
              wholesaleCents,
              retailCents,
              commissionCents,
            });
            const svc = findService(serviceCode);
            finalBalanceCents = debit.wallet ? debit.wallet.balanceCents : finalBalanceCents;
            activatedOrder = {
              activationId: numRes.activationId,
              phoneNumber: numRes.phoneNumber,
              serviceCode,
              serviceName: svc ? svc.name : serviceCode,
              countryId,
              countryName: ctry ? ctry.name : `Country #${countryId}`,
              countryFlag: ctry ? ctry.flag : '🌍',
              retailCents,
              status: 'WAIT_CODE',
            };
          } else {
            await creditWallet({
              userId: user.id,
              amountCents: retailCents,
              type: 'refund',
              note: `Auto-refund (unavailable): ${serviceCode.toUpperCase()}`,
            });
          }
        }
      }
    }
  }

  return {
    status: res.status,
    creditedCents: res.creditedCents || 0,
    balanceCents: finalBalanceCents,
    reason: res.reason,
    activatedOrder,
  };
}
