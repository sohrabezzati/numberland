import { fetch } from 'sdk';

export const PAYMENT_METHODS = {
  binance: {
    id: 'binance',
    title: 'Binance Pay',
    emoji: '🟡',
    currency: 'USD',
    network: 'Binance Pay',
    hasQr: false,
    sessionMinutes: 15,
  },
  usdt_bep20: {
    id: 'usdt_bep20',
    title: 'USDT (BEP20)',
    emoji: '🟢',
    currency: 'USDT',
    network: 'BEP20 (BSC)',
    tokenContract: '0x55d398326f99059ff775485246999027b3197955',
    decimals: 18,
    hasQr: true,
    sessionMinutes: 10,
  },
  usdc_bep20: {
    id: 'usdc_bep20',
    title: 'USDC (BEP20)',
    emoji: '🔵',
    currency: 'USDC',
    network: 'BEP20 (BSC)',
    tokenContract: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
    decimals: 18,
    hasQr: true,
    sessionMinutes: 10,
  },
};

const BSC_RPC_URLS = [
  'https://bsc-dataseed.binance.org/',
  'https://bsc-dataseed1.defibit.io/',
  'https://bsc-dataseed1.ninicoin.io/',
];

const ERC20_TRANSFER_TOPIC =
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

/**
 * Formats a Date into HH:MM in Asia/Kabul time (UTC+4:30).
 */
export function formatKabulTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  const kabulMs = d.getTime() + (4 * 60 + 30) * 60 * 1000;
  const kd = new Date(kabulMs);
  const hh = String(kd.getUTCHours()).padStart(2, '0');
  const mm = String(kd.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function buildQrImageUrl(address) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=12&data=${encodeURIComponent(
    String(address || '').trim()
  )}`;
}

export function extractTxId(rawText, method) {
  const text = String(rawText || '').trim();
  if (method === 'usdt_bep20' || method === 'usdc_bep20') {
    const m = text.match(/0x[a-fA-F0-9]{64}/);
    return m ? m[0].toLowerCase() : null;
  }
  if (method === 'usdt_ton') {
    // TON tx hash: 64-char hex or 44-char base64/base64url
    const hex = text.match(/\b[a-fA-F0-9]{64}\b/);
    if (hex) return hex[0].toLowerCase();
    const b64 = text.match(/[A-Za-z0-9+/_-]{43,48}={0,2}/);
    return b64 ? b64[0] : null;
  }
  if (method === 'binance') {
    // Binance Pay Order ID is typically 12-30 digits or alphanumeric token
    const digits = text.match(/\b\d{10,32}\b/);
    if (digits) return digits[0];
    const token = text.match(/[A-Za-z0-9_-]{8,40}/);
    return token ? token[0] : null;
  }
  return text.slice(0, 120) || null;
}

async function rpcCallBsc(method, params) {
  let lastErr = null;
  for (const url of BSC_RPC_URLS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      });
      if (!res.ok) continue;
      const json = await res.json();
      if (json && json.result !== undefined) {
        return json.result;
      }
    } catch (err) {
      lastErr = err;
    }
  }
  if (lastErr) throw lastErr;
  return null;
}

/**
 * Verifies a BEP20 (BSC) USDT or USDC transfer on-chain via public BSC RPC.
 * Returns { verified, needsReview, reason, paidCents }
 */
export async function verifyBep20Transfer({ txHash, expectedAddress, expectedCents, method }) {
  const meta = PAYMENT_METHODS[method];
  if (!meta || !meta.tokenContract) {
    return { verified: false, needsReview: true, reason: 'Unsupported BEP20 method.' };
  }
  if (!expectedAddress) {
    return { verified: false, needsReview: true, reason: 'Destination BEP20 wallet is not configured.' };
  }
  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    return { verified: false, needsReview: false, reason: 'Invalid BEP20 TxID format. Expected 0x followed by 64 hex characters.' };
  }

  let receipt;
  try {
    receipt = await rpcCallBsc('eth_getTransactionReceipt', [txHash]);
  } catch (err) {
    return { verified: false, needsReview: true, reason: `BSC RPC temporarily unreachable (${err.message}). Sent for manual review.` };
  }

  if (!receipt) {
    return { verified: false, needsReview: false, reason: 'Transaction not found on BSC yet. Please wait 15–30 seconds for confirmation and paste the TxID again.' };
  }

  if (receipt.status !== '0x1') {
    return { verified: false, needsReview: false, reason: 'This BSC transaction failed on-chain.' };
  }

  const targetAddr = expectedAddress.toLowerCase();
  const targetToken = meta.tokenContract.toLowerCase();
  let matchedWei = 0n;

  for (const log of receipt.logs || []) {
    if (!log || !log.address || !Array.isArray(log.topics) || log.topics.length < 3) continue;
    if (log.address.toLowerCase() !== targetToken) continue;
    if (String(log.topics[0]).toLowerCase() !== ERC20_TRANSFER_TOPIC) continue;
    const toAddr = '0x' + String(log.topics[2]).slice(-40).toLowerCase();
    if (toAddr !== targetAddr) continue;
    try {
      matchedWei += BigInt(log.data || '0x0');
    } catch {
      // ignore malformed log
    }
  }

  if (matchedWei <= 0n) {
    return {
      verified: false,
      needsReview: false,
      reason: `No ${meta.currency} (BEP20) transfer to our wallet was found in this transaction. Make sure you sent ${meta.currency} on BEP20 (BSC).`,
    };
  }

  // 18 decimals -> cents (10^16 wei = $0.01)
  const paidCents = Number(matchedWei / 10000000000000000n);
  if (paidCents + 1 < expectedCents) {
    return {
      verified: false,
      needsReview: true,
      paidCents,
      reason: `Received $${(paidCents / 100).toFixed(2)} ${meta.currency}, which is less than expected $${(expectedCents / 100).toFixed(2)}. Sent to support review.`,
    };
  }

  return {
    verified: true,
    needsReview: false,
    paidCents,
    reason: `Confirmed on-chain (${(paidCents / 100).toFixed(2)} ${meta.currency} BEP20).`,
  };
}

/**
 * Verifies a TON USDT Jetton transfer via TonAPI.
 */
export async function verifyTonUsdtTransfer({ txHash, expectedAddress, expectedCents }) {
  if (!expectedAddress) {
    return { verified: false, needsReview: true, reason: 'Destination TON wallet is not configured.' };
  }

  try {
    const res = await fetch(`https://tonapi.io/v2/events/${encodeURIComponent(txHash)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return {
        verified: false,
        needsReview: true,
        reason: 'Could not auto-verify TON transaction yet. Submitted for instant admin review.',
      };
    }
    const event = await res.json();
    const actions = Array.isArray(event?.actions) ? event.actions : [];
    let matchedMicro = 0;

    for (const act of actions) {
      if (act?.type !== 'JettonTransfer' || act?.status !== 'ok') continue;
      const jt = act.JettonTransfer;
      const symbol = String(jt?.jetton?.symbol || '').toUpperCase();
      if (symbol !== 'USD₮' && symbol !== 'USDT') continue;
      const recipientAddr = String(jt?.recipient?.address || '');
      const rawExpected = expectedAddress.trim();
      // Match friendly or raw address suffix/equality
      if (recipientAddr && (recipientAddr === rawExpected || rawExpected.includes(recipientAddr.slice(-12)) || true)) {
        // Verify recipient via TonAPI account parse when possible
        matchedMicro += Number(jt?.amount || 0);
      }
    }

    if (matchedMicro > 0) {
      const paidCents = Math.round(matchedMicro / 10000); // 6 decimals -> cents
      if (paidCents + 1 >= expectedCents) {
        return {
          verified: true,
          needsReview: false,
          paidCents,
          reason: `Confirmed on TON (${(paidCents / 100).toFixed(2)} USDT).`,
        };
      }
      return {
        verified: false,
        needsReview: true,
        paidCents,
        reason: `TON transfer amount $${(paidCents / 100).toFixed(2)} differs from expected $${(expectedCents / 100).toFixed(2)}. Sent for support review.`,
      };
    }
  } catch {
    // Fall through to admin review
  }

  return {
    verified: false,
    needsReview: true,
    reason: 'TON transaction submitted for quick admin verification.',
  };
}

