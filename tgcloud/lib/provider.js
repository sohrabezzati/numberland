import { fetch } from 'sdk';

export const DEFAULT_BASE_URL = 'https://secondnumber.io/stubs/handler_api.php';
export const DEFAULT_MARKUP_PERCENT = 20;

export const ActivationSetStatus = {
  SMS_SENT: 1,
  REQUEST_MORE_SMS: 3,
  COMPLETE: 6,
  CANCEL: 8,
};

export function applyMarkup(basePrice, markupPercent = DEFAULT_MARKUP_PERCENT) {
  const num = Number(basePrice);
  if (!Number.isFinite(num) || num < 0) return null;
  const pct = Number.isFinite(Number(markupPercent)) ? Number(markupPercent) : DEFAULT_MARKUP_PERCENT;
  return Math.round(num * (1 + pct / 100) * 100) / 100;
}

export function removeMarkup(retailPrice, markupPercent = DEFAULT_MARKUP_PERCENT) {
  const num = Number(retailPrice);
  if (!Number.isFinite(num) || num <= 0) return null;
  const pct = Number.isFinite(Number(markupPercent)) ? Number(markupPercent) : DEFAULT_MARKUP_PERCENT;
  const divisor = 1 + pct / 100;
  if (divisor <= 0) return num;
  return Math.floor((num / divisor) * 100) / 100;
}

export function formatPrice(price) {
  const num = Number(price);
  if (!Number.isFinite(num)) return 'N/A';
  return `$${num.toFixed(2)}`;
}

