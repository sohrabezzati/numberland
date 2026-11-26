import { EndpointError } from 'sdk';
import {
  checkAccess,
  getApiConfig,
  getMarkupPercent,
  getPointsPerUsd,
  getServicePointsOverride,
  computeRequiredPointsSync,
  usdToCents,
} from '../lib/store.js';
import { createProviderClient, applyMarkup } from '../lib/provider.js';
import {
  ALL_COUNTRIES,
  POPULAR_COUNTRY_IDS,
  findService,
  findCountry,
  searchCountries,
} from '../lib/catalog.js';

const POPULAR_RANK = new Map(POPULAR_COUNTRY_IDS.map((id, idx) => [id, idx]));

// Broad set of high-liquidity countries queried in parallel when the gateway
// requires a country parameter on getPrices.
const FALLBACK_COUNTRY_IDS = [
  '16', '187', '36', '43', '48', '78', '6', '4', '22', '73', '15', '117',
  '74', '62', '95', '0', '1', '2', '10', '7', '33', '56', '86', '54',
];

async function fetchServicePricesByCountry(client, serviceCode, requestedCountryId) {
  const byCountry = new Map();

  // 1. Try single-call service query first
  try {
    const direct = await client.getPrices(serviceCode);
    if (direct.ok && direct.byCountry.size > 0) {
      for (const [cid, item] of direct.byCountry.entries()) {
        byCountry.set(String(cid), item);
      }
    }
  } catch {
    // Fall through to per-country fallback
  }

  // 2. If gateway requires country param (returned empty), fan out across popular countries
  if (byCountry.size === 0) {
    const targetIds = Array.from(
      new Set([
        ...(requestedCountryId ? [requestedCountryId] : []),
        ...FALLBACK_COUNTRY_IDS,
      ])
    );

    const settled = await Promise.allSettled(
      targetIds.map(async (cid) => {
        const res = await client.getPrices(serviceCode, cid);
        if (!res.ok) return null;
        const item =
          res.byCountry.get(String(cid)) ||
          res.byService.get(serviceCode.toLowerCase()) ||
          res.entries[0] ||
          null;
        return item ? { cid: String(cid), item } : null;
      })
    );

    for (const r of settled) {
      if (r.status === 'fulfilled' && r.value) {
        byCountry.set(r.value.cid, r.value.item);
      }
    }
  } else if (requestedCountryId && !byCountry.has(requestedCountryId)) {
    // Ensure explicitly selected country is always checked
    try {
      const res = await client.getPrices(serviceCode, requestedCountryId);
      const item =
        res.ok &&
        (res.byCountry.get(requestedCountryId) ||
          res.byService.get(serviceCode.toLowerCase()) ||
          res.entries[0]);
      if (item) {
        byCountry.set(requestedCountryId, item);
      }
    } catch {
      // Ignore single-country lookup error
    }
  }

  return byCountry;
}

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
  if (!serviceCode) {
    throw new EndpointError('serviceCode is required', { code: 'BAD_INPUT' });
  }

  const requestedCountryId = String(input?.countryId || '').trim();

  const { apiKey, baseUrl } = await getApiConfig();
  if (!apiKey) {
    throw new EndpointError('Platform gateway is not configured yet.', { code: 'NO_GATEWAY' });
  }

  const [markupPercent, pointsPerUsd, serviceOverride] = await Promise.all([
    getMarkupPercent(),
    getPointsPerUsd(),
    getServicePointsOverride(serviceCode),
  ]);
  const overridesMap = serviceOverride !== null ? { [serviceCode.toLowerCase()]: serviceOverride } : {};
  const client = createProviderClient(apiKey, baseUrl);
  const byCountry = await fetchServicePricesByCountry(client, serviceCode, requestedCountryId);

  const countryQuery = String(input?.countryQuery || '').trim();
  const baseCountries = countryQuery ? searchCountries(countryQuery, 100) : ALL_COUNTRIES;

  const merged = [];
  const seen = new Set();

  for (const c of baseCountries) {
    seen.add(c.id);
    const live = byCountry.get(c.id);
    if (!live && !countryQuery) continue;
    const retailPrice = live ? applyMarkup(live.basePrice, markupPercent) : null;
    const retailCents = retailPrice !== null ? Math.max(1, usdToCents(retailPrice)) : null;
    const requiredPoints =
      retailCents !== null
        ? computeRequiredPointsSync(serviceCode, retailCents, pointsPerUsd, overridesMap)
        : null;
    const phones = live ? live.phones : 0;
    if (!countryQuery && phones <= 0) continue;
    merged.push({
      id: c.id,
      name: c.name,
      flag: c.flag,
      retailPrice,
      requiredPoints,
      phones,
      popRank: POPULAR_RANK.has(c.id) ? POPULAR_RANK.get(c.id) : 999,
    });
  }

  if (!countryQuery) {
    for (const [cid, live] of byCountry.entries()) {
      if (seen.has(cid) || live.phones <= 0) continue;
      const known = findCountry(cid);
      const retailPrice = applyMarkup(live.basePrice, markupPercent);
      const retailCents = Math.max(1, usdToCents(retailPrice));
      merged.push({
        id: cid,
        name: known ? known.name : `Country #${cid}`,
        flag: known ? known.flag : '🌍',
        retailPrice,
        requiredPoints: computeRequiredPointsSync(serviceCode, retailCents, pointsPerUsd, overridesMap),
        phones: live.phones,
        popRank: POPULAR_RANK.has(cid) ? POPULAR_RANK.get(cid) : 999,
      });
    }
  }

  merged.sort((a, b) => {
    if ((a.phones > 0) !== (b.phones > 0)) return a.phones > 0 ? -1 : 1;
    if (a.popRank !== b.popRank) return a.popRank - b.popRank;
    if (a.retailPrice !== null && b.retailPrice !== null && a.retailPrice !== b.retailPrice) {
      return a.retailPrice - b.retailPrice;
    }
    return a.name.localeCompare(b.name);
  });

  const svc = findService(serviceCode);
  return {
    service: svc || { code: serviceCode, name: serviceCode, emoji: '📱' },
    countries: merged,
  };
}
