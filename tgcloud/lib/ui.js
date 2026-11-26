import { api, BotApiError } from 'sdk';
import { ActivationSetStatus, formatPrice } from './provider.js';
import {
  ALL_SERVICES,
  ALL_COUNTRIES,
  POPULAR_SERVICES,
  POPULAR_COUNTRIES,
  findServiceName,
  findCountryName,
} from './catalog.js';
import { centsToUsdString } from './store.js';
import { SUPPORTED_LANGUAGES, t } from './i18n.js';

export const BRAND_NAME = 'YekTap';
export const MINI_APP_URL = 'https://app9234989478.tgcloud.ai/';
export const SERVICES_PAGE_SIZE = 12;
export const COUNTRIES_PAGE_SIZE = 10;
export const STARS_PRESET_AMOUNTS_USD = [2, 5, 10, 25, 50];

export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function sendHtml(chatId, text, replyMarkup) {
  const payload = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  };
  if (replyMarkup) {
    payload.reply_markup = replyMarkup;
  }
  return await api.sendMessage(payload);
}

export async function editHtml(chatId, messageId, text, replyMarkup) {
  const payload = {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  };
  if (replyMarkup) {
    payload.reply_markup = replyMarkup;
  }
  try {
    return await api.editMessageText(payload);
  } catch (err) {
    if (err instanceof BotApiError && err.code === 400) {
      return null;
    }
    throw err;
  }
}

export async function safeAnswerCallback(callbackQueryId, text, showAlert = false) {
  try {
    const payload = { callback_query_id: callbackQueryId };
    if (text) {
      payload.text = String(text).slice(0, 190);
      payload.show_alert = showAlert;
    }
    await api.answerCallbackQuery(payload);
  } catch (err) {
    if (err instanceof BotApiError && err.code === 400) {
      return;
    }
    throw err;
  }
}

export function buildLanguageKeyboard(currentLang = 'en', showBack = true) {
  const rows = [];
  for (let i = 0; i < SUPPORTED_LANGUAGES.length; i += 2) {
    const pair = SUPPORTED_LANGUAGES.slice(i, i + 2).map((l) => ({
      text: `${l.flag} ${l.native}${showBack && l.code === currentLang ? ' ✓' : ''}`,
      callback_data: `setlang:${l.code}`,
    }));
    rows.push(pair);
  }
  if (showBack) {
    rows.push([{ text: t(currentLang, 'btn_main_menu'), callback_data: 'menu:main' }]);
  }
  return { inline_keyboard: rows };
}

export function getFirstStartLanguageMessage(firstName) {
  const namePart = firstName ? `, <b>${escapeHtml(firstName)}</b>` : '';
  return [
    `<b>${BRAND_NAME}</b>`,
    `Welcome${namePart}. Select your language:`,
    'لطفاً زبان خود را انتخاب کنید:',
  ].join('\n');
}

export function buildMainMenuKeyboard(isOwner = false, balanceCents = null, lang = 'en') {
  const walletLabel =
    balanceCents !== null && balanceCents !== undefined
      ? t(lang, 'btn_wallet', { bal: centsToUsdString(balanceCents) })
      : t(lang, 'btn_wallet_plain');

  const rows = [
    [{ text: t(lang, 'btn_open_app'), web_app: { url: MINI_APP_URL } }],
    [
      { text: t(lang, 'btn_buy'), callback_data: 'menu:smart' },
      { text: t(lang, 'btn_orders'), callback_data: 'menu:orders' },
    ],
    [
      { text: walletLabel, callback_data: 'menu:wallet' },
      { text: t(lang, 'btn_topup'), callback_data: 'menu:topup' },
    ],
    [
      { text: t(lang, 'btn_referral'), callback_data: 'menu:referral' },
      { text: t(lang, 'btn_lang'), callback_data: 'menu:lang' },
    ],
  ];

  if (isOwner) {
    rows.push([
      { text: t(lang, 'btn_stats'), callback_data: 'act:stats' },
      { text: t(lang, 'btn_gw_balance'), callback_data: 'act:balance' },
    ]);
  }

  return { inline_keyboard: rows };
}