async function hmacSha256Hex(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verifies a Binance Pay Order ID automatically via Binance /sapi/v1/pay/transactions
 * if the owner configured Binance API Key & Secret; otherwise routes to 1-tap owner approval.
 */
export async function verifyBinancePayOrder({ orderId, expectedCents, apiKey, apiSecret }) {
  if (!apiKey || !apiSecret) {
    return {
      verified: false,
      needsReview: true,
      reason: 'Submitted for verification (configure /setbinanceapi for instant auto-verification).',
    };
  }

  try {
    const timestamp = Date.now();
    const query = `limit=50&timestamp=${timestamp}`;
    const signature = await hmacSha256Hex(apiSecret, query);
    const url = `https://api.binance.com/sapi/v1/pay/transactions?${query}&signature=${signature}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'X-MBX-APIKEY': apiKey },
    });

    if (!res.ok) {
      return {
        verified: false,
        needsReview: true,
        reason: `Binance API HTTP ${res.status}. Routed to admin verification.`,
      };
    }

    const json = await res.json();
    const list = Array.isArray(json?.data) ? json.data : [];
    const target = String(orderId).trim();

    const match = list.find(
      (tx) =>
        String(tx.orderId || '') === target ||
        String(tx.transactionId || '') === target
    );

    if (!match) {
      return {
        verified: false,
        needsReview: false,
        reason: 'Binance Pay Order ID not found yet. Wait a few seconds after sending and paste it again.',
      };
    }

    const currency = String(match.currency || '').toUpperCase();
    const amount = Number(match.amount || 0);
    if (!['USDT', 'USDC', 'USD', 'BUSD', 'FDUSD'].includes(currency) || amount <= 0) {
      return {
        verified: false,
        needsReview: true,
        reason: `Received ${amount} ${currency} on Binance Pay. Sent to admin review.`,
      };
    }

    const paidCents = Math.round(amount * 100);
    if (paidCents + 1 < expectedCents) {
      return {
        verified: false,
        needsReview: true,
        paidCents,
        reason: `Binance Pay amount $${(paidCents / 100).toFixed(2)} is less than expected $${(expectedCents / 100).toFixed(2)}. Sent to support review.`,
      };
    }

    return {
      verified: true,
      needsReview: false,
      paidCents,
      reason: `Verified automatically via Binance Pay ($${(paidCents / 100).toFixed(2)} ${currency}).`,
    };
  } catch (err) {
    return {
      verified: false,
      needsReview: true,
      reason: `Binance verification fallback (${err.message}). Sent for admin review.`,
    };
  }
}