function buildUrl(baseUrl, params) {
  const pairs = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }
  const sep = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${sep}${pairs.join('&')}`;
}

function formatError(code) {
  const errors = {
    BAD_KEY: 'Invalid gateway API key (BAD_KEY).',
    BAD_ACTION: 'Invalid gateway action parameter (BAD_ACTION).',
    BAD_SERVICE: 'Unsupported or invalid service code (BAD_SERVICE).',
    BAD_STATUS: 'Invalid activation status parameter (BAD_STATUS).',
    BAD_ACTIVATION_TYPE: 'Invalid activation type (BAD_ACTIVATION_TYPE).',
    MAX_PRICE_EXCEED: 'Max price is lower than the current number price (MAX_PRICE_EXCEED).',
    NO_NUMBERS: 'No virtual numbers currently available for this service and country.',
    NO_BALANCE: 'Insufficient platform gateway balance. Please top up and try again.',
    NO_ACTIVATION: 'Activation ID not found or expired.',
    EARLY_CANCEL_DENIED: 'Cannot cancel yet — please wait a couple of minutes before cancelling.',
    ERROR_SQL: 'Temporary gateway error. Please try again shortly.',
  };
  return errors[code] || `Gateway Error: ${code}`;
}

function isNumericId(val) {
  return /^\d+$/.test(String(val));
}

function parsePricesPayload(data, requestedService, requestedCountry) {
  const entries = [];
  const byCountry = new Map();
  const byService = new Map();

  if (!data || typeof data !== 'object') {
    return { entries, byCountry, byService };
  }

  // Primary format returned by gateway:
  // [{ "country_code": 16, "service_code": "tg", "cost": "0.850000", "count": 3254 }, ...]
  if (Array.isArray(data)) {
    for (const row of data) {
      if (!row || typeof row !== 'object') continue;
      const serviceCode = String(row.service_code ?? row.service ?? requestedService ?? '').trim();
      const countryId = String(row.country_code ?? row.country ?? requestedCountry ?? '').trim();
      const basePrice = Number(row.cost ?? row.price);
      const phones = Number(row.count ?? row.phones ?? 0);
      if (!serviceCode || !countryId || !Number.isFinite(basePrice)) continue;

      const item = {
        service: serviceCode,
        country: countryId,
        basePrice,
        phones: Number.isFinite(phones) ? phones : 0,
      };
      entries.push(item);
      byCountry.set(item.country, item);
      byService.set(item.service.toLowerCase(), item);
    }
    return { entries, byCountry, byService };
  }

  // Handle direct leaf response: { price, phones } or { cost, count }
  if (
    (data.price !== undefined || data.cost !== undefined) &&
    requestedService &&
    requestedCountry
  ) {
    const basePrice = Number(data.price ?? data.cost);
    const phones = Number(data.phones ?? data.count ?? 0);
    if (Number.isFinite(basePrice)) {
      const item = {
        service: String(requestedService),
        country: String(requestedCountry),
        basePrice,
        phones: Number.isFinite(phones) ? phones : 0,
      };
      entries.push(item);
      byCountry.set(item.country, item);
      byService.set(item.service.toLowerCase(), item);
    }
    return { entries, byCountry, byService };
  }

  for (const [outerKey, outerVal] of Object.entries(data)) {
    if (!outerVal || typeof outerVal !== 'object') continue;

    // Handle 1-level map: { "$service": { price, phones } } or { "$country": { price, phones } }
    if (outerVal.price !== undefined || outerVal.cost !== undefined) {
      const basePrice = Number(outerVal.price ?? outerVal.cost);
      const phones = Number(outerVal.phones ?? outerVal.count ?? 0);
      if (!Number.isFinite(basePrice)) continue;
      const serviceCode = requestedService ? String(requestedService) : String(outerKey);
      const countryId = requestedCountry ? String(requestedCountry) : String(outerKey);
      const item = {
        service: serviceCode,
        country: countryId,
        basePrice,
        phones: Number.isFinite(phones) ? phones : 0,
      };
      entries.push(item);
      byCountry.set(item.country, item);
      byService.set(item.service.toLowerCase(), item);
      continue;
    }

    // Handle 2-level map:
    // Format A (documented): { "$service": { "$country": { "price": ..., "phones": ... } } }
    // Format B (SMS-Activate style): { "$country": { "$service": { "cost": ..., "count": ... } } }
    for (const [innerKey, leaf] of Object.entries(outerVal)) {
      if (!leaf || typeof leaf !== 'object') continue;
      const rawPrice = leaf.price ?? leaf.cost;
      const rawPhones = leaf.phones ?? leaf.count ?? 0;
      const basePrice = Number(rawPrice);
      const phones = Number(rawPhones);
      if (!Number.isFinite(basePrice)) continue;

      let serviceCode = outerKey;
      let countryId = innerKey;

      const outerIsCountry =
        (requestedCountry && String(outerKey) === String(requestedCountry)) ||
        (requestedService && innerKey.toLowerCase() === String(requestedService).toLowerCase()) ||
        (isNumericId(outerKey) && !isNumericId(innerKey));

      if (outerIsCountry) {
        countryId = outerKey;
        serviceCode = innerKey;
      }

      const item = {
        service: String(serviceCode),
        country: String(countryId),
        basePrice,
        phones: Number.isFinite(phones) ? phones : 0,
      };
      entries.push(item);
      byCountry.set(item.country, item);
      byService.set(item.service.toLowerCase(), item);
    }
  }

  return { entries, byCountry, byService };
}

export function createProviderClient(apiKey, baseUrl = DEFAULT_BASE_URL) {
  async function request(params) {
    const url = buildUrl(baseUrl || DEFAULT_BASE_URL, {
      api_key: apiKey,
      ...params,
    });

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json, text/plain, */*',
      },
    });

    if (!res.ok) {
      throw new Error(`Gateway HTTP ${res.status}: ${res.statusText}`);
    }

    return (await res.text()).trim();
  }

  return {
    async getBalance() {
      const raw = await request({ action: 'getBalance' });
      const match = raw.match(/^ACCESS_BALANCE\s*[:\-]\s*(.+)$/i);
      if (match) {
        return { ok: true, balance: match[1].trim(), raw };
      }
      return { ok: false, error: formatError(raw), raw };
    },

    async getPrices(service, country) {
      const params = { action: 'getPrices' };
      if (service) params.service = String(service).trim();
      if (country) params.country = String(country).trim();

      const raw = await request(params);
      if (!raw || (!raw.startsWith('{') && !raw.startsWith('['))) {
        return {
          ok: false,
          error: formatError(raw),
          raw,
          entries: [],
          byCountry: new Map(),
          byService: new Map(),
        };
      }

      try {
        const parsed = JSON.parse(raw);
        const { entries, byCountry, byService } = parsePricesPayload(parsed, service, country);
        return { ok: true, entries, byCountry, byService, raw };
      } catch {
        return {
          ok: false,
          error: 'Invalid pricing response from gateway.',
          raw,
          entries: [],
          byCountry: new Map(),
          byService: new Map(),
        };
      }
    },

    async getNumber(service, country, maxPrice) {
      const params = {
        action: 'getNumber',
        service: String(service).trim(),
        country: String(country).trim(),
      };
      if (maxPrice !== undefined && maxPrice !== null && maxPrice !== '') {
        params.maxPrice = String(maxPrice).trim();
      }

      const raw = await request(params);
      const match = raw.match(/^ACCESS_NUMBER\s*[:\-]\s*([^:\-\s]+)\s*[:\-]\s*(.+)$/i);
      if (match) {
        return {
          ok: true,
          activationId: match[1].trim(),
          phoneNumber: match[2].trim(),
          raw,
        };
      }
      return { ok: false, error: formatError(raw), raw };
    },

    async getStatus(activationId) {
      const raw = await request({
        action: 'getStatus',
        id: String(activationId).trim(),
      });

      if (/^STATUS_WAIT_CODE$/i.test(raw)) {
        return { ok: true, state: 'WAIT_CODE', raw };
      }
      if (/^STATUS_WAIT_RESEND$/i.test(raw)) {
        return { ok: true, state: 'WAIT_RESEND', raw };
      }
      if (/^STATUS_CANCEL$/i.test(raw)) {
        return { ok: true, state: 'CANCEL', raw };
      }

      const okMatch = raw.match(/^STATUS_OK\s*[:\-]\s*(.+)$/i);
      if (okMatch) {
        const cleanedCode = okMatch[1].trim().replace(/^['"]|['"]$/g, '');
        return { ok: true, state: 'OK', code: cleanedCode, raw };
      }

      return { ok: false, state: 'ERROR', error: formatError(raw), raw };
    },

    async setStatus(activationId, status) {
      const raw = await request({
        action: 'setStatus',
        id: String(activationId).trim(),
        status: String(status),
      });

      if (/^ACCESS_/i.test(raw)) {
        return { ok: true, statusText: raw, raw };
      }
      return { ok: false, statusText: raw, error: formatError(raw), raw };
    },
  };
}