export function buildWalletKeyboard(lang = 'en') {
  return {
    inline_keyboard: [
      [
        { text: t(lang, 'btn_topup'), callback_data: 'menu:topup' },
        { text: t(lang, 'btn_buy'), callback_data: 'menu:smart' },
      ],
      [{ text: t(lang, 'btn_main_menu'), callback_data: 'menu:main' }],
    ],
  };
}

export function buildTopUpMenuKeyboard(lang = 'en') {
  return {
    inline_keyboard: [
      [{ text: t(lang, 'btn_stars_topup'), callback_data: 'topup:stars_menu' }],
      [{ text: t(lang, 'btn_crypto_topup'), callback_data: 'topup:crypto' }],
      [
        { text: t(lang, 'btn_wallet_plain'), callback_data: 'menu:wallet' },
        { text: t(lang, 'btn_main_menu'), callback_data: 'menu:main' },
      ],
    ],
  };
}

export function buildStarsAmountKeyboard(starsPerUsd, lang = 'en') {
  const rows = [];
  for (let i = 0; i < STARS_PRESET_AMOUNTS_USD.length; i += 2) {
    const pair = STARS_PRESET_AMOUNTS_USD.slice(i, i + 2).map((usd) => {
      const stars = Math.round(usd * starsPerUsd);
      return {
        text: `$${usd}.00 (${stars} ⭐)`,
        callback_data: `topup:stars:${usd}`,
      };
    });
    rows.push(pair);
  }
  rows.push([
    { text: t(lang, 'btn_back_topup'), callback_data: 'menu:topup' },
    { text: t(lang, 'btn_main_menu'), callback_data: 'menu:main' },
  ]);
  return { inline_keyboard: rows };
}

export function buildDepositApprovalKeyboard(depositId) {
  return {
    inline_keyboard: [
      [
        { text: '✅ Approve & Credit', callback_data: `dep:approve:${depositId}` },
        { text: '❌ Reject', callback_data: `dep:reject:${depositId}` },
      ],
    ],
  };
}

export function buildCountrySelectionKeyboard(
  countries = POPULAR_COUNTRIES,
  page = 0,
  mode = 'popular',
  lang = 'en'
) {
  const rows = [];
  const totalPages = Math.max(1, Math.ceil(countries.length / SERVICES_PAGE_SIZE));
  const safePage = Math.max(0, Math.min(page, totalPages - 1));
  const slice =
    mode === 'all'
      ? countries.slice(safePage * SERVICES_PAGE_SIZE, (safePage + 1) * SERVICES_PAGE_SIZE)
      : countries.slice(0, 16);

  for (let i = 0; i < slice.length; i += 2) {
    const pair = slice.slice(i, i + 2).map((c) => ({
      text: `${c.flag} ${c.name}`,
      callback_data: `pickctry:${c.id}`,
    }));
    rows.push(pair);
  }

  if (mode === 'all' && totalPages > 1) {
    const nav = [];
    if (safePage > 0) {
      nav.push({ text: t(lang, 'btn_prev'), callback_data: `ctrys:all:${safePage - 1}` });
    }
    nav.push({ text: `${safePage + 1}/${totalPages}`, callback_data: 'noop' });
    if (safePage < totalPages - 1) {
      nav.push({ text: t(lang, 'btn_next'), callback_data: `ctrys:all:${safePage + 1}` });
    }
    rows.push(nav);
  }

  if (mode === 'popular') {
    rows.push([
      { text: t(lang, 'btn_all_countries_n', { n: ALL_COUNTRIES.length }), callback_data: 'ctrys:all:0' },
      { text: t(lang, 'btn_search_country'), callback_data: 'search:ctry_pick' },
    ]);
  } else if (mode === 'all') {
    rows.push([
      { text: t(lang, 'btn_popular_countries'), callback_data: 'menu:countries' },
      { text: t(lang, 'btn_search_country'), callback_data: 'search:ctry_pick' },
    ]);
  } else {
    rows.push([
      { text: t(lang, 'btn_search_country'), callback_data: 'search:ctry_pick' },
      { text: t(lang, 'btn_popular_countries'), callback_data: 'menu:countries' },
    ]);
  }

  rows.push([{ text: t(lang, 'btn_main_menu'), callback_data: 'menu:main' }]);
  return { inline_keyboard: rows };
}

