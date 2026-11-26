import { api } from 'sdk';
import {
  PAYMENT_METHODS,
  formatKabulTime,
  buildQrImageUrl,
  extractTxId,
  verifyBep20Transfer,
  verifyTonUsdtTransfer,
  verifyBinancePayOrder,
} from './verifier.js';
import {
  centsToUsdString,
  getPaymentAddresses,
  getOwnerId,
  getWallet,
  creditWallet,
  calculateRequiredPoints,
  createDepositRequest,
  getDepositRequest,
  findDepositByTxId,
  attachDepositTxId,
  setUserState,
  clearUserState,
} from './store.js';
import { findServiceName, findCountryName } from './catalog.js';
import {
  escapeHtml,
  sendHtml,
  editHtml,
  buildMainMenuKeyboard,
  buildDepositApprovalKeyboard,
} from './ui.js';
import { runBuyNumberAction } from './actions.js';
import { t } from './i18n.js';

export function buildPaymentMethodsKeyboard({
  amountCents,
  walletBalanceCents = null,
  pointsBalance = null,
  requiredPoints = null,
  serviceCode = null,
  countryId = null,
  starsPerUsd = 50,
  lang = 'en',
}) {
  const rows = [];
  const usd = (amountCents / 100).toFixed(2);
  const stars = Math.max(1, Math.round((amountCents / 100) * starsPerUsd));
  const isServiceCheckout = Boolean(serviceCode && countryId);

  if (isServiceCheckout && walletBalanceCents !== null) {
    if (walletBalanceCents >= amountCents) {
      rows.push([
        {
          text:
            lang === 'fa'
              ? `پرداخت از کیف پول ($${usd})`
              : `Pay from Wallet ($${usd})`,
          callback_data: `buy:${serviceCode}:${countryId}`,
        },
      ]);
    } else {
      const shortUsd = ((amountCents - walletBalanceCents) / 100).toFixed(2);
      rows.push([
        {
          text:
            lang === 'fa'
              ? `کیف پول — کسری $${shortUsd}`
              : `Wallet — short $${shortUsd}`,
          callback_data: 'noop',
        },
      ]);
    }
  }

  if (isServiceCheckout && requiredPoints !== null && requiredPoints > 0) {
    const ptsBal = Number(pointsBalance || 0);
    if (ptsBal >= requiredPoints) {
      rows.push([
        {
          text:
            lang === 'fa'
              ? `پرداخت با امتیاز (${requiredPoints.toLocaleString()} امتیاز)`
              : `Pay with Points (${requiredPoints.toLocaleString()} pts)`,
          callback_data: `buyp:${serviceCode}:${countryId}`,
        },
      ]);
    } else {
      rows.push([
        {
          text:
            lang === 'fa'
              ? `امتیاز (${ptsBal}/${requiredPoints}) · کسب امتیاز`
              : `Points (${ptsBal}/${requiredPoints} pts) · Earn More`,
          callback_data: 'menu:referral',
        },
      ]);
    }
  }

  // Exact prefix for either service checkout or wallet top-up
  const mkCb = (method) =>
    isServiceCheckout
      ? `paysvc:${method}:${serviceCode}:${countryId}:${amountCents}`
      : `paytop:${method}:${amountCents}`;

  rows.push([{ text: `Telegram Stars · ${stars} Stars`, callback_data: mkCb('stars') }]);
  rows.push([{ text: 'Binance Pay', callback_data: mkCb('binance') }]);
  rows.push([
    { text: 'USDT (BEP20)', callback_data: mkCb('usdt_bep20') },
    { text: 'USDC (BEP20)', callback_data: mkCb('usdc_bep20') },
  ]);

  rows.push([
    {
      text: lang === 'fa' ? '‹ بازگشت' : '‹ Back',
      callback_data: isServiceCheckout ? `pickctry:${countryId}` : 'menu:wallet',
    },
  ]);

  return { inline_keyboard: rows };
}

export function buildTopUpAmountKeyboard(lang = 'en') {
  const presets = [2, 5, 10, 25, 50, 100];
  const rows = [];
  for (let i = 0; i < presets.length; i += 3) {
    rows.push(
      presets.slice(i, i + 3).map((usd) => ({
        text: `$${usd}`,
        callback_data: `topamt:${usd * 100}`,
      }))
    );
  }
  rows.push([
    {
      text: lang === 'fa' ? '‹ کیف پول' : '‹ Wallet',
      callback_data: 'menu:wallet',
    },
    {
      text: lang === 'fa' ? '‹ منوی اصلی' : '‹ Main Menu',
      callback_data: 'menu:main',
    },
  ]);
  return { inline_keyboard: rows };
}

