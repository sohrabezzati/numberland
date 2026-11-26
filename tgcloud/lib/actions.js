import { api } from 'sdk';
import {
  createProviderClient,
  ActivationSetStatus,
  applyMarkup,
  formatPrice,
} from './provider.js';
import {
  usdToCents,
  centsToUsdString,
  getApiConfig,
  getMarkupPercent,
  getStarsPerUsd,
  getPayInfo,
  getWallet,
  creditWallet,
  debitWalletAtomic,
  creditPoints,
  debitPointsAtomic,
  calculateRequiredPoints,
  getReferralSummary,
  getRecentTransactions,
  saveOrder,
  updateOrderStatus,
  markOrderRefunded,
  getOrderByActivationId,
  getRecentOrders,
  getPlatformStats,
  getAdminUsersPage,
} from './store.js';
import {
  ALL_COUNTRIES,
  POPULAR_COUNTRY_IDS,
  POPULAR_SERVICE_CODES,
  findService,
  findServiceName,
  findCountry,
  findCountryName,
  searchCountries,
} from './catalog.js';
import {
  COUNTRIES_PAGE_SIZE,
  escapeHtml,
  sendHtml,
  editHtml,
  buildMainMenuKeyboard,
  buildWalletKeyboard,
  buildTopUpMenuKeyboard,
  buildStarsAmountKeyboard,
  buildCountryPriceKeyboard,
  buildCountryServicesPriceKeyboard,
  buildActivationControlKeyboard,
  buildOrdersListKeyboard,
  formatOrderStatusText,
} from './ui.js';
import { t } from './i18n.js';

const POPULAR_RANK = new Map(POPULAR_COUNTRY_IDS.map((id, idx) => [id, idx]));
const POPULAR_SERVICE_RANK = new Map(POPULAR_SERVICE_CODES.map((code, idx) => [code, idx]));

async function getClientOrWarn(chatId, editMessageId, lang = 'en') {
  const { apiKey, baseUrl } = await getApiConfig();
  if (!apiKey) {
    const msg =
      lang === 'fa'
        ? '<b>درگاه متصل نیست</b>\nدستور <code>/setkey YOUR_API_KEY</code> را ارسال کنید.'
        : '<b>Gateway not configured</b>\nSend <code>/setkey YOUR_API_KEY</code> to connect.';
    if (editMessageId) {
      await editHtml(chatId, editMessageId, msg, buildMainMenuKeyboard(false, null, lang));
    } else {
      await sendHtml(chatId, msg, buildMainMenuKeyboard(false, null, lang));
    }
    return null;
  }
  return createProviderClient(apiKey, baseUrl);
}

export async function runWalletAction(chatId, userId, editMessageId = null, lang = 'en') {
  const wallet = await getWallet(userId);
  const txs = await getRecentTransactions(userId, 6);

  const lines = [
    t(lang, 'wallet_title'),
    '',
    '<blockquote>' +
      [
        t(lang, 'wallet_avail', { bal: escapeHtml(centsToUsdString(wallet.balanceCents)) }),
        t(lang, 'points_line', { pts: Number(wallet.pointsBalance || 0).toLocaleString() }),
        t(lang, 'wallet_dep', { dep: escapeHtml(centsToUsdString(wallet.totalDepositedCents)) }),
        t(lang, 'wallet_spent', { spent: escapeHtml(centsToUsdString(wallet.totalSpentCents)) }),
      ].join('\n') +
      '</blockquote>',
  ];

  if (txs.length > 0) {
    lines.push('', t(lang, 'wallet_recent'));
    for (const tx of txs) {
      const sign = tx.amountCents >= 0 ? '+' : '-';
      const absUsd = centsToUsdString(Math.abs(tx.amountCents));
      const label = tx.note || tx.type;
      lines.push(`• <code>${sign}${absUsd}</code> — ${escapeHtml(label)}`);
    }
  } else {
    lines.push('', t(lang, 'wallet_empty'));
  }

  const text = lines.join('\n');
  const kb = buildWalletKeyboard(lang);
  if (editMessageId) {
    await editHtml(chatId, editMessageId, text, kb);
  } else {
    await sendHtml(chatId, text, kb);
  }
}

export async function runReferralAction(chatId, userId, editMessageId = null, lang = 'en') {
  const ref = await getReferralSummary(userId);
  const shareText =
    lang === 'fa'
      ? 'شماره مجازی و سرویس‌های دیجیتال آنی در یک‌تپ (YekTap)'
      : 'Instant virtual numbers & digital services on YekTap';
  const shareUrl = ref.inviteLink
    ? `https://t.me/share/url?url=${encodeURIComponent(ref.inviteLink)}&text=${encodeURIComponent(shareText)}`
    : null;

  const lines = [
    t(lang, 'ref_title'),
    t(lang, 'ref_subtitle'),
    '',
    '<blockquote>' +
      [
        t(lang, 'ref_points_bal', { pts: ref.pointsBalance.toLocaleString() }),
        t(lang, 'ref_invites', { n: ref.referralCount.toLocaleString() }),
        t(lang, 'ref_reward_each', { pts: ref.rewardPoints.toLocaleString() }),
        t(lang, 'ref_rate_line', { rate: ref.pointsPerUsd.toLocaleString() }),
      ].join('\n') +
      '</blockquote>',
    '',
    t(lang, 'ref_link_label'),
    ref.inviteLink ? `<code>${escapeHtml(ref.inviteLink)}</code>` : '<i>Unavailable</i>',
  ];

  const rows = [];
  if (shareUrl) {
    rows.push([{ text: t(lang, 'btn_share_invite'), url: shareUrl }]);
  }
  rows.push([
    { text: t(lang, 'btn_buy'), callback_data: 'menu:smart' },
    { text: t(lang, 'btn_main_menu'), callback_data: 'menu:main' },
  ]);

  const kb = { inline_keyboard: rows };
  const text = lines.join('\n');
  if (editMessageId) {
    await editHtml(chatId, editMessageId, text, kb);
  } else {
    await sendHtml(chatId, text, kb);
  }
}

