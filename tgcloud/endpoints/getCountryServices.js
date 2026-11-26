import { EndpointError } from 'sdk';
import { checkAccess, getApiConfig, getMarkupPercent } from '../lib/store.js';
import { createProviderClient, applyMarkup } from '../lib/provider.js';
import {
  ALL_SERVICES,
  POPULAR_SERVICE_CODES,
  findCountry,
  findService,
} from '../lib/catalog.js';

const POPULAR_SERVICE_RANK = new Map(POPULAR_SERVICE_CODES.map((code, idx) => [code, idx]));

export default async function (input, ctx) {
  const user = ctx.initData?.user;
  if (!user?.id) {
    throw new EndpointError('Unauthorized', { code: 'UNAUTHORIZED' });
  }

  const access = await checkAccess(user.id);
  if (!access.authorized) {
    throw new EndpointError('Your account is restricted.', { code: 'RESTRICTED' });
  }

  const countryId = String(input?.countryId || '16').trim();
  const country = findCountry(countryId) || { id: countryId, name: `Country #${countryId}`, flag: '🌍' };

  const { apiKey, baseUrl } = await getApiConfig();
  if (!apiKey) {
    throw new EndpointError('Platform gateway is not configured yet.', { code: 'NO_GATEWAY' });
  }

  const markupPercent = await getMarkupPercent();
  const client = createProviderClient(apiKey, baseUrl);
  const priceRes = await client.getPrices(undefined, countryId);

  const services = [];
  const seen = new Set();

  if (priceRes.ok && priceRes.entries.length > 0) {
    for (const entry of priceRes.entries) {
      const code = entry.service.toLowerCase();
      if (seen.has(code)) continue;
      seen.add(code);

      const known = findService(code);
      const retailPrice = applyMarkup(entry.basePrice, markupPercent);
      services.push({
        code: known ? known.code : entry.service,
        name: known ? known.name : entry.service.toUpperCase(),
        retailPrice,
        phones: entry.phones,
        popular: POPULAR_SERVICE_RANK.has(code),
        popRank: POPULAR_SERVICE_RANK.has(code) ? POPULAR_SERVICE_RANK.get(code) : 999,
      });
    }
  }

  // Sort: in-stock first, popular services first, then lowest price, then A-Z
  services.sort((a, b) => {
    if ((a.phones > 0) !== (b.phones > 0)) return a.phones > 0 ? -1 : 1;
    if (a.popRank !== b.popRank) return a.popRank - b.popRank;
    if (a.retailPrice !== null && b.retailPrice !== null && a.retailPrice !== b.retailPrice) {
      return a.retailPrice - b.retailPrice;
    }
    return a.name.localeCompare(b.name);
  });

  return {
    country,
    services,
    totalCatalogServices: ALL_SERVICES.length,
    liveLoaded: priceRes.ok,
    gatewayError: priceRes.ok ? null : priceRes.error,
  };
}
