import { api, BotApiError } from 'sdk';
import { ActivationSetStatus } from './secondnumber.js';
import {
  POPULAR_SERVICES,
  POPULAR_COUNTRIES,
  findServiceName,
  findCountryName,
} from './catalog.js';

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
      // Ignore "message is not modified" or stale message errors
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

export function buildMainMenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '📱 Buy Virtual Number', callback_data: 'menu:services' },
        { text: '💰 Check Balance', callback_data: 'act:balance' },
      ],
      [
        { text: '📋 My Recent Numbers', callback_data: 'menu:orders' },
        { text: 'ℹ️ Help & Commands', callback_data: 'menu:help' },
      ],
    ],
  };
}

export function buildServiceSelectionKeyboard() {
  const rows = [];
  for (let i = 0; i < POPULAR_SERVICES.length; i += 2) {
    const pair = POPULAR_SERVICES.slice(i, i + 2).map((s) => ({
      text: `${s.emoji} ${s.name}`,
      callback_data: `svc:${s.code}`,
    }));
    rows.push(pair);
  }
  rows.push([{ text: '🔙 Main Menu', callback_data: 'menu:main' }]);
  return { inline_keyboard: rows };
}

export function buildCountrySelectionKeyboard(serviceCode) {
  const rows = [];
  for (let i = 0; i < POPULAR_COUNTRIES.length; i += 2) {
    const pair = POPULAR_COUNTRIES.slice(i, i + 2).map((c) => ({
      text: `${c.flag} ${c.name}`,
      callback_data: `buy:${serviceCode}:${c.id}`,
    }));
    rows.push(pair);
  }
  rows.push([
    { text: '🔙 Services', callback_data: 'menu:services' },
    { text: '🏠 Main Menu', callback_data: 'menu:main' },
  ]);
  return { inline_keyboard: rows };
}

export function buildActivationControlKeyboard(activationId, serviceCode = '', countryId = '') {
  const rows = [
    [{ text: '🔄 Check SMS Code', callback_data: `chk:${activationId}` }],
    [
      {
        text: '📩 Next SMS',
        callback_data: `set:${activationId}:${ActivationSetStatus.REQUEST_MORE_SMS}`,
      },
      {
        text: '✅ Complete',
        callback_data: `set:${activationId}:${ActivationSetStatus.COMPLETE}`,
      },
    ],
    [
      {
        text: '❌ Cancel & Refund',
        callback_data: `set:${activationId}:${ActivationSetStatus.CANCEL}`,
      },
    ],
  ];

  if (serviceCode && countryId) {
    rows.push([
      {
        text: '🔁 Buy Another (Same Service & Country)',
        callback_data: `buy:${serviceCode}:${countryId}`,
      },
    ]);
  }

  rows.push([
    { text: '📋 My Numbers', callback_data: 'menu:orders' },
    { text: '🏠 Main Menu', callback_data: 'menu:main' },
  ]);

  return { inline_keyboard: rows };
}

export function buildOrdersListKeyboard(orderRows) {
  const rows = orderRows.map((o) => {
    const icon =
      o.status === 'OK' || o.status === 'COMPLETE'
        ? '✅'
        : o.status === 'CANCEL'
          ? '❌'
          : '⏳';
    const phone = o.phoneNumber.startsWith('+') ? o.phoneNumber : `+${o.phoneNumber}`;
    return [
      {
        text: `${icon} ${phone} (${o.serviceCode})`,
        callback_data: `chk:${o.activationId}`,
      },
    ];
  });
  rows.push([
    { text: '📱 Buy New Number', callback_data: 'menu:services' },
    { text: '🏠 Main Menu', callback_data: 'menu:main' },
  ]);
  return { inline_keyboard: rows };
}

export function getSetupNeededMessage(firstName) {
  const greeting = firstName ? `Hello, <b>${escapeHtml(firstName)}</b>!` : 'Hello!';
  return [
    `👋 ${greeting}`,
    '',
    '⚙️ <b>Initial Setup Required</b>',
    'This bot runs natively on <b>Telegram Serverless</b> and is not configured yet.',
    '',
    'To claim ownership and connect your <b>SecondNumber.io</b> account, send:',
    '<code>/setkey YOUR_SECONDNUMBER_API_KEY</code>',
    '',
    '🔒 <i>Your API key message will be deleted immediately after saving into the bot\'s private SQLite database.</i>',
  ].join('\n');
}