export async function runTopUpMenuAction(chatId, editMessageId = null, lang = 'en') {
  const starsPerUsd = await getStarsPerUsd();
  const text = [
    t(lang, 'topup_title'),
    '',
    t(lang, 'topup_choose'),
    t(lang, 'topup_stars_desc', { rate: starsPerUsd }),
    t(lang, 'topup_crypto_desc'),
  ].join('\n');

  const kb = buildTopUpMenuKeyboard(lang);
  if (editMessageId) {
    await editHtml(chatId, editMessageId, text, kb);
  } else {
    await sendHtml(chatId, text, kb);
  }
}

export async function runStarsMenuAction(chatId, editMessageId = null, lang = 'en') {
  const starsPerUsd = await getStarsPerUsd();
  const text = [
    t(lang, 'stars_title'),
    '',
    t(lang, 'stars_rate', { rate: starsPerUsd }),
  ].join('\n');

  const kb = buildStarsAmountKeyboard(starsPerUsd, lang);
  if (editMessageId) {
    await editHtml(chatId, editMessageId, text, kb);
  } else {
    await sendHtml(chatId, text, kb);
  }
}

export async function runSendStarsInvoiceAction(
  chatId,
  userId,
  amountUsd,
  targetService = null,
  targetCountry = null
) {
  const usd = Number(amountUsd);
  if (!Number.isFinite(usd) || usd <= 0) return;

  const starsPerUsd = await getStarsPerUsd();
  const starAmount = Math.max(1, Math.round(usd * starsPerUsd));
  const amountCents = usdToCents(usd);

  const payload =
    targetService && targetCountry
      ? `svc:${userId}:${amountCents}:${targetService}:${targetCountry}`
      : `topup:${userId}:${amountCents}`;

  await api.sendInvoice({
    chat_id: chatId,
    title:
      targetService && targetCountry
        ? `YekTap Number (${targetService.toUpperCase()} · $${usd.toFixed(2)})`
        : `YekTap Wallet Top-Up ($${usd.toFixed(2)})`,
    description:
      targetService && targetCountry
        ? `Instant payment of $${usd.toFixed(2)} USD to activate your virtual number automatically.`
        : `Instant credit of $${usd.toFixed(2)} USD to your YekTap wallet.`,
    payload,
    provider_token: '',
    currency: 'XTR',
    prices: [{ label: `$${usd.toFixed(2)} USD`, amount: starAmount }],
  });
}

export async function runCryptoDepositPromptAction(chatId, editMessageId = null, lang = 'en') {
  const payInfo = await getPayInfo();
  const detailsBlock = payInfo ? escapeHtml(payInfo) : t(lang, 'crypto_not_set');

  const text = [
    t(lang, 'crypto_title'),
    '',
    t(lang, 'crypto_details_hdr'),
    detailsBlock,
    '',
    t(lang, 'crypto_steps'),
  ].join('\n');

  const kb = {
    inline_keyboard: [[{ text: t(lang, 'btn_back_topup'), callback_data: 'menu:topup' }]],
  };

  if (editMessageId) {
    await editHtml(chatId, editMessageId, text, kb);
  } else {
    await sendHtml(chatId, text, kb);
  }
}

export async function runPlatformStatsAction(
  chatId,
  editMessageId = null,
  lang = 'en',
  balanceCents = null
) {
  const stats = await getPlatformStats();
  const markup = await getMarkupPercent();

  const text =
    lang === 'fa'
      ? [
          '<b>آمار فروش یک‌تپ</b>',
          '',
          '<blockquote>' +
            [
              `کاربران دارای کیف پول: <code>${stats.userCount}</code>`,
              `مجموع موجودی دلاری: <code>${escapeHtml(centsToUsdString(stats.totalUserBalancesCents))}</code>`,
              `مجموع واریزی‌ها: <code>${escapeHtml(centsToUsdString(stats.totalDepositedCents))}</code>`,
              '',
              `مجموع امتیاز کاربران: <code>${stats.totalPointsBalance.toLocaleString()} امتیاز</code>`,
              `کل امتیاز کسب‌شده / خرج‌شده: <code>${stats.totalPointsEarned.toLocaleString()}</code> / <code>${stats.totalPointsSpent.toLocaleString()}</code>`,
              `کل دعوت‌ها: <code>${stats.totalReferrals.toLocaleString()}</code>`,
              '',
              `کل سفارش‌ها: <code>${stats.totalOrders}</code> (${stats.activeOrders} فعال · ${stats.pointsOrders} امتیازی)`,
              `درآمد ناخالص: <code>${escapeHtml(centsToUsdString(stats.totalRevenueCents))}</code>`,
              `هزینه درگاه: <code>${escapeHtml(centsToUsdString(stats.totalWholesaleCents))}</code>`,
              `سود خالص (+${markup}%): <code>${escapeHtml(centsToUsdString(stats.totalCommissionCents))}</code>`,
            ].join('\n') +
            '</blockquote>',
        ].join('\n')
      : [
          '<b>YekTap Sales &amp; Profit</b>',
          '',
          '<blockquote>' +
            [
              `Users: <code>${stats.userCount}</code>`,
              `User USD Balances: <code>${escapeHtml(centsToUsdString(stats.totalUserBalancesCents))}</code>`,
              `Total Deposits: <code>${escapeHtml(centsToUsdString(stats.totalDepositedCents))}</code>`,
              '',
              `User Points Held: <code>${stats.totalPointsBalance.toLocaleString()} pts</code>`,
              `Points Earned / Spent: <code>${stats.totalPointsEarned.toLocaleString()}</code> / <code>${stats.totalPointsSpent.toLocaleString()}</code>`,
              `Total Referrals: <code>${stats.totalReferrals.toLocaleString()}</code>`,
              '',
              `Orders: <code>${stats.totalOrders}</code> (${stats.activeOrders} active · ${stats.pointsOrders} points)`,
              `Gross Revenue: <code>${escapeHtml(centsToUsdString(stats.totalRevenueCents))}</code>`,
              `Gateway Cost: <code>${escapeHtml(centsToUsdString(stats.totalWholesaleCents))}</code>`,
              `Net Profit (+${markup}%): <code>${escapeHtml(centsToUsdString(stats.totalCommissionCents))}</code>`,
            ].join('\n') +
            '</blockquote>',
        ].join('\n');

  const mainKb = buildMainMenuKeyboard(true, balanceCents, lang);
  const kb = {
    inline_keyboard: [
      [
        {
          text:
            lang === 'fa'
              ? `کاربران و کیف پول‌ها (${stats.userCount})`
              : `Users & Wallets (${stats.userCount})`,
          callback_data: 'act:users:0',
        },
      ],
      ...mainKb.inline_keyboard,
    ],
  };

  if (editMessageId) {
    await editHtml(chatId, editMessageId, text, kb);
  } else {
    await sendHtml(chatId, text, kb);
  }
}