export function formatPaymentOrderMessage({ deposit, address, lang = 'en' }) {
  const meta = PAYMENT_METHODS[deposit.method] || PAYMENT_METHODS.usdt_bep20;
  const amountStr = (deposit.amountCents / 100).toFixed(2);
  const serviceLine =
    deposit.targetService && deposit.targetCountry
      ? `📦 <b>${lang === 'fa' ? 'سرویس' : 'Service'}:</b> ${escapeHtml(
          findServiceName(deposit.targetService)
        )} (${escapeHtml(findCountryName(deposit.targetCountry))})`
      : null;

  if (deposit.method === 'binance') {
    const lines = [
      `💳 <b>${meta.title}</b>`,
      '',
      `📄 <b>Order ID:</b> <code>#${deposit.id}</code>`,
      `💰 <b>Amount:</b> <code>${amountStr} USD</code>`,
      ...(serviceLine ? [serviceLine] : []),
      '',
      lang === 'fa'
        ? 'مبلغ را به این شناسه بایننس پی (UID) ارسال کنید:'
        : 'Send payment to this Binance Pay ID (UID):',
      '',
      `<code>${escapeHtml(address)}</code>`,
      '',
      lang === 'fa'
        ? 'پس از ارسال پرداخت، <b>Binance Pay Order ID</b> خود را در همین چت ارسال کنید تا به صورت خودکار بررسی و تایید شود.'
        : 'After sending payment, paste your <b>Binance Pay Order ID</b> in this chat. It will be verified automatically.',
    ];
    return lines.join('\n');
  }

  const expiresDate = deposit.expiresAt ? new Date(deposit.expiresAt) : new Date(Date.now() + 10 * 60 * 1000);
  const kabulDeadline = formatKabulTime(expiresDate);

  const lines = [
    `💳 <b>${meta.title}</b>`,
    '',
    `📄 <b>Order ID:</b> <code>#${deposit.id}</code>`,
    `💰 <b>Amount:</b> <code>${amountStr} ${meta.currency}</code>`,
    ...(serviceLine ? [serviceLine] : []),
    '',
    lang === 'fa'
      ? `⏱ مهلت پرداخت: ۱۰ دقیقه. ارسال قبل از: <b>${kabulDeadline} (به وقت کابل)</b>.`
      : `Payment session: 10 minutes. Send before: <b>${kabulDeadline} (Kabul time)</b>.`,
    lang === 'fa'
      ? 'پس از پایان مهلت، پرداخت نکنید. اگر قبلاً ارسال کرده‌اید، TxID را بفرستید تا پشتیبانی بررسی کند.'
      : 'After expiry, do not send payment. If you already sent it, submit its TxID; late transfers need support review.',
    lang === 'fa'
      ? 'لطفاً دقیقاً همین مبلغ را با تمام ارقام اعشار ارسال کنید (برای این سفارش رزرو شده است).'
      : 'Send this exact amount, including every decimal digit. It is reserved for this order.',
    '',
    lang === 'fa'
      ? `پرداخت را به این آدرس کیف پول ${meta.currency} (${meta.network}) ارسال کنید:`
      : `Send payment to this ${meta.currency} ${meta.network} wallet address:`,
    '',
    `<code>${escapeHtml(address)}</code>`,
    '',
    lang === 'fa'
      ? 'کد QR بالا را اسکن کنید یا آدرس را کپی نمایید.'
      : 'Scan the QR code above to pay, or copy it.',
    '',
    lang === 'fa'
      ? `⚠️ <b>فقط ${meta.currency} روی شبکه ${meta.network} ارسال کنید.</b>`
      : `⚠️ <b>Only send ${meta.currency} on the ${meta.network} network.</b>`,
    '',
    lang === 'fa'
      ? 'پس از ارسال، <b>شناسه تراکنش (TxID)</b> را در همین چت ارسال کنید. به صورت خودکار تایید می‌شود.'
      : 'After sending payment, paste your <b>transaction ID (TxID)</b> in this chat. It will be verified automatically.',
  ];
  return lines.join('\n');
}