export function buildCountryServicesPriceKeyboard(countryId, items, page = 0, totalPages = 1, lang = 'en') {
  const rows = [];

  for (const s of items) {
    const priceLabel =
      s.retailPrice !== null && s.retailPrice !== undefined
        ? formatPrice(s.retailPrice)
        : 'Live';
    const stockLabel =
      s.phones !== null && s.phones !== undefined ? ` (${s.phones})` : '';
    rows.push([
      {
        text: `${s.name} — ${priceLabel}${stockLabel}`,
        callback_data: `chkout:${s.code}:${countryId}`,
      },
    ]);
  }

  if (totalPages > 1) {
    const nav = [];
    if (page > 0) {
      nav.push({ text: t(lang, 'btn_prev'), callback_data: `svcs_in:${countryId}:${page - 1}` });
    }
    nav.push({ text: `${page + 1}/${totalPages}`, callback_data: 'noop' });
    if (page < totalPages - 1) {
      nav.push({ text: t(lang, 'btn_next'), callback_data: `svcs_in:${countryId}:${page + 1}` });
    }
    rows.push(nav);
  }

  rows.push([
    { text: t(lang, 'btn_search_service'), callback_data: `search:svc_in:${countryId}` },
    { text: t(lang, 'btn_refresh_prices'), callback_data: `pickctry:${countryId}` },
  ]);
  rows.push([
    { text: t(lang, 'btn_back_countries'), callback_data: 'menu:countries' },
    { text: t(lang, 'btn_main_menu'), callback_data: 'menu:main' },
  ]);

  return { inline_keyboard: rows };
}

export function buildServiceSelectionKeyboard(services = POPULAR_SERVICES, page = 0, mode = 'popular', lang = 'en') {
  const rows = [];
  const totalPages = Math.max(1, Math.ceil(services.length / SERVICES_PAGE_SIZE));
  const safePage = Math.max(0, Math.min(page, totalPages - 1));
  const slice =
    mode === 'all'
      ? services.slice(safePage * SERVICES_PAGE_SIZE, (safePage + 1) * SERVICES_PAGE_SIZE)
      : services.slice(0, 16);

  for (let i = 0; i < slice.length; i += 2) {
    const pair = slice.slice(i, i + 2).map((s) => ({
      text: s.name,
      callback_data: `svc:${s.code}`,
    }));
    rows.push(pair);
  }

  if (mode === 'all' && totalPages > 1) {
    const nav = [];
    if (safePage > 0) {
      nav.push({ text: t(lang, 'btn_prev'), callback_data: `svcs:all:${safePage - 1}` });
    }
    nav.push({ text: `${safePage + 1}/${totalPages}`, callback_data: 'noop' });
    if (safePage < totalPages - 1) {
      nav.push({ text: t(lang, 'btn_next'), callback_data: `svcs:all:${safePage + 1}` });
    }
    rows.push(nav);
  }

  rows.push([
    { text: t(lang, 'btn_by_country'), callback_data: 'menu:countries' },
    { text: t(lang, 'btn_main_menu'), callback_data: 'menu:main' },
  ]);
  return { inline_keyboard: rows };
}

