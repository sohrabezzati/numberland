import { createSecondNumberClient, ActivationSetStatus } from './secondnumber.js';
import {
  getApiConfig,
  saveOrder,
  updateOrderStatus,
  getOrderByActivationId,
  getRecentOrders,
} from './store.js';
import { findServiceName, findCountryName } from './catalog.js';
import {
  escapeHtml,
  sendHtml,
  editHtml,
  buildMainMenuKeyboard,
  buildCountrySelectionKeyboard,
  buildActivationControlKeyboard,
  buildOrdersListKeyboard,
  formatOrderStatusText,
} from './ui.js';

async function getClientOrWarn(chatId, editMessageId) {
  const { apiKey, baseUrl } = await getApiConfig();
  if (!apiKey) {
    const msg =
      '⚠️ <b>SecondNumber API key is not configured yet.</b>\nSend <code>/setkey YOUR_API_KEY</code> to connect your account.';
    if (editMessageId) {
      await editHtml(chatId, editMessageId, msg, buildMainMenuKeyboard());
    } else {
      await sendHtml(chatId, msg, buildMainMenuKeyboard());
    }
    return null;
  }
  return createSecondNumberClient(apiKey, baseUrl);
}

export async function runBalanceAction(chatId, editMessageId) {
  const sn = await getClientOrWarn(chatId, editMessageId);
  if (!sn) return null;

  try {
    const res = await sn.getBalance();
    const nowUtc = new Date().toISOString().slice(11, 19);
    const text = res.ok
      ? `💰 <b>SecondNumber Account Balance:</b> <code>$${escapeHtml(res.balance)}</code>\n\n<i>Updated at ${nowUtc} UTC</i>`
      : `⚠️ <b>Failed to fetch balance</b>\n<code>${escapeHtml(res.error || res.raw)}</code>`;

    if (editMessageId) {
      await editHtml(chatId, editMessageId, text, buildMainMenuKeyboard());
    } else {
      await sendHtml(chatId, text, buildMainMenuKeyboard());
    }
    return res;
  } catch (err) {
    const text = `⚠️ <b>Network error contacting SecondNumber.io</b>\n<code>${escapeHtml(err.message)}</code>`;
    if (editMessageId) {
      await editHtml(chatId, editMessageId, text, buildMainMenuKeyboard());
    } else {
      await sendHtml(chatId, text, buildMainMenuKeyboard());
    }
    return null;
  }
}

export async function runBuyNumberAction({
  chatId,
  userId,
  serviceCode,
  countryId,
  maxPrice,
  editMessageId,
}) {
  const sn = await getClientOrWarn(chatId, editMessageId);
  if (!sn) return;

  try {
    const res = await sn.getNumber(serviceCode, countryId, maxPrice);

    if (res.ok && res.activationId && res.phoneNumber) {
      await saveOrder({
        activationId: res.activationId,
        phoneNumber: res.phoneNumber,
        serviceCode,
        countryId,
        userId,
        chatId,
      });

      const phone = res.phoneNumber.replace(/^\+/, '');
      const text = [
        '✅ <b>Virtual Number Activated!</b>',
        '',
        `📞 <b>Phone Number:</b> <code>+${escapeHtml(phone)}</code>`,
        `🆔 <b>Activation ID:</b> <code>${escapeHtml(res.activationId)}</code>`,
        `📦 <b>Service:</b> ${escapeHtml(findServiceName(serviceCode))}`,
        `🌍 <b>Country:</b> ${escapeHtml(findCountryName(countryId))}`,
        '',
        '⏳ <b>Status:</b> Waiting for SMS verification code...',
        '<i>Request the OTP on the target app, then tap <b>🔄 Check SMS Code</b> below.</i>',
      ].join('\n');

      const kb = buildActivationControlKeyboard(res.activationId, serviceCode, countryId);
      if (editMessageId) {
        await editHtml(chatId, editMessageId, text, kb);
      } else {
        await sendHtml(chatId, text, kb);
      }
      return;
    }

    const errText = [
      '⚠️ <b>Could Not Purchase Number</b>',
      '',
      `📦 <b>Service:</b> ${escapeHtml(findServiceName(serviceCode))}`,
      `🌍 <b>Country:</b> ${escapeHtml(findCountryName(countryId))}`,
      `❌ <b>Reason:</b> <code>${escapeHtml(res.error || res.raw)}</code>`,
    ].join('\n');

    const kb = buildCountrySelectionKeyboard(serviceCode);
    if (editMessageId) {
      await editHtml(chatId, editMessageId, errText, kb);
    } else {
      await sendHtml(chatId, errText, kb);
    }
  } catch (err) {
    const errText = `⚠️ <b>Network error ordering number</b>\n<code>${escapeHtml(err.message)}</code>`;
    if (editMessageId) {
      await editHtml(chatId, editMessageId, errText, buildMainMenuKeyboard());
    } else {
      await sendHtml(chatId, errText, buildMainMenuKeyboard());
    }
  }
}

