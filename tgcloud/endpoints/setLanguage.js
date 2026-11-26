import { EndpointError } from 'sdk';
import { checkAccess, setUserLang } from '../lib/store.js';

export default async function (input, ctx) {
  const user = ctx.initData?.user;
  if (!user?.id) {
    throw new EndpointError('Unauthorized', { code: 'UNAUTHORIZED' });
  }

  const access = await checkAccess(user.id);
  if (!access.authorized) {
    throw new EndpointError('Your account is restricted.', { code: 'RESTRICTED' });
  }

  const lang = await setUserLang(user.id, input?.lang);
  return { ok: true, lang };
}