export function buildCountryPriceKeyboard(serviceCode, items, page = 0, totalPages = 1, lang = 'en') {
  const rows = [];

  for (const c of items) {
    const priceLabel =
      c.retailPrice !== null && c.retailPrice !== undefined
        ? formatPrice(c.retailPrice)
        : 'Live';
    const stockLabel =
      c.phones !== null && c.phones !== undefined ? ` (${c.phones})` : '';
    rows.push([
      {
        text: `${c.flag} ${c.name} — ${priceLabel}${stockLabel}`,
        callback_data: `chkout:${serviceCode}:${c.id}`,
      },
    ]);
  }

  if (totalPages > 1) {
    const nav = [];
    if (page > 0) {
      nav.push({ text: t(lang, 'btn_prev'), callback_data: `ctry:${serviceCode}:${page - 1}` });
    }
    nav.push({ text: `${page + 1}/${totalPages}`, callback_data: 'noop' });
    if (page < totalPages - 1) {
      nav.push({ text: t(lang, 'btn_next'), callback_data: `ctry:${serviceCode}:${page + 1}` });
    }
    rows.push(nav);
  }

  rows.push([
    { text: t(lang, 'btn_back_services'), callback_data: 'menu:smart' },
    { text: t(lang, 'btn_main_menu'), callback_data: 'menu:main' },
  ]);

  return { inline_keyboard: rows };
}

export function buildActivationControlKeyboard(activationId, serviceCode = '', countryId = '', lang = 'en') {
  const rows = [
    [{ text: t(lang, 'btn_check_sms'), callback_data: `chk:${activationId}` }],
    [
      {
        text: t(lang, 'btn_next_sms'),
        callback_data: `set:${activationId}:${ActivationSetStatus.REQUEST_MORE_SMS}`,
      },
      {
        text: t(lang, 'btn_complete'),
        callback_data: `set:${activationId}:${ActivationSetStatus.COMPLETE}`,
      },
    ],
    [
      {
        text: t(lang, 'btn_cancel'),
        callback_data: `set:${activationId}:${ActivationSetStatus.CANCEL}`,
      },
    ],
  ];

  if (serviceCode && countryId) {
    rows.push([
      {
        text: t(lang, 'btn_buy_another'),
        callback_data: `buy:${serviceCode}:${countryId}`,
      },
    ]);
  }

  rows.push([
    { text: t(lang, 'btn_orders'), callback_data: 'menu:orders' },
    { text: t(lang, 'btn_main_menu'), callback_data: 'menu:main' },
  ]);

  return { inline_keyboard: rows };
}

export function buildOrdersListKeyboard(orderRows, lang = 'en') {
  const rows = orderRows.map((o) => {
    const mark =
      o.status === 'OK' || o.status === 'COMPLETE'
        ? '✓'
        : o.status === 'CANCEL'
          ? '×'
          : '•';
    const phone = o.phoneNumber.startsWith('+') ? o.phoneNumber : `+${o.phoneNumber}`;
    return [
      {
        text: `${mark} ${phone} · ${findServiceName(o.serviceCode)}`,
        callback_data: `chk:${o.activationId}`,
      },
    ];
  });
  rows.push([
    { text: t(lang, 'btn_buy'), callback_data: 'menu:smart' },
    { text: t(lang, 'btn_main_menu'), callback_data: 'menu:main' },
  ]);
  return { inline_keyboard: rows };
}

export function getSetupNeededMessage(firstName) {
  const greeting = firstName ? `Hello, <b>${escapeHtml(firstName)}</b>!` : 'Hello!';
  return [
    `👋 ${greeting}`,
    '',
    `⚙️ <b>${BRAND_NAME} — Initial Setup</b>`,
    'Your virtual SMS platform is not connected yet.',
    '',
    'To claim ownership and activate your gateway, send:',
    '<code>/setkey YOUR_API_KEY</code>',
    '',
    '🔒 <i>Your key message is deleted immediately after verification.</i>',
  ].join('\n');
}