export async function runAdminUsersAction(chatId, page = 0, editMessageId = null, lang = 'en') {
  const { users, total, page: safePage, totalPages } = await getAdminUsersPage({
    page,
    pageSize: 8,
  });

  const isFa = lang === 'fa';
  const ptsUnit = isFa ? 'امتیاز' : 'pts';
  const header = isFa
    ? `<b>کاربران و کیف پول‌ها</b> (${total} کاربر · صفحه ${safePage + 1}/${totalPages})`
    : `<b>Users &amp; Wallets</b> (${total} users · Page ${safePage + 1}/${totalPages})`;

  const lines = [header, ''];

  if (!users.length) {
    lines.push(isFa ? '<i>هنوز کاربری ثبت نشده است.</i>' : '<i>No users found yet.</i>');
  } else {
    const startIdx = safePage * 8;
    users.forEach((u, idx) => {
      const rank = startIdx + idx + 1;
      const roleTag =
        u.role === 'owner'
          ? isFa ? ' · مالک' : ' · Owner'
          : u.role === 'blocked'
            ? isFa ? ' · مسدود' : ' · Blocked'
            : '';
      lines.push(
        `${rank}. <a href="tg://user?id=${u.userId}">User</a> <code>${u.userId}</code>${roleTag}`,
        isFa
          ? `   دلار: <code>${escapeHtml(centsToUsdString(u.balanceCents))}</code> · امتیاز: <code>${u.pointsBalance.toLocaleString()} ${ptsUnit}</code>`
          : `   USD: <code>${escapeHtml(centsToUsdString(u.balanceCents))}</code> · Points: <code>${u.pointsBalance.toLocaleString()} ${ptsUnit}</code>`,
        isFa
          ? `   واریز: <code>${escapeHtml(centsToUsdString(u.totalDepositedCents))}</code> · خرید: <code>${escapeHtml(centsToUsdString(u.totalSpentCents))}</code> · سفارش: <code>${u.orderCount}</code> · دعوت: <code>${u.referralCount}</code>`
          : `   Dep: <code>${escapeHtml(centsToUsdString(u.totalDepositedCents))}</code> · Spent: <code>${escapeHtml(centsToUsdString(u.totalSpentCents))}</code> · Orders: <code>${u.orderCount}</code> · Invites: <code>${u.referralCount}</code>`,
        ''
      );
    });
  }

  const rows = [];
  if (totalPages > 1) {
    const nav = [];
    if (safePage > 0) {
      nav.push({ text: t(lang, 'btn_prev'), callback_data: `act:users:${safePage - 1}` });
    }
    nav.push({ text: `${safePage + 1}/${totalPages}`, callback_data: 'noop' });
    if (safePage < totalPages - 1) {
      nav.push({ text: t(lang, 'btn_next'), callback_data: `act:users:${safePage + 1}` });
    }
    rows.push(nav);
  }
  rows.push([
    { text: t(lang, 'btn_refresh_prices'), callback_data: `act:users:${safePage}` },
    { text: t(lang, 'btn_stats'), callback_data: 'act:stats' },
  ]);
  rows.push([{ text: t(lang, 'btn_main_menu'), callback_data: 'menu:main' }]);

  const text = lines.join('\n').trim();
  const kb = { inline_keyboard: rows };
  if (editMessageId) {
    await editHtml(chatId, editMessageId, text, kb);
  } else {
    await sendHtml(chatId, text, kb);
  }
}