export async function createPaymentOrderAndSend({
  chatId,
  userId,
  amountCents,
  method,
  targetService = null,
  targetCountry = null,
  lang = 'en',
}) {
  const meta = PAYMENT_METHODS[method];
  if (!meta) {
    await sendHtml(chatId, '⚠️ Unsupported payment method.');
    return null;
  }

  const addresses = await getPaymentAddresses();
  const address = addresses[method];
  if (!address) {
    const msg =
      lang === 'fa'
        ? `⚠️ روش پرداخت <b>${meta.title}</b> هنوز توسط مدیر تنظیم نشده است. لطفاً روش دیگری انتخاب کنید.`
        : `⚠️ <b>${meta.title}</b> wallet address is not configured by the admin yet. Please choose another method or ask admin to run <code>/setpay ${method} ADDRESS</code>.`;
    await sendHtml(chatId, msg, buildMainMenuKeyboard(false, null, lang));
    return null;
  }

  const deposit = await createDepositRequest({
    userId,
    chatId,
    amountCents,
    method,
    targetService,
    targetCountry,
    sessionMinutes: meta.sessionMinutes,
  });

  if (!deposit) {
    await sendHtml(chatId, '⚠️ Could not create payment order. Please try again.');
    return null;
  }

  await setUserState(userId, {
    mode: 'await_txid',
    depositId: deposit.id,
  });

  const caption = formatPaymentOrderMessage({ deposit, address, lang });
  const kb = {
    inline_keyboard: [
      [
        {
          text: lang === 'fa' ? '❌ لغو سفارش پرداخت' : '❌ Cancel Payment Order',
          callback_data: `canceldep:${deposit.id}`,
        },
      ],
    ],
  };

  if (meta.hasQr) {
    try {
      await api.sendPhoto({
        chat_id: chatId,
        photo: buildQrImageUrl(address),
        caption,
        parse_mode: 'HTML',
        reply_markup: kb,
      });
      return deposit;
    } catch (err) {
      console.warn('sendPhoto QR fallback to text:', err.message);
    }
  }

  await sendHtml(chatId, caption, kb);
  return deposit;
}

export async function processPaymentProof({
  depositId,
  userId,
  chatId,
  rawInput,
  username,
  lang = 'en',
}) {
  const deposit = await getDepositRequest(depositId);
  if (!deposit || Number(deposit.userId) !== Number(userId)) {
    return { status: 'error', reason: 'Payment order not found.' };
  }
  if (deposit.status === 'approved') {
    return { status: 'error', reason: 'This payment order has already been completed.' };
  }
  if (deposit.status === 'rejected' || deposit.status === 'expired') {
    return { status: 'error', reason: 'This payment order is no longer active.' };
  }

  const txId = extractTxId(rawInput, deposit.method);
  if (!txId) {
    return {
      status: 'retry',
      reason:
        deposit.method === 'binance'
          ? 'Please paste a valid Binance Pay Order ID.'
          : 'Please paste a valid transaction hash (TxID).',
    };
  }

  // Anti-replay: block reusing any TxID / Binance Order ID
  const duplicate = await findDepositByTxId(txId);
  if (duplicate && duplicate.id !== deposit.id) {
    return {
      status: 'retry',
      reason: '⛔ This TxID / Order ID has already been submitted on another order.',
    };
  }

  const isExpired =
    deposit.expiresAt && Date.now() > new Date(deposit.expiresAt).getTime();

  const addresses = await getPaymentAddresses();
  let result;

  if (deposit.method === 'usdt_bep20' || deposit.method === 'usdc_bep20') {
    result = await verifyBep20Transfer({
      txHash: txId,
      expectedAddress: addresses[deposit.method],
      expectedCents: deposit.amountCents,
      method: deposit.method,
    });
  } else if (deposit.method === 'usdt_ton') {
    result = await verifyTonUsdtTransfer({
      txHash: txId,
      expectedAddress: addresses.usdt_ton,
      expectedCents: deposit.amountCents,
    });
  } else if (deposit.method === 'binance') {
    result = await verifyBinancePayOrder({
      orderId: txId,
      expectedCents: deposit.amountCents,
      apiKey: addresses.binanceApiKey,
      apiSecret: addresses.binanceApiSecret,
    });
  } else {
    result = { verified: false, needsReview: true, reason: 'Routed to admin review.' };
  }

  // Retryable user error (tx not confirmed yet or wrong token)
  if (!result.verified && !result.needsReview) {
    return { status: 'retry', reason: result.reason };
  }

  // Verified automatically AND within payment window!
  if (result.verified && !isExpired) {
    const creditedCents = Math.max(deposit.amountCents, result.paidCents || deposit.amountCents);
    await attachDepositTxId(deposit.id, txId, rawInput, 'approved', true);
    await clearUserState(userId);

    const meta = PAYMENT_METHODS[deposit.method];
    const wallet = await creditWallet({
      userId,
      amountCents: creditedCents,
      type: 'deposit',
      referenceId: txId,
      note: `${meta ? meta.title : deposit.method} #${deposit.id} (Auto-Verified)`,
    });

    return {
      status: 'approved',
      creditedCents,
      wallet,
      deposit,
      reason: result.reason,
    };
  }

  // Late transfer OR needs admin review
  const reviewReason = isExpired
    ? `Late transfer (after 10-min expiry). ${result.reason || ''}`.trim()
    : result.reason || 'Pending verification';

  await attachDepositTxId(deposit.id, txId, rawInput, 'review', Boolean(result.verified));
  await clearUserState(userId);

  const ownerId = await getOwnerId();
  const meta = PAYMENT_METHODS[deposit.method];
  if (ownerId) {
    try {
      await sendHtml(
        ownerId,
        [
          `🟡 <b>Payment Review Needed (#${deposit.id})</b>`,
          '',
          `👤 <b>User:</b> ${escapeHtml(username || String(userId))} (<code>${userId}</code>)`,
          `💳 <b>Method:</b> ${escapeHtml(meta ? meta.title : deposit.method)}`,
          `💰 <b>Expected:</b> <code>${escapeHtml(centsToUsdString(deposit.amountCents))}</code>`,
          ...(result.paidCents
            ? [`✅ <b>Detected On-Chain:</b> <code>${escapeHtml(centsToUsdString(result.paidCents))}</code>`]
            : []),
          ...(deposit.targetService && deposit.targetCountry
            ? [
                `📦 <b>For Service:</b> ${escapeHtml(findServiceName(deposit.targetService))} (${escapeHtml(
                  findCountryName(deposit.targetCountry)
                )})`,
              ]
            : []),
          `🧾 <b>TxID / Order ID:</b> <code>${escapeHtml(txId)}</code>`,
          `ℹ️ <b>Note:</b> ${escapeHtml(reviewReason)}`,
        ].join('\n'),
        buildDepositApprovalKeyboard(deposit.id)
      );
    } catch (err) {
      console.warn('Could not notify owner:', err.message);
    }
  }

  return {
    status: 'review',
    deposit,
    reason: reviewReason,
  };
}