export function getWelcomeMessage(firstName, hasApiKey, balanceCents = 0, lang = 'en', pointsBalance = 0) {
  const statusLine = hasApiKey ? null : t(lang, 'status_setup');
  return [
    t(lang, 'welcome_title'),
    t(lang, 'welcome_tagline'),
    '',
    '<blockquote>' +
      [
        ...(statusLine ? [statusLine] : []),
        t(lang, 'wallet_line', { bal: escapeHtml(centsToUsdString(balanceCents)) }),
        t(lang, 'points_line', { pts: Number(pointsBalance || 0).toLocaleString() }),
        t(lang, 'catalog_line', {
          services: ALL_SERVICES.length.toLocaleString(),
          countries: ALL_COUNTRIES.length,
        }),
      ].join('\n') +
      '</blockquote>',
    '',
    t(lang, 'welcome_desc'),
  ].join('\n');
}

export function getHelpMessage(isOwner, lang = 'en') {
  const lines =
    lang === 'fa'
      ? [
          '📖 <b>راهنمای دستورات یک‌تپ (YekTap)</b>',
          '',
          '<b>۱. کیف پول و شارژ</b>',
          '• /wallet — مشاهده موجودی کیف پول و تراکنش‌ها',
          '• /topup — شارژ حساب با استارز تلگرام یا بایننس/تتر',
          '• /lang — تغییر زبان ربات و مینی‌اپ',
          '',
          '<b>۲. خرید و جستجوی شماره مجازی</b>',
          '• /start — منوی اصلی و ورود به مینی‌اپ',
          '• /buy — انتخاب کشور و مشاهده قیمت سرویس‌ها',
          '• <code>/buy &lt;service&gt; &lt;country&gt;</code> — خرید مستقیم',
          '• <code>/search &lt;نام&gt;</code> — جستجوی کشور و سرویس',
          '• <code>/prices &lt;country&gt;</code> — مشاهده قیمت‌های لحظه‌ای',
          '',
          '<b>۳. مدیریت شماره‌های فعال</b>',
          '• /orders — مشاهده شماره‌های اخیر شما',
          '• <code>/status &lt;id&gt;</code> — دریافت کد پیامک',
          '• <code>/cancel &lt;id&gt;</code> — لغو و بازگشت خودکار وجه به کیف پول',
          '• /id — مشاهده شناسه تلگرام شما',
        ]
      : [
          `📖 <b>${BRAND_NAME} Command Reference</b>`,
          '',
          '<b>1. Wallet & Language</b>',
          '• /wallet — View your USD wallet balance & transactions',
          '• /topup — Add funds via Telegram Stars or Binance Pay / Crypto',
          '• /lang — Change language (English, فارسی, العربية, Русский, Türkçe)',
          '',
          '<b>2. Browse, Search & Buy Numbers</b>',
          '• /start — Main dashboard & Mini App launcher',
          '• /buy — Select country & browse live service prices',
          '• <code>/buy &lt;service&gt; &lt;country&gt; [maxPrice]</code> — Direct order',
          '• <code>/search &lt;query&gt;</code> — Search countries & services',
          '• <code>/prices &lt;service&gt; &lt;country&gt;</code> — View live price & stock',
          '',
          '<b>3. Manage Active Numbers & OTPs</b>',
          '• /orders — View your recent virtual numbers',
          '• <code>/status &lt;id&gt;</code> — Check incoming SMS OTP code',
          '• <code>/next &lt;id&gt;</code> — Request another SMS',
          '• <code>/finish &lt;id&gt;</code> — Mark activation complete',
          '• <code>/cancel &lt;id&gt;</code> — Cancel & auto-refund to wallet',
          '• /id — View your Telegram User ID',
        ];

  if (isOwner) {
    lines.push(
      '',
      lang === 'fa' ? '<b>۴. پنل مدیریت (مالک)</b>' : '<b>4. Owner Administration</b>',
      '• /stats — Revenue, wholesale cost, points & commission profit',
      '• /users [page] — View all users with USD, points, orders & referrals',
      '• /balance — Check main platform gateway balance',
      '• <code>/addbalance &lt;user_id&gt; &lt;usd&gt; [note]</code>',
      '• <code>/deductbalance &lt;user_id&gt; &lt;usd&gt; [note]</code>',
      '• <code>/setpay binance|bep20|usdt_bep20|usdc_bep20 &lt;address&gt;</code>',
      '• <code>/setbinanceapi &lt;api_key&gt; &lt;api_secret&gt;</code> — Auto-verify Binance Pay',
      '• <code>/refundstar &lt;user_id&gt; &lt;charge_id&gt;</code> — Official Stars refund',
      '• /payconfig — View configured payment addresses',
      '• <code>/setstarsrate &lt;stars_per_usd&gt;</code>',
      '• <code>/setmarkup &lt;percent&gt;</code>',
      '• <code>/setrefpoints &lt;points&gt;</code> — Points per referral',
      '• <code>/setrefbonus &lt;points&gt;</code> — Invited friend welcome bonus',
      '• <code>/setpointsrate &lt;pts_per_usd&gt;</code> — Dynamic points rate',
      '• <code>/setservicepoints &lt;service&gt; &lt;points|clear&gt;</code> — Per-service points',
      '• /servicepoints — List custom service point prices',
      '• <code>/addpoints &lt;user_id&gt; &lt;points&gt; [note]</code> | <code>/deductpoints</code>',
      '• <code>/setkey &lt;api_key&gt;</code>',
      '• <code>/block &lt;user_id&gt;</code> | <code>/unblock &lt;user_id&gt;</code> | /blocked'
    );
  }

  return lines.join('\n');
}