export async function runBalanceAction(
  chatId,
  editMessageId = null,
  lang = 'en',
  balanceCents = null
) {
  const client = await getClientOrWarn(chatId, editMessageId, lang);
  if (!client) return null;

  const kb = buildMainMenuKeyboard(true, balanceCents, lang);
  try {
    const res = await client.getBalance();
    const nowUtc = new Date().toISOString().slice(11, 19);
    const text = res.ok
      ? lang === 'fa'
        ? `<b>موجودی درگاه اصلی</b>\n\n<blockquote><code>$${escapeHtml(res.balance)}</code></blockquote>\n<i>بروزرسانی: ${nowUtc} UTC</i>`
        : `<b>Gateway Balance</b>\n\n<blockquote><code>$${escapeHtml(res.balance)}</code></blockquote>\n<i>Updated ${nowUtc} UTC</i>`
      : lang === 'fa'
        ? `<b>خطا در دریافت موجودی درگاه</b>\n<code>${escapeHtml(res.error || res.raw)}</code>`
        : `<b>Failed to fetch gateway balance</b>\n<code>${escapeHtml(res.error || res.raw)}</code>`;

    if (editMessageId) {
      await editHtml(chatId, editMessageId, text, kb);
    } else {
      await sendHtml(chatId, text, kb);
    }
    return res;
  } catch (err) {
    const text =
      lang === 'fa'
        ? `<b>خطای شبکه در دریافت موجودی</b>\n<code>${escapeHtml(err.message)}</code>`
        : `<b>Network error fetching balance</b>\n<code>${escapeHtml(err.message)}</code>`;
    if (editMessageId) {
      await editHtml(chatId, editMessageId, text, kb);
    } else {
      await sendHtml(chatId, text, kb);
    }
    return null;
  }
}

export async function runCountryServicesAction({
  chatId,
  countryId,
  page = 0,
  editMessageId = null,
  serviceQuery = null,
  lang = 'en',
}) {
  const client = await getClientOrWarn(chatId, editMessageId);
  if (!client) return;

  const markupPercent = await getMarkupPercent();
  let entries = [];
  let pricesLoaded = false;

  try {
    const priceRes = await client.getPrices(undefined, countryId);
    if (priceRes.ok) {
      entries = priceRes.entries;
      pricesLoaded = true;
    }
  } catch {
    // Non-fatal fallback
  }

  const items = [];
  const seen = new Set();
  const q = String(serviceQuery || '').trim().toLowerCase();

  for (const entry of entries) {
    const code = entry.service.toLowerCase();
    if (seen.has(code)) continue;
    seen.add(code);

    const known = findService(code);
    const name = known ? known.name : entry.service.toUpperCase();
    const emoji = known ? known.emoji : '📱';

    if (q && !name.toLowerCase().includes(q) && !code.includes(q)) {
      continue;
    }

    items.push({
      code: known ? known.code : entry.service,
      name,
      emoji,
      retailPrice: applyMarkup(entry.basePrice, markupPercent),
      phones: entry.phones,
      popRank: POPULAR_SERVICE_RANK.has(code) ? POPULAR_SERVICE_RANK.get(code) : 999,
    });
  }

  items.sort((a, b) => {
    if ((a.phones > 0) !== (b.phones > 0)) return a.phones > 0 ? -1 : 1;
    if (a.popRank !== b.popRank) return a.popRank - b.popRank;
    if (a.retailPrice !== null && b.retailPrice !== null && a.retailPrice !== b.retailPrice) {
      return a.retailPrice - b.retailPrice;
    }
    return a.name.localeCompare(b.name);
  });

  const totalPages = Math.max(1, Math.ceil(items.length / COUNTRIES_PAGE_SIZE));
  const safePage = Math.max(0, Math.min(page, totalPages - 1));
  const pageItems = items.slice(
    safePage * COUNTRIES_PAGE_SIZE,
    (safePage + 1) * COUNTRIES_PAGE_SIZE
  );

  const countryLabel = escapeHtml(findCountryName(countryId));
  const lines = [
    t(lang, 'step2_service'),
    t(lang, 'country_label', { country: countryLabel }),
  ];

  if (serviceQuery) {
    lines.push(`🔎 <code>${escapeHtml(serviceQuery)}</code> (${items.length})`);
  } else if (pricesLoaded) {
    lines.push(t(lang, 'available_services', { n: items.length }));
  }

  lines.push(
    '',
    pageItems.length > 0 ? t(lang, 'tap_service_hint') : t(lang, 'no_services_found')
  );

  const kb = buildCountryServicesPriceKeyboard(countryId, pageItems, safePage, totalPages, lang);
  const text = lines.join('\n');

  if (editMessageId) {
    await editHtml(chatId, editMessageId, text, kb);
  } else {
    await sendHtml(chatId, text, kb);
  }
}

