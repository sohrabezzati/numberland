import { EndpointError } from 'sdk';
import {
  checkAccess,
  getApiConfig,
  getMarkupPercent,
  getPlatformStats,
  getAdminUsersPage,
} from '../lib/store.js';
import { createProviderClient } from '../lib/provider.js';

export default async function (input, ctx) {
  const user = ctx.initData?.user;
  if (!user?.id) {
    throw new EndpointError('Unauthorized', { code: 'UNAUTHORIZED' });
  }

  const access = await checkAccess(user.id);
  if (!access.authorized || !access.isOwner) {
    throw new EndpointError('Owner only.', { code: 'FORBIDDEN' });
  }

  const page = Math.max(0, Number(input?.page) || 0);
  const pageSize = Math.max(1, Math.min(20, Number(input?.pageSize) || 15));

  const [stats, markupPercent, usersPage, apiCfg] = await Promise.all([
    getPlatformStats(),
    getMarkupPercent(),
    getAdminUsersPage({ page, pageSize }),
    getApiConfig(),
  ]);

  let gatewayBalance = null;
  if (apiCfg.apiKey) {
    try {
      const client = createProviderClient(apiCfg.apiKey, apiCfg.baseUrl);
      const balRes = await client.getBalance();
      if (balRes.ok) gatewayBalance = balRes.balance;
    } catch {
      gatewayBalance = null;
    }
  }

  return {
    stats,
    markupPercent,
    gatewayBalance,
    usersPage,
  };
}
