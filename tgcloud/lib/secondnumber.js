import { fetch } from 'sdk';

export const DEFAULT_BASE_URL = 'https://secondnumber.io/stubs/handler_api.php';

export const ActivationSetStatus = {
  SMS_SENT: 1,
  REQUEST_MORE_SMS: 3,
  COMPLETE: 6,
  CANCEL: 8,
};

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
    BAD_KEY: 'Invalid SecondNumber API key (BAD_KEY).',
    BAD_ACTION: 'Invalid API action parameter (BAD_ACTION).',
    BAD_SERVICE: 'Invalid service code (BAD_SERVICE).',
    BAD_STATUS: 'Invalid status code parameter (BAD_STATUS).',
    BAD_ACTIVATION_TYPE: 'Invalid activation type (BAD_ACTIVATION_TYPE).',
    MAX_PRICE_EXCEED: 'Max price is lower than the current number price (MAX_PRICE_EXCEED).',
    NO_NUMBERS: 'No virtual numbers currently available for this service/country (NO_NUMBERS).',
    NO_BALANCE: 'Insufficient balance on SecondNumber.io (NO_BALANCE).',
    NO_ACTIVATION: 'Activation ID not found or invalid (NO_ACTIVATION).',
    EARLY_CANCEL_DENIED: 'Cannot cancel yet; please wait a couple of minutes first (EARLY_CANCEL_DENIED).',
    ERROR_SQL: 'Remote gateway error (ERROR_SQL).',
  };
  return errors[code] || `API Error: ${code}`;
}

export function createSecondNumberClient(apiKey, baseUrl = DEFAULT_BASE_URL) {
  async function request(params) {
    const url = buildUrl(baseUrl || DEFAULT_BASE_URL, {
      api_key: apiKey,
      ...params,
    });

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'text/plain, application/json, */*',
      },
    });

    if (!res.ok) {
      throw new Error(`SecondNumber HTTP ${res.status}: ${res.statusText}`);
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

    async getNumber(service, country, maxPrice) {
      const params = {
        action: 'getNumber',
        service: String(service).trim(),
        country: String(country).trim(),
      };
      if (maxPrice) {
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