export function getWelcomeMessage(firstName, hasApiKey) {
  const greeting = firstName ? `Hello, <b>${escapeHtml(firstName)}</b>!` : 'Hello!';
  return [
    `👋 ${greeting}`,
    '',
    'Welcome to the <b>SecondNumber.io Virtual SMS Bot</b> (powered natively by Telegram Serverless).',
    hasApiKey
      ? '🟢 <b>API Status:</b> Connected'
      : '🔴 <b>API Status:</b> Not set — send <code>/setkey YOUR_API_KEY</code>',
    '',
    '<b>Quick Commands:</b>',
    '• /buy — Interactive Service & Country menu',
    '• <code>/buy &lt;service&gt; &lt;country&gt; [maxPrice]</code> — Direct order (e.g. <code>/buy tg 187</code>)',
    '• /balance — Check SecondNumber.io account balance',
    '• /orders — View & manage your recent virtual numbers',
    '• <code>/status &lt;id&gt;</code> — Check SMS OTP code for an activation ID',
    '• /help — Full guide & admin whitelist commands',
  ].join('\n');
}

export function getHelpMessage(isOwner) {
  const lines = [
    '📖 <b>SecondNumber.io Bot Guide</b>',
    '',
    '<b>1. Buy Virtual Numbers</b>',
    '• Tap <b>📱 Buy Virtual Number</b> or send /buy',
    '• Or direct command: <code>/buy &lt;service&gt; &lt;country&gt; [maxPrice]</code>',
    '  Examples: <code>/buy tg 187</code> (Telegram US), <code>/buy wa 16 1.50</code> (WhatsApp UK, max $1.50)',
    '',
    '<b>2. Manage Active Numbers & OTP Codes</b>',
    '• /orders — View recent numbers stored in SQLite',
    '• <code>/status &lt;id&gt;</code> — Poll incoming SMS code',
    '• <code>/next &lt;id&gt;</code> — Request another SMS (status=3)',
    '• <code>/finish &lt;id&gt;</code> — Complete activation (status=6)',
    '• <code>/cancel &lt;id&gt;</code> — Cancel & refund activation (status=8)',
    '• /balance — Check account balance',
    '• /id — View your Telegram User ID',
  ];

  if (isOwner) {
    lines.push(
      '',
      '<b>3. Owner / Admin Controls</b>',
      '• <code>/setkey &lt;api_key&gt;</code> — Update SecondNumber.io API key (auto-deletes message)',
      '• <code>/allow &lt;user_id&gt; [label]</code> — Add a user to the bot whitelist',
      '• <code>/revoke &lt;user_id&gt;</code> — Remove a user from the whitelist',
      '• /admins — List authorized users'
    );
  }

  return lines.join('\n');
}

export function formatOrderStatusText(activationId, res, orderRow) {
  const nowUtc = new Date().toISOString().slice(11, 19);
  const phoneLine = orderRow
    ? `📞 <b>Phone:</b> <code>+${escapeHtml(orderRow.phoneNumber.replace(/^\+/, ''))}</code>`
    : null;
  const metaLine = orderRow
    ? `📦 <b>Service:</b> ${escapeHtml(findServiceName(orderRow.serviceCode))} | 🌍 ${escapeHtml(findCountryName(orderRow.countryId))}`
    : null;

  const header = [];
  if (phoneLine) header.push(phoneLine);
  if (metaLine) header.push(metaLine);
  header.push(`🆔 <b>Activation ID:</b> <code>${escapeHtml(activationId)}</code>`);

  if (res.state === 'OK' && res.code) {
    return [
      '🎉 <b>SMS Verification Code Received!</b>',
      '',
      `🔑 <b>OTP Code:</b> <code>${escapeHtml(res.code)}</code>`,
      ...header,
      '',
      `<i>Checked at ${nowUtc} UTC</i>`,
    ].join('\n');
  }

  if (res.state === 'WAIT_CODE') {
    return [
      '⏳ <b>Waiting for SMS...</b>',
      '',
      ...header,
      '📡 <b>State:</b> <code>STATUS_WAIT_CODE</code>',
      '',
      `<i>Checked at ${nowUtc} UTC — tap <b>🔄 Check SMS Code</b> to refresh.</i>`,
    ].join('\n');
  }

  if (res.state === 'WAIT_RESEND') {
    return [
      '📩 <b>Waiting for Next SMS...</b>',
      '',
      ...header,
      '📡 <b>State:</b> <code>STATUS_WAIT_RESEND</code>',
      '',
      `<i>Checked at ${nowUtc} UTC — tap <b>🔄 Check SMS Code</b> to refresh.</i>`,
    ].join('\n');
  }

  if (res.state === 'CANCEL') {
    return [
      '❌ <b>Activation Cancelled</b>',
      '',
      ...header,
      '📡 <b>State:</b> <code>STATUS_CANCEL</code>',
    ].join('\n');
  }

  return [
    '⚠️ <b>Activation Status Error</b>',
    '',
    ...header,
    `❌ <b>Error:</b> <code>${escapeHtml(res.error || res.raw)}</code>`,
  ].join('\n');
}
