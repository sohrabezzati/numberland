import { EndpointError } from 'sdk';
import { checkAccess } from '../lib/store.js';
import { ALL_SERVICES, POPULAR_SERVICES, searchServices } from '../lib/catalog.js';

export default async function (input, ctx) {
  const user = ctx.initData?.user;
  if (!user?.id) {
    throw new EndpointError('Unauthorized', { code: 'UNAUTHORIZED' });
  }

  const access = await checkAccess(user.id);
  if (!access.authorized) {
    throw new EndpointError('Your account is restricted.', { code: 'RESTRICTED' });
  }

  const query = String(input?.query || '').trim();
  const limit = Math.min(60, Math.max(1, Number(input?.limit) || 30));
  const offset = Math.max(0, Number(input?.offset) || 0);

  if (!query) {
    const mode = input?.mode === 'all' ? 'all' : 'popular';
    const list = mode === 'all' ? ALL_SERVICES : POPULAR_SERVICES;
    return {
      items: list.slice(offset, offset + limit),
      total: list.length,
      hasMore: offset + limit < list.length,
    };
  }

  const matches = searchServices(query, 100);
  return {
    items: matches.slice(offset, offset + limit),
    total: matches.length,
    hasMore: offset + limit < matches.length,
  };
}