export async function runCheckStatusAction(chatId, activationId, editMessageId) {
  const sn = await getClientOrWarn(chatId, editMessageId);
  if (!sn) return null;

  try {
    const res = await sn.getStatus(activationId);
    const orderRow = await getOrderByActivationId(activationId);

    if (orderRow && res.ok) {
      await updateOrderStatus(activationId, res.state, res.code);
    }

    const text = formatOrderStatusText(activationId, res, orderRow);
    const kb = buildActivationControlKeyboard(
      activationId,
      orderRow?.serviceCode || '',
      orderRow?.countryId || ''
    );

    if (editMessageId) {
      await editHtml(chatId, editMessageId, text, kb);
    } else {
      await sendHtml(chatId, text, kb);
    }
    return res;
  } catch (err) {
    const text = `⚠️ <b>Error checking activation status</b>\n<code>${escapeHtml(err.message)}</code>`;
    if (editMessageId) {
      await editHtml(chatId, editMessageId, text, buildMainMenuKeyboard());
    } else {
      await sendHtml(chatId, text, buildMainMenuKeyboard());
    }
    return null;
  }
}

export async function runSetStatusAction(chatId, activationId, statusNum, editMessageId) {
  const sn = await getClientOrWarn(chatId, editMessageId);
  if (!sn) return null;

  try {
    const res = await sn.setStatus(activationId, statusNum);
    const orderRow = await getOrderByActivationId(activationId);

    if (res.ok) {
      const dbStatus =
        statusNum === ActivationSetStatus.CANCEL
          ? 'CANCEL'
          : statusNum === ActivationSetStatus.COMPLETE
            ? 'COMPLETE'
            : 'WAIT_RESEND';

      if (orderRow) {
        await updateOrderStatus(activationId, dbStatus);
      }

      const heading =
        statusNum === ActivationSetStatus.CANCEL
          ? '❌ <b>Activation Cancelled & Refunded</b>'
          : statusNum === ActivationSetStatus.COMPLETE
            ? '🎉 <b>Activation Marked Complete</b>'
            : '📩 <b>Requested Next SMS</b>';

      const text = [
        heading,
        ...(orderRow
          ? [`📞 <b>Phone:</b> <code>+${escapeHtml(orderRow.phoneNumber.replace(/^\+/, ''))}</code>`]
          : []),
        `🆔 <b>Activation ID:</b> <code>${escapeHtml(activationId)}</code>`,
        `📡 <b>API Response:</b> <code>${escapeHtml(res.statusText)}</code>`,
      ].join('\n');

      const kb =
        statusNum === ActivationSetStatus.REQUEST_MORE_SMS
          ? buildActivationControlKeyboard(
              activationId,
              orderRow?.serviceCode || '',
              orderRow?.countryId || ''
            )
          : buildMainMenuKeyboard();

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

export async function runOrdersListAction(chatId, userId, editMessageId) {
  const recent = await getRecentOrders(userId, 8);
  if (recent.length === 0) {
    const text =
      '📋 <b>My Recent Numbers</b>\n\nYou have not ordered any virtual numbers yet. Tap <b>📱 Buy Virtual Number</b> to get started.';
    if (editMessageId) {
      await editHtml(chatId, editMessageId, text, buildMainMenuKeyboard());
    } else {
      await sendHtml(chatId, text, buildMainMenuKeyboard());
    }
    return;
  }

  const text = [
    '📋 <b>My Recent Virtual Numbers</b>',
    '',
    'Tap any number below to check its incoming SMS code or cancel/complete it:',
  ].join('\n');

  const kb = buildOrdersListKeyboard(recent);
  if (editMessageId) {
    await editHtml(chatId, editMessageId, text, kb);
  } else {
    await sendHtml(chatId, text, kb);
  }
}