export async function runServiceCountriesAction({
  chatId,
  serviceCode,
  page = 0,
  editMessageId = null,
  countryQuery = null,
  lang = 'en',
}) {
  const client = await getClientOrWarn(chatId, editMessageId);
  if (!client) return;

  const markupPercent = await getMarkupPercent();
  let byCountry = new Map();
  let pricesLoaded = false;

  try {
    const priceRes = await client.getPrices(serviceCode);
    if (priceRes.ok && priceRes.byCountry.size > 0) {
      byCountry = priceRes.byCountry;
      pricesLoaded = true;
    }
  } catch {
    // Fall through to per-country fallback
  }

  if (byCountry.size === 0) {
    const probeIds = ['16', '187', '36', '43', '48', '78', '6', '4', '22', '73', '15', '117', '74', '62', '95'];
    const settled = await Promise.allSettled(
      probeIds.map(async (cid) => {
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
    if (byCountry.size > 0) pricesLoaded = true;
  }

  const baseCountries = countryQuery ? searchCountries(countryQuery, 100) : ALL_COUNTRIES;

  const merged = [];
  const seen = new Set();

  for (const c of baseCountries) {
    seen.add(c.id);
    const live = byCountry.get(c.id);
    const retailPrice = live ? applyMarkup(live.basePrice, markupPercent) : null;
    const phones = live ? live.phones : null;
    merged.push({
      id: c.id,
      name: c.name,
      flag: c.flag,
      retailPrice,
      phones,
      inStock: phones !== null ? phones > 0 : false,
      popRank: POPULAR_RANK.has(c.id) ? POPULAR_RANK.get(c.id) : 999,
    });
  }

  if (!countryQuery && pricesLoaded) {
    for (const [cid, live] of byCountry.entries()) {
      if (seen.has(cid)) continue;
      const known = findCountry(cid);
      merged.push({
        id: cid,
        name: known ? known.name : `Country #${cid}`,
        flag: known ? known.flag : '🌍',
        retailPrice: applyMarkup(live.basePrice, markupPercent),
        phones: live.phones,
        inStock: live.phones > 0,
        popRank: POPULAR_RANK.has(cid) ? POPULAR_RANK.get(cid) : 999,
      });
    }
  }

  let displayList = merged;
  if (pricesLoaded && !countryQuery) {
    const inStock = merged.filter((c) => c.inStock);
    if (inStock.length > 0) {
      displayList = inStock;
    }
  }

  displayList.sort((a, b) => {
    if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
    if (a.popRank !== b.popRank) return a.popRank - b.popRank;
    if (a.retailPrice !== null && b.retailPrice !== null && a.retailPrice !== b.retailPrice) {
      return a.retailPrice - b.retailPrice;
    }
    return a.name.localeCompare(b.name);
  });

  const totalPages = Math.max(1, Math.ceil(displayList.length / COUNTRIES_PAGE_SIZE));
  const safePage = Math.max(0, Math.min(page, totalPages - 1));
  const pageItems = displayList.slice(
    safePage * COUNTRIES_PAGE_SIZE,
    (safePage + 1) * COUNTRIES_PAGE_SIZE
  );

  const totalStock = displayList.reduce((sum, c) => sum + (c.phones || 0), 0);
  const serviceLabel = escapeHtml(findServiceName(serviceCode));

  const lines = [
    lang === 'fa' ? '<b>انتخاب کشور</b>' : '<b>Select a Country</b>',
    `${lang === 'fa' ? 'سرویس' : 'Service'}: <b>${serviceLabel}</b>`,
  ];

  if (countryQuery) {
    lines.push(`${lang === 'fa' ? 'فیلتر' : 'Filter'}: <code>${escapeHtml(countryQuery)}</code> (${displayList.length})`);
  } else if (pricesLoaded) {
    lines.push(
      lang === 'fa'
        ? `موجود: <b>${displayList.length}</b> کشور · ${totalStock.toLocaleString()} شماره`
        : `Available: <b>${displayList.length}</b> countries · ${totalStock.toLocaleString()} in stock`
    );
  }

  lines.push(
    '',
    pageItems.length > 0
      ? lang === 'fa'
        ? 'یک کشور را برای ادامه انتخاب کنید:'
        : 'Select a country below to continue:'
      : lang === 'fa'
        ? 'کشور موجودی یافت نشد.'
        : 'No matching countries found.'
  );

  const kb = buildCountryPriceKeyboard(serviceCode, pageItems, safePage, totalPages, lang);
  const text = lines.join('\n');

  if (editMessageId) {
    await editHtml(chatId, editMessageId, text, kb);
  } else {
    await sendHtml(chatId, text, kb);
  }
}

export async function runPricesAction(chatId, serviceCode, countryId, editMessageId = null, lang = 'en') {
  if (!countryId) {
    await runServiceCountriesAction({ chatId, serviceCode, page: 0, editMessageId, lang });
    return;
  }

  const client = await getClientOrWarn(chatId, editMessageId, lang);
  if (!client) return;

  const markupPercent = await getMarkupPercent();

  try {
    const res = await client.getPrices(serviceCode, countryId);
    const live = res.byCountry.get(String(countryId));

    if (!res.ok || !live) {
      const msg = [
        '⚠️ <b>Pricing Unavailable</b>',
        '',
        `📦 <b>Service:</b> ${escapeHtml(findServiceName(serviceCode))}`,
        `🌍 <b>Country:</b> ${escapeHtml(findCountryName(countryId))}`,
        `❌ <b>Reason:</b> ${escapeHtml(res.error || 'No live stock found for this pair.')}`,
      ].join('\n');
      await sendHtml(chatId, msg, buildMainMenuKeyboard(false, null, lang));
      return;
    }

    const retailPrice = applyMarkup(live.basePrice, markupPercent);
    const text = [
      '💵 <b>Live Number Availability & Price</b>',
      '',
      `📦 <b>Service:</b> ${escapeHtml(findServiceName(serviceCode))}`,
      `🌍 <b>Country:</b> ${escapeHtml(findCountryName(countryId))}`,
      `💳 <b>Price:</b> <code>${escapeHtml(formatPrice(retailPrice))}</code>`,
      `📱 <b>Available Numbers:</b> <code>${escapeHtml(live.phones)}</code>`,
    ].join('\n');

    const kb = {
      inline_keyboard: [
        [
          {
            text: `📱 Buy Now — ${formatPrice(retailPrice)}`,
            callback_data: `buy:${serviceCode}:${countryId}`,
          },
        ],
        [
          { text: '🌍 All Countries for Service', callback_data: `svc:${serviceCode}` },
          { text: '🏠 Main Menu', callback_data: 'menu:main' },
        ],
      ],
    };

    if (editMessageId) {
      await editHtml(chatId, editMessageId, text, kb);
    } else {
      await sendHtml(chatId, text, kb);
    }
  } catch (err) {
    await sendHtml(
      chatId,
      `⚠️ <b>Network error fetching prices</b>\n<code>${escapeHtml(err.message)}</code>`,
      buildMainMenuKeyboard()
    );
  }
}

export async function runBuyNumberAction({
  chatId,
  userId,
  serviceCode,
  countryId,
  maxPrice,
  paymentMethod = 'wallet',
  editMessageId,
  lang = 'en',
}) {
  const client = await getClientOrWarn(chatId, editMessageId, lang);
  if (!client) return;

  const isPoints = paymentMethod === 'points';
  const markupPercent = await getMarkupPercent();

  // 1. Fetch live wholesale price for exact billing & commission
  let live = null;
  try {
    const priceRes = await client.getPrices(serviceCode, countryId);
    live = priceRes.ok ? priceRes.byCountry.get(String(countryId)) : null;
  } catch {
    live = null;
  }

  if (!live || !Number.isFinite(live.basePrice)) {
    const msg = [
      lang === 'fa' ? '<b>شماره در حال حاضر موجود نیست</b>' : '<b>Number Currently Unavailable</b>',
      '',
      t(lang, 'svc_label', { svc: escapeHtml(findServiceName(serviceCode)) }),
      t(lang, 'country_label', { country: escapeHtml(findCountryName(countryId)) }),
    ].join('\n');
    const kb = {
      inline_keyboard: [
        [{ text: t(lang, 'btn_back_countries'), callback_data: `svc:${serviceCode}` }],
        [{ text: t(lang, 'btn_main_menu'), callback_data: 'menu:main' }],
      ],
    };
    if (editMessageId) {
      await editHtml(chatId, editMessageId, msg, kb);
    } else {
      await sendHtml(chatId, msg, kb);
    }
    return;
  }

  const wholesalePrice = live.basePrice;
  const retailPrice = applyMarkup(wholesalePrice, markupPercent);
  const wholesaleCents = usdToCents(wholesalePrice);
  const retailCents = Math.max(1, usdToCents(retailPrice));
  const commissionCents = Math.max(0, retailCents - wholesaleCents);

  // Check optional user maxPrice (retail)
  if (!isPoints && maxPrice !== undefined && maxPrice !== null && maxPrice !== '') {
    const maxRetailCents = usdToCents(maxPrice);
    if (maxRetailCents > 0 && retailCents > maxRetailCents) {
      const msg = [
        '<b>Price Exceeds Your Max Price</b>',
        '',
        `Current Price: <code>${escapeHtml(centsToUsdString(retailCents))}</code>`,
        `Your Max Price: <code>${escapeHtml(centsToUsdString(maxRetailCents))}</code>`,
      ].join('\n');
      await sendHtml(chatId, msg, buildMainMenuKeyboard(false, null, lang));
      return;
    }
  }

  // 2. Atomically deduct USD wallet OR Points BEFORE ordering from gateway
  let requiredPoints = 0;
  let debit = null;

  if (isPoints) {
    requiredPoints = await calculateRequiredPoints(serviceCode, retailCents);
    debit = await debitPointsAtomic({
      userId,
      amountPoints: requiredPoints,
      type: 'purchase',
      note: `${findServiceName(serviceCode)} (${findCountryName(countryId)})`,
    });

    if (!debit.ok) {
      const currentPts = debit.wallet ? Number(debit.wallet.pointsBalance || 0) : 0;
      const neededPts = Math.max(0, requiredPoints - currentPts);
      const ptsUnit = lang === 'fa' ? 'امتیاز' : 'pts';
      const msg = [
        lang === 'fa' ? '<b>امتیاز کافی نیست</b>' : '<b>Insufficient Points</b>',
        '',
        t(lang, 'svc_label', { svc: escapeHtml(findServiceName(serviceCode)) }),
        t(lang, 'country_label', { country: escapeHtml(findCountryName(countryId)) }),
        `${lang === 'fa' ? 'امتیاز مورد نیاز' : 'Required'}: <code>${requiredPoints.toLocaleString()} ${ptsUnit}</code>`,
        `${lang === 'fa' ? 'امتیاز شما' : 'Your Points'}: <code>${currentPts.toLocaleString()} ${ptsUnit}</code>`,
        `${lang === 'fa' ? 'کسری' : 'Needed'}: <code>${neededPts.toLocaleString()} ${ptsUnit}</code>`,
      ].join('\n');

      const kb = {
        inline_keyboard: [
          [{ text: t(lang, 'btn_referral'), callback_data: 'menu:referral' }],
          [{ text: t(lang, 'btn_main_menu'), callback_data: 'menu:main' }],
        ],
      };
      if (editMessageId) {
        await editHtml(chatId, editMessageId, msg, kb);
      } else {
        await sendHtml(chatId, msg, kb);
      }
      return;
    }
  } else {
    debit = await debitWalletAtomic({
      userId,
      amountCents: retailCents,
      type: 'purchase',
      note: `${findServiceName(serviceCode)} (${findCountryName(countryId)})`,
    });

    if (!debit.ok) {
      const currentCents = debit.wallet ? debit.wallet.balanceCents : 0;
      const neededCents = Math.max(0, retailCents - currentCents);
      const msg = [
        t(lang, 'insufficient_title'),
        '',
        t(lang, 'svc_label', { svc: escapeHtml(findServiceName(serviceCode)) }),
        t(lang, 'country_label', { country: escapeHtml(findCountryName(countryId)) }),
        t(lang, 'price_label', { price: escapeHtml(centsToUsdString(retailCents)) }),
        t(lang, 'your_bal_label', { bal: escapeHtml(centsToUsdString(currentCents)) }),
        t(lang, 'needed_label', { need: escapeHtml(centsToUsdString(neededCents)) }),
        '',
        t(lang, 'topup_prompt'),
      ].join('\n');

      const kb = {
        inline_keyboard: [
          [{ text: t(lang, 'btn_topup'), callback_data: 'menu:topup' }],
          [{ text: t(lang, 'btn_back_countries'), callback_data: `pickctry:${countryId}` }],
        ],
      };
      if (editMessageId) {
        await editHtml(chatId, editMessageId, msg, kb);
      } else {
        await sendHtml(chatId, msg, kb);
      }
      return;
    }
  }

  const refundOnFailure = async (reasonTag) => {
    if (isPoints) {
      await creditPoints({
        userId,
        amountPoints: requiredPoints,
        type: 'refund',
        note: `Auto-refund (${reasonTag}): ${findServiceName(serviceCode)}`,
      });
    } else {
      await creditWallet({
        userId,
        amountCents: retailCents,
        type: 'refund',
        note: `Auto-refund (${reasonTag}): ${findServiceName(serviceCode)}`,
      });
    }
  };

  // 3. Call gateway API
  try {
    const res = await client.getNumber(serviceCode, countryId, wholesalePrice);

    if (res.ok && res.activationId && res.phoneNumber) {
      await saveOrder({
        activationId: res.activationId,
        phoneNumber: res.phoneNumber,
        serviceCode,
        countryId,
        userId,
        chatId,
        wholesaleCents,
        retailCents: isPoints ? 0 : retailCents,
        commissionCents: isPoints ? 0 : commissionCents,
        paymentMethod: isPoints ? 'points' : 'wallet',
        pointsSpent: isPoints ? requiredPoints : 0,
      });

      const phone = res.phoneNumber.replace(/^\+/, '');
      const paidLine = isPoints
        ? t(lang, 'paid_points_label', {
            paid: requiredPoints.toLocaleString(),
            left: Number(debit.wallet?.pointsBalance || 0).toLocaleString(),
          })
        : t(lang, 'paid_label', {
            paid: escapeHtml(centsToUsdString(retailCents)),
            left: escapeHtml(centsToUsdString(debit.wallet ? debit.wallet.balanceCents : 0)),
          });

      const text = [
        t(lang, 'activated_title'),
        '',
        t(lang, 'phone_label', { phone: escapeHtml(phone) }),
        paidLine,
        t(lang, 'act_id_label', { id: escapeHtml(res.activationId) }),
        t(lang, 'svc_label', { svc: escapeHtml(findServiceName(serviceCode)) }),
        t(lang, 'country_label', { country: escapeHtml(findCountryName(countryId)) }),
        '',
        `<blockquote>${t(lang, 'vpn_tip', { country: escapeHtml(findCountryName(countryId)) })}</blockquote>`,
        '',
        t(lang, 'waiting_sms_hint'),
      ].join('\n');

      const kb = buildActivationControlKeyboard(res.activationId, serviceCode, countryId, lang);
      if (editMessageId) {
        await editHtml(chatId, editMessageId, text, kb);
      } else {
        await sendHtml(chatId, text, kb);
      }
      return;
    }

    // 4a. Gateway returned an error -> immediately refund user
    await refundOnFailure('unavailable');

    const refundNote = isPoints
      ? `<code>${requiredPoints.toLocaleString()} pts</code> returned to your points balance.`
      : `<code>${escapeHtml(centsToUsdString(retailCents))}</code> returned to your wallet.`;

    const errText = [
      '<b>Could Not Activate Number</b>',
      '',
      t(lang, 'svc_label', { svc: escapeHtml(findServiceName(serviceCode)) }),
      t(lang, 'country_label', { country: escapeHtml(findCountryName(countryId)) }),
      `Reason: <code>${escapeHtml(res.error || res.raw)}</code>`,
      `Refunded: ${refundNote}`,
    ].join('\n');

    const kb = {
      inline_keyboard: [
        [{ text: t(lang, 'btn_back_countries'), callback_data: `svc:${serviceCode}` }],
        [{ text: t(lang, 'btn_main_menu'), callback_data: 'menu:main' }],
      ],
    };
    if (editMessageId) {
      await editHtml(chatId, editMessageId, errText, kb);
    } else {
      await sendHtml(chatId, errText, kb);
    }
  } catch (err) {
    // 4b. Network error -> immediately refund user
    await refundOnFailure('network error');

    const refundNote = isPoints
      ? `<code>${requiredPoints.toLocaleString()} pts</code> returned to your points balance.`
      : `<code>${escapeHtml(centsToUsdString(retailCents))}</code> returned to your wallet.`;

    const errText = [
      '<b>Network Error Activating Number</b>',
      `<code>${escapeHtml(err.message)}</code>`,
      `Refunded: ${refundNote}`,
    ].join('\n');

    if (editMessageId) {
      await editHtml(chatId, editMessageId, errText, buildMainMenuKeyboard(false, null, lang));
    } else {
      await sendHtml(chatId, errText, buildMainMenuKeyboard(false, null, lang));
    }
  }
}

function sleepMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runCheckStatusAction(
  chatId,
  userId,
  activationId,
  editMessageId,
  lang = 'en',
  isOwner = false
) {
  const orderRow = await getOrderByActivationId(activationId);
  if (!orderRow || (Number(orderRow.userId) !== Number(userId) && !isOwner)) {
    const msg = '<b>Order not found</b>\nYou can only view and manage your own virtual numbers.';
    if (editMessageId) {
      await editHtml(chatId, editMessageId, msg, buildMainMenuKeyboard(isOwner, null, lang));
    } else {
      await sendHtml(chatId, msg, buildMainMenuKeyboard(isOwner, null, lang));
    }
    return null;
  }

  const client = await getClientOrWarn(chatId, editMessageId, lang);
  if (!client) return null;

  try {
    // Quick 3-step live poll (~6s total) so in-flight SMS codes arrive without repeated taps
    let res = await client.getStatus(activationId);
    for (let attempt = 0; attempt < 2 && res.ok && (res.state === 'WAIT_CODE' || res.state === 'WAIT_RESEND'); attempt++) {
      await sleepMs(3000);
      res = await client.getStatus(activationId);
    }

    const isNewCode = Boolean(res.ok && res.state === 'OK' && res.code && res.code !== orderRow.smsCode);
    if (res.ok) {
      await updateOrderStatus(activationId, res.state, res.code);
    }

    const text = formatOrderStatusText(activationId, res, orderRow, lang);
    const kb = buildActivationControlKeyboard(
      activationId,
      orderRow.serviceCode || '',
      orderRow.countryId || '',
      lang
    );

    if (isNewCode) {
      // Deliver new OTP as a fresh Telegram message so the user gets an unmistakable alert
      await sendHtml(chatId, text, kb);
    } else if (editMessageId) {
      await editHtml(chatId, editMessageId, text, kb);
    } else {
      await sendHtml(chatId, text, kb);
    }
    return res;
  } catch (err) {
    const text = `<b>Error checking activation status</b>\n<code>${escapeHtml(err.message)}</code>`;
    if (editMessageId) {
      await editHtml(chatId, editMessageId, text, buildMainMenuKeyboard(isOwner, null, lang));
    } else {
      await sendHtml(chatId, text, buildMainMenuKeyboard(isOwner, null, lang));
    }
    return null;
  }
}

export async function runSetStatusAction(
  chatId,
  userId,
  activationId,
  statusNum,
  editMessageId,
  lang = 'en',
  isOwner = false
) {
  const orderRow = await getOrderByActivationId(activationId);
  if (!orderRow || (Number(orderRow.userId) !== Number(userId) && !isOwner)) {
    const msg = '⛔ <b>Order not found</b>\nYou can only manage your own virtual numbers.';
    if (editMessageId) {
      await editHtml(chatId, editMessageId, msg, buildMainMenuKeyboard(isOwner, null, lang));
    } else {
      await sendHtml(chatId, msg, buildMainMenuKeyboard(isOwner, null, lang));
    }
    return { ok: false, error: 'Order not found.' };
  }

  const client = await getClientOrWarn(chatId, editMessageId);
  if (!client) return null;

  try {
    const res = await client.setStatus(activationId, statusNum);

    if (res.ok) {
      const dbStatus =
        statusNum === ActivationSetStatus.CANCEL
          ? 'CANCEL'
          : statusNum === ActivationSetStatus.COMPLETE
            ? 'COMPLETE'
            : 'WAIT_RESEND';

      await updateOrderStatus(activationId, dbStatus);

      let refundLine = null;
      if (statusNum === ActivationSetStatus.CANCEL) {
        if (orderRow.paymentMethod === 'points' && Number(orderRow.pointsSpent || 0) > 0) {
          const didMark = await markOrderRefunded(activationId);
          if (didMark) {
            const updatedWallet = await creditPoints({
              userId: orderRow.userId,
              amountPoints: orderRow.pointsSpent,
              type: 'refund',
              referenceId: activationId,
              note: `Cancelled activation #${activationId}`,
            });
            refundLine = t(lang, 'refunded_points_line', {
              amt: Number(orderRow.pointsSpent).toLocaleString(),
              bal: Number(updatedWallet?.pointsBalance || 0).toLocaleString(),
            });
          }
        } else if (Number(orderRow.retailCents || 0) > 0) {
          const didMark = await markOrderRefunded(activationId);
          if (didMark) {
            const updatedWallet = await creditWallet({
              userId: orderRow.userId,
              amountCents: orderRow.retailCents,
              type: 'refund',
              referenceId: activationId,
              note: `Cancelled activation #${activationId}`,
            });
            refundLine = t(lang, 'refunded_line', {
              amt: escapeHtml(centsToUsdString(orderRow.retailCents)),
              bal: escapeHtml(centsToUsdString(updatedWallet.balanceCents)),
            });
          }
        }
      }

      const heading =
        statusNum === ActivationSetStatus.CANCEL
          ? t(lang, 'act_cancelled')
          : statusNum === ActivationSetStatus.COMPLETE
            ? t(lang, 'act_completed')
            : t(lang, 'act_next_requested');

      const text = [
        heading,
        t(lang, 'phone_label', { phone: escapeHtml(orderRow.phoneNumber.replace(/^\+/, '')) }),
        t(lang, 'act_id_label', { id: escapeHtml(activationId) }),
        ...(refundLine ? [refundLine] : []),
      ].join('\n');

      const kb =
        statusNum === ActivationSetStatus.REQUEST_MORE_SMS
          ? buildActivationControlKeyboard(
              activationId,
              orderRow.serviceCode || '',
              orderRow.countryId || '',
              lang
            )
          : buildMainMenuKeyboard(isOwner, null, lang);

      if (editMessageId) {
        await editHtml(chatId, editMessageId, text, kb);
      } else {
        await sendHtml(chatId, text, kb);
      }
    } else if (!editMessageId) {
      await sendHtml(
        chatId,
        `⚠️ <b>Could not update activation</b>\n🆔 ID: <code>${escapeHtml(activationId)}</code>\n❌ Reason: <code>${escapeHtml(res.error || res.raw)}</code>`
      );
    }

    return res;
  } catch (err) {
    if (!editMessageId) {
      await sendHtml(
        chatId,
        `⚠️ <b>Network error updating status</b>\n<code>${escapeHtml(err.message)}</code>`
      );
    }
    return { ok: false, error: err.message, raw: err.message };
  }
}

export async function runOrdersListAction(chatId, userId, editMessageId, lang = 'en') {
  const recent = await getRecentOrders(userId, 10);
  if (recent.length === 0) {
    const text = t(lang, 'orders_empty');
    if (editMessageId) {
      await editHtml(chatId, editMessageId, text, buildMainMenuKeyboard(false, null, lang));
    } else {
      await sendHtml(chatId, text, buildMainMenuKeyboard(false, null, lang));
    }
    return;
  }

  const text = [t(lang, 'orders_title'), '', t(lang, 'orders_hint')].join('\n');

  const kb = buildOrdersListKeyboard(recent, lang);
  if (editMessageId) {
    await editHtml(chatId, editMessageId, text, kb);
  } else {
    await sendHtml(chatId, text, kb);
  }
}
