import { EndpointError } from 'sdk';
import {
  usdToCents,
  checkAccess,
  getApiConfig,
  getMarkupPercent,
  calculateRequiredPoints,
  debitWalletAtomic,
  creditWallet,
  debitPointsAtomic,
  creditPoints,
  saveOrder,
} from '../lib/store.js';
import { createProviderClient, applyMarkup } from '../lib/provider.js';
import { findService, findCountry } from '../lib/catalog.js';

export default async function (input, ctx) {
  const user = ctx.initData?.user;
  if (!user?.id) {
    throw new EndpointError('Unauthorized', { code: 'UNAUTHORIZED' });
  }

  const access = await checkAccess(user.id);
  if (!access.authorized) {
    throw new EndpointError('Your account is restricted.', { code: 'RESTRICTED' });
  }

  const serviceCode = String(input?.serviceCode || '').trim();
  const countryId = String(input?.countryId || '').trim();
  const paymentMethod = input?.paymentMethod === 'points' ? 'points' : 'wallet';

  if (!serviceCode || !countryId) {
    throw new EndpointError('serviceCode and countryId are required.', { code: 'BAD_INPUT' });
  }

  const { apiKey, baseUrl } = await getApiConfig();
  if (!apiKey) {
    throw new EndpointError('Platform gateway is not configured yet.', { code: 'NO_GATEWAY' });
  }

  const client = createProviderClient(apiKey, baseUrl);
  const markupPercent = await getMarkupPercent();

  const priceRes = await client.getPrices(serviceCode, countryId);
  const live = priceRes.ok ? priceRes.byCountry.get(countryId) : null;
  if (!live || !Number.isFinite(live.basePrice)) {
    throw new EndpointError('No numbers currently available for this service & country.', {
      code: 'NO_NUMBERS',
    });
  }

  const wholesalePrice = live.basePrice;
  const retailPrice = applyMarkup(wholesalePrice, markupPercent);
  const wholesaleCents = usdToCents(wholesalePrice);
  const retailCents = Math.max(1, usdToCents(retailPrice));
  const commissionCents = Math.max(0, retailCents - wholesaleCents);

  const ctry = findCountry(countryId);
  const svc = findService(serviceCode);
  const svcLabel = svc ? svc.name : serviceCode.toUpperCase();
  const ctryLabel = ctry ? ctry.name : countryId;

  let requiredPoints = 0;
  let updatedWallet = null;

  if (paymentMethod === 'points') {
    requiredPoints = await calculateRequiredPoints(serviceCode, retailCents);
    const debit = await debitPointsAtomic({
      userId: user.id,
      amountPoints: requiredPoints,
      type: 'purchase',
      note: `${svcLabel} (${ctryLabel})`,
    });

    if (!debit.ok) {
      throw new EndpointError('Insufficient points balance. Invite friends to earn more points.', {
        code: 'INSUFFICIENT_POINTS',
        requiredPoints,
        pointsBalance: debit.wallet ? Number(debit.wallet.pointsBalance || 0) : 0,
      });
    }
    updatedWallet = debit.wallet;
  } else {
    const debit = await debitWalletAtomic({
      userId: user.id,
      amountCents: retailCents,
      type: 'purchase',
      note: `${svcLabel} (${ctryLabel})`,
    });

    if (!debit.ok) {
      throw new EndpointError('Insufficient wallet balance. Please top up first.', {
        code: 'INSUFFICIENT_BALANCE',
        requiredCents: retailCents,
        balanceCents: debit.wallet ? debit.wallet.balanceCents : 0,
      });
    }
    updatedWallet = debit.wallet;
  }

  const refundOnFailure = async (reasonTag) => {
    if (paymentMethod === 'points') {
      await creditPoints({
        userId: user.id,
        amountPoints: requiredPoints,
        type: 'refund',
        note: `Auto-refund (${reasonTag}): ${svcLabel}`,
      });
    } else {
      await creditWallet({
        userId: user.id,
        amountCents: retailCents,
        type: 'refund',
        note: `Auto-refund (${reasonTag}): ${svcLabel}`,
      });
    }
  };

  try {
    const res = await client.getNumber(serviceCode, countryId, wholesalePrice);
    if (!res.ok || !res.activationId || !res.phoneNumber) {
      await refundOnFailure('unavailable');
      throw new EndpointError(
        res.error ||
          (paymentMethod === 'points'
            ? 'Could not activate number. Points refunded.'
            : 'Could not activate number. Balance refunded.'),
        { code: 'GATEWAY_ERROR' }
      );
    }

    await saveOrder({
      activationId: res.activationId,
      phoneNumber: res.phoneNumber,
      serviceCode,
      countryId,
      userId: user.id,
      chatId: user.id,
      wholesaleCents,
      retailCents: paymentMethod === 'points' ? 0 : retailCents,
      commissionCents: paymentMethod === 'points' ? 0 : commissionCents,
      paymentMethod,
      pointsSpent: paymentMethod === 'points' ? requiredPoints : 0,
    });

    return {
      activationId: res.activationId,
      phoneNumber: res.phoneNumber,
      serviceCode,
      serviceName: svc ? svc.name : serviceCode,
      serviceEmoji: '',
      countryId,
      countryName: ctry ? ctry.name : `Country #${countryId}`,
      countryFlag: ctry ? ctry.flag : '🌍',
      retailCents: paymentMethod === 'points' ? 0 : retailCents,
      paymentMethod,
      pointsSpent: paymentMethod === 'points' ? requiredPoints : 0,
      balanceCents: updatedWallet ? Number(updatedWallet.balanceCents || 0) : 0,
      pointsBalance: updatedWallet ? Number(updatedWallet.pointsBalance || 0) : 0,
      status: 'WAIT_CODE',
    };
  } catch (err) {
    if (err instanceof EndpointError) throw err;
    await refundOnFailure('error');
    throw new EndpointError(
      paymentMethod === 'points'
        ? 'Network error activating number. Points refunded.'
        : 'Network error activating number. Balance refunded.',
      { code: 'NETWORK_ERROR' }
    );
  }
}