/**
 * If a paid deposit was tied to a specific service+country checkout,
 * automatically purchases and delivers the virtual number right away!
 */
export async function fulfillPendingServiceIfAny({ deposit, chatId, userId, lang = 'en' }) {
  if (!deposit || !deposit.targetService || !deposit.targetCountry) return false;
  await runBuyNumberAction({
    chatId,
    userId,
    serviceCode: deposit.targetService,
    countryId: deposit.targetCountry,
    lang,
  });
  return true;
}

export async function runServiceCheckoutAction({
  chatId,
  userId,
  serviceCode,
  countryId,
  retailCents,
  phones,
  starsPerUsd,
  editMessageId = null,
  lang = 'en',
}) {
  const [wallet, requiredPoints] = await Promise.all([
    getWallet(userId),
    calculateRequiredPoints(serviceCode, retailCents),
  ]);
  const priceStr = centsToUsdString(retailCents);
  const balStr = centsToUsdString(wallet.balanceCents);
  const ptsBal = Number(wallet.pointsBalance || 0);

  const lines = [
    lang === 'fa' ? '<b>تایید خرید شماره</b>' : '<b>Checkout</b>',
    '',
    '<blockquote>' +
      [
        `${lang === 'fa' ? 'سرویس' : 'Service'}: <b>${escapeHtml(findServiceName(serviceCode))}</b>`,
        `${lang === 'fa' ? 'کشور' : 'Country'}: <b>${escapeHtml(findCountryName(countryId))}</b>`,
        ...(phones !== null && phones !== undefined
          ? [`${lang === 'fa' ? 'موجودی' : 'In Stock'}: <code>${phones}</code>`]
          : []),
        `${lang === 'fa' ? 'قیمت' : 'Price'}: <code>${escapeHtml(priceStr)}</code>`,
        `${lang === 'fa' ? 'موجودی کیف پول' : 'Wallet Balance'}: <code>${escapeHtml(balStr)}</code>`,
      ].join('\n') +
      '</blockquote>',
    '',
    `<blockquote>${t(lang, 'vpn_tip', { country: escapeHtml(findCountryName(countryId)) })}</blockquote>`,
    '',
    wallet.balanceCents >= retailCents || ptsBal >= requiredPoints
      ? lang === 'fa'
        ? 'روش پرداخت خود را انتخاب کنید:'
        : 'Choose a payment option below:'
      : lang === 'fa'
        ? 'روش پرداخت مستقیم را انتخاب کنید یا با دعوت دوستان امتیاز بگیرید:'
        : 'Pay directly below, or invite friends to earn points:',
  ];

  const kb = buildPaymentMethodsKeyboard({
    amountCents: retailCents,
    walletBalanceCents: wallet.balanceCents,
    pointsBalance: ptsBal,
    requiredPoints,
    serviceCode,
    countryId,
    starsPerUsd,
    lang,
  });

  if (editMessageId) {
    await editHtml(chatId, editMessageId, lines.join('\n'), kb);
  } else {
    await sendHtml(chatId, lines.join('\n'), kb);
  }
}
