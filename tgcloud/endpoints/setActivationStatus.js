import { EndpointError } from 'sdk';
import {
  checkAccess,
  getApiConfig,
  getOrderByActivationId,
  updateOrderStatus,
  markOrderRefunded,
  creditWallet,
  creditPoints,
  getWallet,
} from '../lib/store.js';
import { createProviderClient, ActivationSetStatus } from '../lib/provider.js';

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
  const status = Number(input?.status);
  if (!activationId || ![3, 6, 8].includes(status)) {
    throw new EndpointError('Invalid activationId or status.', { code: 'BAD_INPUT' });
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
  const res = await client.setStatus(activationId, status);

  if (!res.ok) {
    throw new EndpointError(res.error || 'Could not update activation status.', {
      code: 'GATEWAY_ERROR',
    });
  }

  const dbStatus =
    status === ActivationSetStatus.CANCEL
      ? 'CANCEL'
      : status === ActivationSetStatus.COMPLETE
        ? 'COMPLETE'
        : 'WAIT_RESEND';

  if (order) {
    await updateOrderStatus(activationId, dbStatus);
  }

  let refundedCents = 0;
  let refundedPoints = 0;

  if (status === ActivationSetStatus.CANCEL && order) {
    if (order.paymentMethod === 'points' && Number(order.pointsSpent || 0) > 0) {
      const didMark = await markOrderRefunded(activationId);
      if (didMark) {
        await creditPoints({
          userId: order.userId,
          amountPoints: order.pointsSpent,
          type: 'refund',
          referenceId: activationId,
          note: `Cancelled activation #${activationId}`,
        });
        refundedPoints = Number(order.pointsSpent);
      }
    } else if (Number(order.retailCents || 0) > 0) {
      const didMark = await markOrderRefunded(activationId);
      if (didMark) {
        await creditWallet({
          userId: order.userId,
          amountCents: order.retailCents,
          type: 'refund',
          referenceId: activationId,
          note: `Cancelled activation #${activationId}`,
        });
        refundedCents = Number(order.retailCents);
      }
    }
  }

  const wallet = await getWallet(user.id);
  return {
    ok: true,
    status: dbStatus,
    refundedCents,
    refundedPoints,
    balanceCents: Number(wallet.balanceCents || 0),
    pointsBalance: Number(wallet.pointsBalance || 0),
  };
}