export function formatOrderStatusText(activationId, res, orderRow, lang = 'en') {
  const nowUtc = new Date().toISOString().slice(11, 19);
  const phoneLine = orderRow
    ? t(lang, 'phone_label', { phone: escapeHtml(orderRow.phoneNumber.replace(/^\+/, '')) })
    : null;
  const metaLine = orderRow
    ? `${escapeHtml(findServiceName(orderRow.serviceCode))} · ${escapeHtml(findCountryName(orderRow.countryId))}`
    : null;

  const header = [];
  if (phoneLine) header.push(phoneLine);
  if (metaLine) header.push(metaLine);
  header.push(t(lang, 'act_id_label', { id: escapeHtml(activationId) }));

  if (res.state === 'OK' && res.code) {
    return [
      t(lang, 'otp_received'),
      '',
      `<blockquote>${t(lang, 'otp_code_label', { code: escapeHtml(res.code) })}</blockquote>`,
      '',
      ...header,
      '',
      `<i>${nowUtc} UTC</i>`,
    ].join('\n');
  }

  if (res.state === 'WAIT_CODE') {
    const vpnLine = orderRow
      ? `\n<blockquote>${t(lang, 'vpn_tip', { country: escapeHtml(findCountryName(orderRow.countryId)) })}</blockquote>`
      : '';
    return [t(lang, 'waiting_sms'), '', ...header, vpnLine, '', `<i>${nowUtc} UTC</i>`]
      .filter((x) => x !== '')
      .join('\n');
  }

  if (res.state === 'WAIT_RESEND') {
    const vpnLine = orderRow
      ? `\n<blockquote>${t(lang, 'vpn_tip', { country: escapeHtml(findCountryName(orderRow.countryId)) })}</blockquote>`
      : '';
    return [t(lang, 'waiting_next_sms'), '', ...header, vpnLine, '', `<i>${nowUtc} UTC</i>`]
      .filter((x) => x !== '')
      .join('\n');
  }

  if (res.state === 'CANCEL') {
    return [t(lang, 'act_cancelled'), '', ...header].join('\n');
  }

  return [
    '⚠️ <b>Status Error</b>',
    '',
    ...header,
    `❌ <code>${escapeHtml(res.error || res.raw)}</code>`,
  ].join('\n');
}
