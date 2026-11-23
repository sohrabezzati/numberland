import { api, BotApiError } from 'sdk';
import {
  checkAccess,
  getApiConfig,
  setSetting,
  setOwner,
  addAllowedUser,
  removeAllowedUser,
  listAllowedUsers,
} from '../lib/store.js';
import { ActivationSetStatus, createSecondNumberClient } from '../lib/secondnumber.js';
import {
  escapeHtml,
  sendHtml,
  buildMainMenuKeyboard,
  buildServiceSelectionKeyboard,
  getSetupNeededMessage,
  getWelcomeMessage,
  getHelpMessage,
} from '../lib/ui.js';
import {
  runBalanceAction,
  runBuyNumberAction,
  runCheckStatusAction,
  runSetStatusAction,
  runOrdersListAction,
} from '../lib/actions.js';

export default async function (message) {
  if (!message || !message.text) return;

  const chatId = message.chat.id;
  const userId = message.from?.id;
  const firstName = message.from?.first_name || '';
  const username = message.from?.username ? `@${message.from.username}` : firstName;
  const text = message.text.trim();
  const [rawCommand, ...args] = text.split(/\s+/);
  const command = rawCommand.split('@')[0].toLowerCase();

  // Always allow `/id` so users can check their Telegram User ID
  if (command === '/id') {
    await sendHtml(
      chatId,
      `🆔 <b>Your Telegram User ID:</b> <code>${userId ?? 'unknown'}</code>\n💬 <b>Chat ID:</b> <code>${chatId}</code>`
    );
    return;
  }

  const access = await checkAccess(userId);

  // First-time setup flow: `/setkey <API_KEY>` claims ownership if no owner is set yet
  if (command === '/setkey') {
    if (access.hasOwner && !access.isOwner) {
      await sendHtml(chatId, '⛔ Only the bot owner can change the SecondNumber API key.');
      return;
    }

    const newKey = args[0]?.trim();
    if (!newKey) {
      await sendHtml(
        chatId,
        '⚠️ <b>Usage:</b> <code>/setkey YOUR_SECONDNUMBER_API_KEY</code>'
      );
      return;
    }

    // Delete the user's message containing the secret API key for privacy
    try {
      await api.deleteMessage({ chat_id: chatId, message_id: message.message_id });
    } catch (e) {
      if (!(e instanceof BotApiError && e.code === 400)) {
        console.warn('Could not delete /setkey message:', e.message);
      }
    }

    // Validate the key against SecondNumber.io getBalance before saving
    const { baseUrl } = await getApiConfig();
    const sn = createSecondNumberClient(newKey, baseUrl);
    let balanceCheck;
    try {
      balanceCheck = await sn.getBalance();
    } catch (err) {
      await sendHtml(
        chatId,
        `⚠️ <b>Could not reach SecondNumber.io to verify key</b>\n<code>${escapeHtml(err.message)}</code>`
      );
      return;
    }

    if (!balanceCheck.ok) {
      await sendHtml(
        chatId,
        `❌ <b>API Key Rejected by SecondNumber.io</b>\n<code>${escapeHtml(balanceCheck.error || balanceCheck.raw)}</code>\n\nPlease double-check your key in the SecondNumber.io dashboard and try again.`
      );
      return;
    }

    if (!access.hasOwner && userId) {
      await setOwner(userId, username);
    }
    await setSetting('secondnumber_api_key', newKey);

    await sendHtml(
      chatId,
      [
        '✅ <b>SecondNumber.io API Key Saved & Verified!</b>',
        `💰 <b>Current Balance:</b> <code>$${escapeHtml(balanceCheck.balance)}</code>`,
        ...(access.hasOwner
          ? []
          : [`👑 <b>Bot Owner Set:</b> <code>${userId}</code> (${escapeHtml(username)})`]),
        '',
        '<i>Your secret key message was deleted from chat history for security.</i>',
      ].join('\n'),
      buildMainMenuKeyboard()
    );
    return;
  }

  // If no owner exists yet, guide user to run /setkey
  if (!access.hasOwner) {
    await sendHtml(chatId, getSetupNeededMessage(firstName));
    return;
  }

  // Enforce whitelist
  if (!access.authorized) {
    await sendHtml(
      chatId,
      `⛔ <b>Access Denied</b>\nYour Telegram User ID (<code>${userId}</code>) is not authorized to use this bot.\nAsk the bot owner to run: <code>/allow ${userId}</code>`
    );
    return;
  }

  // Owner-only whitelist management commands
  if (command === '/allow') {
    if (!access.isOwner) {
      await sendHtml(chatId, '⛔ Only the bot owner can manage the admin whitelist.');
      return;
    }
    const targetId = Number(args[0]);
    if (!targetId || Number.isNaN(targetId)) {
      await sendHtml(chatId, '⚠️ <b>Usage:</b> <code>/allow &lt;telegram_user_id&gt; [label]</code>');
      return;
    }
    const label = args.slice(1).join(' ') || `User ${targetId}`;
    await addAllowedUser(targetId, label);
    await sendHtml(
      chatId,
      `✅ Added user <code>${targetId}</code> (<b>${escapeHtml(label)}</b>) to the authorized whitelist.`
    );
    return;
  }

  if (command === '/revoke') {
    if (!access.isOwner) {
      await sendHtml(chatId, '⛔ Only the bot owner can manage the admin whitelist.');
      return;
    }
    const targetId = Number(args[0]);
    if (!targetId || Number.isNaN(targetId)) {
      await sendHtml(chatId, '⚠️ <b>Usage:</b> <code>/revoke &lt;telegram_user_id&gt;</code>');
      return;
    }
    if (targetId === userId) {
      await sendHtml(chatId, '⚠️ You cannot remove yourself as the bot owner.');
      return;
    }
    await removeAllowedUser(targetId);
    await sendHtml(chatId, `🗑️ Removed user <code>${targetId}</code> from the whitelist.`);
    return;
  }

  if (command === '/admins') {
    if (!access.isOwner) {
      await sendHtml(chatId, '⛔ Only the bot owner can view the admin whitelist.');
      return;
    }
    const users = await listAllowedUsers();
    const lines = users.map(
      (u) =>
        `• <code>${u.tgId}</code> — <b>${escapeHtml(u.label || 'Admin')}</b> (${escapeHtml(u.role)})`
    );
    await sendHtml(
      chatId,
      ['👥 <b>Authorized Users</b>', '', ...lines].join('\n'),
      buildMainMenuKeyboard()
    );
    return;
  }

  // Core Bot Commands
  if (command === '/start') {
    const { apiKey } = await getApiConfig();
    await sendHtml(chatId, getWelcomeMessage(firstName, Boolean(apiKey)), buildMainMenuKeyboard());
    return;
  }

  if (command === '/help') {
    await sendHtml(chatId, getHelpMessage(access.isOwner), buildMainMenuKeyboard());
    return;
  }

  if (command === '/balance') {
    await runBalanceAction(chatId);
    return;
  }

  if (command === '/orders') {
    await runOrdersListAction(chatId, userId);
    return;
  }

  if (command === '/buy') {
    if (args.length === 0) {
      await sendHtml(
        chatId,
        '📱 <b>Step 1/2: Select a Target Service</b>\nChoose a service below, or send <code>/buy &lt;service&gt; &lt;country&gt; [maxPrice]</code>:',
        buildServiceSelectionKeyboard()
      );
      return;
    }
    if (args.length < 2) {
      await sendHtml(
        chatId,
        '⚠️ <b>Usage:</b> <code>/buy &lt;service&gt; &lt;country&gt; [maxPrice]</code>\nExample: <code>/buy tg 187</code>'
      );
      return;
    }
    const [serviceCode, countryId, maxPrice] = args;
    await runBuyNumberAction({ chatId, userId, serviceCode, countryId, maxPrice });
    return;
  }

  if (command === '/status') {
    if (!args[0]) {
      await sendHtml(chatId, '⚠️ <b>Usage:</b> <code>/status &lt;activation_id&gt;</code>');
      return;
    }
    await runCheckStatusAction(chatId, args[0]);
    return;
  }

  if (command === '/cancel') {
    if (!args[0]) {
      await sendHtml(chatId, '⚠️ <b>Usage:</b> <code>/cancel &lt;activation_id&gt;</code>');
      return;
    }
    await runSetStatusAction(chatId, args[0], ActivationSetStatus.CANCEL);
    return;
  }

  if (command === '/finish') {
    if (!args[0]) {
      await sendHtml(chatId, '⚠️ <b>Usage:</b> <code>/finish &lt;activation_id&gt;</code>');
      return;
    }
    await runSetStatusAction(chatId, args[0], ActivationSetStatus.COMPLETE);
    return;
  }

  if (command === '/next') {
    if (!args[0]) {
      await sendHtml(chatId, '⚠️ <b>Usage:</b> <code>/next &lt;activation_id&gt;</code>');
      return;
    }
    await runSetStatusAction(chatId, args[0], ActivationSetStatus.REQUEST_MORE_SMS);
    return;
  }

  await sendHtml(
    chatId,
    '❓ Unrecognized command. Tap a button below or use /help to see all commands.',
    buildMainMenuKeyboard()
  );
}
