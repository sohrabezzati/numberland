import { api, BotApiError } from 'sdk';
import {
  usdToCents,
  centsToUsdString,
  checkAccess,
  getApiConfig,
  getOwnerId,
  setSetting,
  setOwner,
  blockUser,
  unblockUser,
  listBlockedUsers,
  getMarkupPercent,
  setMarkupPercent,
  getStarsPerUsd,
  setStarsPerUsd,
  getPayInfo,
  setPayInfo,
  getPaymentAddresses,
  setPaymentAddress,
  setBinanceApiCredentials,
  hasUserSelectedLang,
  getUserLang,
  setUserLang,
  getWallet,
  creditWallet,
  debitWalletAtomic,
  creditPoints,
  debitPointsAtomic,
  processReferralJoin,
  getReferralRewardPoints,
  setReferralRewardPoints,
  getReferralWelcomePoints,
  setReferralWelcomePoints,
  getPointsPerUsd,
  setPointsPerUsd,
  setServicePointsOverride,
  clearServicePointsOverride,
  listServicePointsOverrides,
  createDepositRequest,
  setUserState,
  getUserState,
  clearUserState,
} from '../lib/store.js';
import { ActivationSetStatus, createProviderClient } from '../lib/provider.js';
import {
  ALL_SERVICES,
  ALL_COUNTRIES,
  POPULAR_SERVICES,
  POPULAR_COUNTRIES,
  searchServices,
  searchCountries,
  findService,
} from '../lib/catalog.js';
import {
  escapeHtml,
  sendHtml,
  buildLanguageKeyboard,
  buildMainMenuKeyboard,
  buildCountrySelectionKeyboard,
  buildServiceSelectionKeyboard,
  buildDepositApprovalKeyboard,
  getFirstStartLanguageMessage,
  getSetupNeededMessage,
  getWelcomeMessage,
  getHelpMessage,
} from '../lib/ui.js';
import { t } from '../lib/i18n.js';
import {
  runWalletAction,
  runReferralAction,
  runTopUpMenuAction,
  runPlatformStatsAction,
  runAdminUsersAction,
  runBalanceAction,
  runCountryServicesAction,
  runServiceCountriesAction,
  runPricesAction,
  runBuyNumberAction,
  runCheckStatusAction,
  runSetStatusAction,
  runOrdersListAction,
} from '../lib/actions.js';
import {
  buildTopUpAmountKeyboard,
  buildPaymentMethodsKeyboard,
  processPaymentProof,
  fulfillPendingServiceIfAny,
} from '../lib/payments.js';
import { syncBotCommands } from '../lib/commands.js';

export default async function (message) {
  if (!message) return;

  const chatId = message.chat.id;
  const userId = message.from?.id;
  const firstName = message.from?.first_name || '';
  const username = message.from?.username ? `@${message.from.username}` : firstName;

  // 1. Handle completed Telegram Stars (XTR) payment (wallet top-up OR direct service purchase)
  if (message.successful_payment) {
    const sp = message.successful_payment;
    const payload = sp.invoice_payload || '';
    const userLang = await getUserLang(userId, message.from?.language_code);

    if (payload.startsWith('topup:') || payload.startsWith('svc:')) {
      const parts = payload.split(':');
      const targetUserId = Number(parts[1]) || userId;
      const amountCents = Number(parts[2]) || 0;
      const targetService = payload.startsWith('svc:') ? parts[3] : null;
      const targetCountry = payload.startsWith('svc:') ? parts[4] : null;

      if (targetUserId && amountCents > 0) {
        const updatedWallet = await creditWallet({
          userId: targetUserId,
          amountCents,
          type: 'deposit',
          referenceId: sp.telegram_payment_charge_id,
          note: `Telegram Stars (${sp.total_amount} ⭐)`,
        });

        await sendHtml(
          chatId,
          [
            userLang === 'fa'
              ? '✅ <b>پرداخت با استارز با موفقیت انجام شد!</b>'
              : '✅ <b>Telegram Stars Payment Confirmed!</b>',
            '',
            `⭐ <b>Paid:</b> <code>${sp.total_amount} Stars</code>`,
            `💳 <b>Credited:</b> <code>+${escapeHtml(centsToUsdString(amountCents))}</code>`,
            `💰 <b>Wallet Balance:</b> <code>${escapeHtml(centsToUsdString(updatedWallet.balanceCents))}</code>`,
          ].join('\n'),
          targetService ? undefined : buildMainMenuKeyboard(false, updatedWallet.balanceCents, userLang)
        );

        if (targetService && targetCountry) {
          await runBuyNumberAction({
            chatId,
            userId: targetUserId,
            serviceCode: targetService,
            countryId: targetCountry,
            lang: userLang,
          });
        }
      }
    }
    return;
  }

  const rawText = (message.text || message.caption || '').trim();
  if (!rawText) return;

  const isCommand = rawText.startsWith('/');
  const [rawCommand, ...args] = rawText.split(/\s+/);
  const command = isCommand ? rawCommand.split('@')[0].toLowerCase() : '';

  // Always allow `/id` so users can check their Telegram User ID
  if (command === '/id') {
    await sendHtml(
      chatId,
      `🆔 <b>Your Telegram User ID:</b> <code>${userId ?? 'unknown'}</code>\n💬 <b>Chat ID:</b> <code>${chatId}</code>`
    );
    return;
  }

  const access = await checkAccess(userId);
  const lang = await getUserLang(userId, message.from?.language_code);

  // First-time setup flow: `/setkey <API_KEY>` claims ownership if no owner is set yet
  if (command === '/setkey') {
    if (access.hasOwner && !access.isOwner) {
      await sendHtml(chatId, '⛔ Only the platform owner can update the gateway API key.');
      return;
    }

    const newKey = args[0]?.trim();
    if (!newKey) {
      await sendHtml(chatId, '⚠️ <b>Usage:</b> <code>/setkey YOUR_API_KEY</code>');
      return;
    }

    try {
      await api.deleteMessage({ chat_id: chatId, message_id: message.message_id });
    } catch (e) {
      if (!(e instanceof BotApiError && e.code === 400)) {
        console.warn('Could not delete /setkey message:', e.message);
      }
    }

    const { baseUrl } = await getApiConfig();
    const client = createProviderClient(newKey, baseUrl);
    let balanceCheck;
    try {
      balanceCheck = await client.getBalance();
    } catch (err) {
      await sendHtml(
        chatId,
        `⚠️ <b>Could not reach gateway to verify key</b>\n<code>${escapeHtml(err.message)}</code>`
      );
      return;
    }

    if (!balanceCheck.ok) {
      await sendHtml(
        chatId,
        `❌ <b>API Key Rejected</b>\n<code>${escapeHtml(balanceCheck.error || balanceCheck.raw)}</code>\n\nPlease double-check your API key and try again.`
      );
      return;
    }

    if (!access.hasOwner && userId) {
      await setOwner(userId, username);
    }
    await setSetting('provider_api_key', newKey);
    const wallet = await getWallet(userId);

    await sendHtml(
      chatId,
      [
        '✅ <b>Gateway API Key Verified & Saved!</b>',
        `💰 <b>Main Gateway Balance:</b> <code>$${escapeHtml(balanceCheck.balance)}</code>`,
        ...(access.hasOwner
          ? []
          : [`👑 <b>Platform Owner Set:</b> <code>${userId}</code> (${escapeHtml(username)})`]),
        '',
        '<i>Your secret key message was deleted from chat history for security.</i>',
      ].join('\n'),
      buildMainMenuKeyboard(true, wallet.balanceCents)
    );
    return;
  }

  // If no owner exists yet, guide user to run /setkey
  if (!access.hasOwner) {
    await sendHtml(chatId, getSetupNeededMessage(firstName));
    return;
  }

  // Enforce blocklist
  if (!access.authorized) {
    await sendHtml(chatId, t(lang, 'restricted_msg'));
    return;
  }

  // Handle plain text messages (amount entry, TxID verification, or search)
  if (!isCommand) {
    const uiState = userId ? await getUserState(userId) : null;

    // Step 1 of Top-Up: user entered desired USD amount
    if (uiState && uiState.mode === 'await_topup_amount') {
      const cleaned = rawText.replace(/[$,\s]/g, '');
      const amountUsd = Number(cleaned);
      const amountCents = usdToCents(amountUsd);
      if (!Number.isFinite(amountUsd) || amountCents < 100 || amountCents > 1000000) {
        await sendHtml(
          chatId,
          lang === 'fa'
            ? '⚠️ لطفاً یک مبلغ معتبر بین <code>$1.00</code> تا <code>$10,000.00</code> وارد کنید (مثلاً <code>10</code> یا <code>15.50</code>).'
            : '⚠️ Please enter a valid amount between <code>$1.00</code> and <code>$10,000.00</code> (e.g. <code>10</code> or <code>15.50</code>).'
        );
        return;
      }
      await clearUserState(userId);
      const starsPerUsd = await getStarsPerUsd();
      await sendHtml(
        chatId,
        [
          lang === 'fa' ? '➕ <b>انتخاب روش پرداخت</b>' : '➕ <b>Choose Payment Method</b>',
          '',
          `💰 <b>${lang === 'fa' ? 'مبلغ شارژ' : 'Top-Up Amount'}:</b> <code>${escapeHtml(centsToUsdString(amountCents))}</code>`,
          '',
          lang === 'fa'
            ? 'روش پرداخت مورد نظر خود را برای دریافت جزئیات و آدرس انتخاب کنید:'
            : 'Select your preferred payment method to generate your payment order:',
        ].join('\n'),
        buildPaymentMethodsKeyboard({ amountCents, starsPerUsd, lang })
      );
      return;
    }

    // Step 3 of Payment: user pasted their TxID or Binance Pay Order ID
    if (uiState && uiState.mode === 'await_txid' && uiState.depositId) {
      const checkMsg = await sendHtml(
        chatId,
        lang === 'fa'
          ? '⏳ <b>در حال بررسی خودکار تراکنش شما…</b>'
          : '⏳ <b>Verifying your payment automatically…</b>'
      );

      const res = await processPaymentProof({
        depositId: uiState.depositId,
        userId,
        chatId,
        rawInput: rawText,
        username,
        lang,
      });

      if (res.status === 'approved') {
        const balStr = centsToUsdString(res.wallet.balanceCents);
        const creditStr = centsToUsdString(res.creditedCents);
        await sendHtml(
          chatId,
          [
            lang === 'fa'
              ? '✅ <b>پرداخت به صورت خودکار تایید شد!</b>'
              : '✅ <b>Payment Verified Automatically!</b>',
            '',
            `📄 <b>Order ID:</b> <code>#${res.deposit.id}</code>`,
            `💳 <b>Credited:</b> <code>+${escapeHtml(creditStr)}</code>`,
            `💰 <b>Wallet Balance:</b> <code>${escapeHtml(balStr)}</code>`,
          ].join('\n'),
          res.deposit.targetService
            ? undefined
            : buildMainMenuKeyboard(access.isOwner, res.wallet.balanceCents, lang)
        );
        if (res.deposit.targetService && res.deposit.targetCountry) {
          await fulfillPendingServiceIfAny({
            deposit: res.deposit,
            chatId,
            userId,
            lang,
          });
        }
        return;
      }

      if (res.status === 'retry') {
        await sendHtml(
          chatId,
          `⚠️ <b>${lang === 'fa' ? 'تایید نشد — دوباره تلاش کنید' : 'Not Verified Yet'}</b>\n\n${escapeHtml(res.reason)}`
        );
        return;
      }

      if (res.status === 'review') {
        await sendHtml(
          chatId,
          [
            lang === 'fa'
              ? '🟡 <b>تراکنش ثبت شد و به پشتیبانی ارسال گردید</b>'
              : '🟡 <b>Payment Submitted for Support Review</b>',
            '',
            `📄 <b>Order ID:</b> <code>#${res.deposit.id}</code>`,
            `ℹ️ ${escapeHtml(res.reason)}`,
          ].join('\n'),
          buildMainMenuKeyboard(access.isOwner, null, lang)
        );
        return;
      }

      await clearUserState(userId);
      await sendHtml(chatId, `⚠️ ${escapeHtml(res.reason || 'Could not process payment.')}`);
      return;
    }

    if (uiState && uiState.mode === 'deposit_crypto') {
      const amountMatch = rawText.match(/\$?\s*(\d+(?:\.\d{1,2})?)/);
      if (!amountMatch) {
        await sendHtml(
          chatId,
          '⚠️ Please include the <b>USD amount</b> and your <b>TX Hash / Binance Order ID</b>.\nExample: <code>10 TXID: 0xabc123...</code>'
        );
        return;
      }

      const amountUsd = Number(amountMatch[1]);
      const amountCents = usdToCents(amountUsd);
      if (amountCents < 100 || amountCents > 1000000) {
        await sendHtml(chatId, '⚠️ Deposit amount must be between <code>$1.00</code> and <code>$10,000.00</code>.');
        return;
      }

      await clearUserState(userId);
      const dep = await createDepositRequest({
        userId,
        chatId,
        amountCents,
        method: 'crypto',
        proofText: rawText,
      });

      const ownerId = await getOwnerId();
      if (ownerId && dep) {
        try {
          await sendHtml(
            ownerId,
            [
              '🟡 <b>New Binance / Crypto Deposit Request</b>',
              '',
              `🆔 <b>Request ID:</b> <code>#${dep.id}</code>`,
              `👤 <b>User:</b> ${escapeHtml(username)} (<code>${userId}</code>)`,
              `💵 <b>Amount:</b> <code>${escapeHtml(centsToUsdString(amountCents))}</code>`,
              `🧾 <b>Proof / TXID:</b> <code>${escapeHtml(rawText)}</code>`,
            ].join('\n'),
            buildDepositApprovalKeyboard(dep.id)
          );
        } catch (err) {
          console.warn('Could not notify owner of deposit:', err.message);
        }
      }

      await sendHtml(
        chatId,
        [
          '✅ <b>Deposit Request Submitted!</b>',
          '',
          `🆔 <b>Request ID:</b> <code>#${dep ? dep.id : 'pending'}</code>`,
          `💵 <b>Amount:</b> <code>${escapeHtml(centsToUsdString(amountCents))}</code>`,
          '',
          '<i>An administrator has been notified. Your wallet will be credited automatically once verified.</i>',
        ].join('\n'),
        buildMainMenuKeyboard(access.isOwner)
      );
      return;
    }

    if (uiState && uiState.mode === 'search_country_pick') {
      await clearUserState(userId);
      const matchedCountries = searchCountries(rawText, 16);
      if (matchedCountries.length === 0) {
        await sendHtml(
          chatId,
          `🔎 <b>No countries found for:</b> <code>${escapeHtml(rawText)}</code>`,
          buildCountrySelectionKeyboard(POPULAR_COUNTRIES, 0, 'popular')
        );
        return;
      }
      await sendHtml(
        chatId,
        `🌍 <b>Countries matching</b> <code>${escapeHtml(rawText)}</code>\nTap a country to see live services & prices:`,
        buildCountrySelectionKeyboard(matchedCountries, 0, 'search')
      );
      return;
    }

    if (uiState && uiState.mode === 'search_service_in_country' && uiState.countryId) {
      await clearUserState(userId);
      await runCountryServicesAction({
        chatId,
        countryId: uiState.countryId,
        page: 0,
        serviceQuery: rawText,
        lang,
      });
      return;
    }

    if (uiState && uiState.mode === 'search_country' && uiState.serviceCode) {
      await clearUserState(userId);
      await runServiceCountriesAction({
        chatId,
        serviceCode: uiState.serviceCode,
        page: 0,
        countryQuery: rawText,
      });
      return;
    }

    if (uiState && userId) {
      await clearUserState(userId);
    }

    const matches = searchServices(rawText, 16);
    if (matches.length === 0) {
      await sendHtml(
        chatId,
        `🔎 <b>No services found for:</b> <code>${escapeHtml(rawText)}</code>\n\nTry another keyword (e.g. <code>telegram</code>, <code>whatsapp</code>, <code>openai</code>) or browse all services below.`,
        buildServiceSelectionKeyboard(POPULAR_SERVICES, 0, 'popular')
      );
      return;
    }

    await sendHtml(
      chatId,
      `🔎 <b>Service Search Results for</b> <code>${escapeHtml(rawText)}</code>\nFound <b>${matches.length}</b> matching service(s). Tap one to view live country availability & prices:`,
      buildServiceSelectionKeyboard(matches, 0, 'search')
    );
    return;
  }

  // Clear any pending UI state when running a command
  if (userId) {
    await clearUserState(userId);
  }

  // ==========================================
  // Owner-Only Administration Commands
  // ==========================================

  if (command === '/stats') {
    if (!access.isOwner) {
      await sendHtml(chatId, '⛔ Only the platform owner can view profit statistics.');
      return;
    }
    const wallet = await getWallet(userId);
    await runPlatformStatsAction(chatId, null, lang, wallet.balanceCents);
    return;
  }

  if (command === '/users') {
    if (!access.isOwner) {
      await sendHtml(chatId, 'Owner only.');
      return;
    }
    const page = Math.max(0, (Number(args[0]) || 1) - 1);
    await runAdminUsersAction(chatId, page, null, lang);
    return;
  }

  if (command === '/addbalance') {
    if (!access.isOwner) {
      await sendHtml(chatId, '⛔ Only the platform owner can credit user wallets.');
      return;
    }
    const targetId = Number(args[0]);
    const amountUsd = Number(args[1]);
    if (!targetId || Number.isNaN(targetId) || !Number.isFinite(amountUsd) || amountUsd <= 0) {
      await sendHtml(chatId, '⚠️ <b>Usage:</b> <code>/addbalance &lt;user_id&gt; &lt;amount_usd&gt; [note]</code>');
      return;
    }
    const amountCents = usdToCents(amountUsd);
    const note = args.slice(2).join(' ') || 'Admin credit';
    const wallet = await creditWallet({
      userId: targetId,
      amountCents,
      type: 'admin_credit',
      note,
    });
    await sendHtml(
      chatId,
      `✅ Credited <code>+${escapeHtml(centsToUsdString(amountCents))}</code> to user <code>${targetId}</code>.\n💰 New balance: <code>${escapeHtml(centsToUsdString(wallet.balanceCents))}</code>`
    );
    if (targetId !== userId) {
      try {
        await sendHtml(
          targetId,
          `💳 <b>Wallet Credited!</b>\n\n➕ <b>Amount:</b> <code>+${escapeHtml(centsToUsdString(amountCents))}</code>\n📝 <b>Note:</b> ${escapeHtml(note)}\n💰 <b>New Balance:</b> <code>${escapeHtml(centsToUsdString(wallet.balanceCents))}</code>`
        );
      } catch {
        // User may not have started chat yet
      }
    }
    return;
  }

  if (command === '/deductbalance') {
    if (!access.isOwner) {
      await sendHtml(chatId, '⛔ Only the platform owner can debit user wallets.');
      return;
    }
    const targetId = Number(args[0]);
    const amountUsd = Number(args[1]);
    if (!targetId || Number.isNaN(targetId) || !Number.isFinite(amountUsd) || amountUsd <= 0) {
      await sendHtml(chatId, '⚠️ <b>Usage:</b> <code>/deductbalance &lt;user_id&gt; &lt;amount_usd&gt; [note]</code>');
      return;
    }
    const amountCents = usdToCents(amountUsd);
    const note = args.slice(2).join(' ') || 'Admin debit';
    const res = await debitWalletAtomic({
      userId: targetId,
      amountCents,
      type: 'admin_debit',
      note,
    });
    if (!res.ok) {
      await sendHtml(
        chatId,
        `⚠️ User <code>${targetId}</code> only has <code>${escapeHtml(centsToUsdString(res.wallet?.balanceCents || 0))}</code> (cannot deduct <code>${escapeHtml(centsToUsdString(amountCents))}</code>).`
      );
      return;
    }
    await sendHtml(
      chatId,
      `✅ Deducted <code>-${escapeHtml(centsToUsdString(amountCents))}</code> from user <code>${targetId}</code>.\n💰 New balance: <code>${escapeHtml(centsToUsdString(res.wallet.balanceCents))}</code>`
    );
    return;
  }

  if (command === '/setpay') {
    if (!access.isOwner) {
      await sendHtml(chatId, '⛔ Only the platform owner can configure payment addresses.');
      return;
    }
    const [method, ...rest] = args;
    const addr = rest.join(' ').trim();
    if (!method || !addr) {
      await sendHtml(
        chatId,
        [
          '⚠️ <b>Usage:</b> <code>/setpay &lt;method&gt; &lt;address_or_uid&gt;</code>',
          '',
          '<b>Supported methods:</b>',
          '• <code>/setpay binance 1188044071</code>',
          '• <code>/setpay bep20 0xYourBscWalletAddress</code> (sets both USDT & USDC BEP20)',
          '• <code>/setpay usdt_bep20 0x...</code>',
          '• <code>/setpay usdc_bep20 0x...</code>',
        ].join('\n')
      );
      return;
    }
    try {
      await setPaymentAddress(method, addr);
      await sendHtml(
        chatId,
        `✅ Saved <b>${escapeHtml(method.toUpperCase())}</b> address:\n<code>${escapeHtml(addr)}</code>`
      );
    } catch (err) {
      await sendHtml(chatId, `⚠️ ${escapeHtml(err.message)}`);
    }
    return;
  }

  if (command === '/setbinanceapi') {
    if (!access.isOwner) {
      await sendHtml(chatId, '⛔ Only the platform owner can set Binance API credentials.');
      return;
    }
    const [bKey, bSecret] = args;
    if (!bKey || !bSecret) {
      await sendHtml(
        chatId,
        '⚠️ <b>Usage:</b> <code>/setbinanceapi &lt;api_key&gt; &lt;api_secret&gt;</code>\n<i>Enables automatic verification of Binance Pay Order IDs. Your message is deleted immediately.</i>'
      );
      return;
    }
    try {
      await api.deleteMessage({ chat_id: chatId, message_id: message.message_id });
    } catch {}
    await setBinanceApiCredentials(bKey, bSecret);
    await sendHtml(
      chatId,
      '✅ <b>Binance Pay API credentials saved!</b>\nBinance Pay Order IDs will now be verified automatically.'
    );
    return;
  }

  if (command === '/synccommands') {
    if (!access.isOwner) {
      await sendHtml(chatId, '⛔ Owner only.');
      return;
    }
    const res = await syncBotCommands();
    await sendHtml(
      chatId,
      `✅ <b>Bot Menu & Command Center Synced!</b>\n• Menu Button: <code>Commands</code>\n• Commands: <code>${res.userCommandCount}</code> (localized in EN, FA, AR, RU, TR)${res.ownerSynced ? '\n• Owner admin commands added to your private menu.' : ''}`
    );
    return;
  }

  if (command === '/payconfig') {
    if (!access.isOwner) {
      await sendHtml(chatId, '⛔ Owner only.');
      return;
    }
    const a = await getPaymentAddresses();
    const rate = await getStarsPerUsd();
    await sendHtml(
      chatId,
      [
        '⚙️ <b>Payment Configuration</b>',
        '',
        `⭐ <b>Telegram Stars (XTR):</b> <code>${rate} Stars = $1.00</code> (Auto-Verified)`,
        `🟡 <b>Binance Pay UID:</b> ${a.binance ? `<code>${escapeHtml(a.binance)}</code>` : '<i>Not set</i>'} ${a.binanceApiKey ? '(Auto-Verify ON)' : '(Admin Review)'}`,
        `🟢 <b>USDT (BEP20):</b> ${a.usdt_bep20 ? `<code>${escapeHtml(a.usdt_bep20)}</code>` : '<i>Not set</i>'} (Auto-Verify ON)`,
        `🔵 <b>USDC (BEP20):</b> ${a.usdc_bep20 ? `<code>${escapeHtml(a.usdc_bep20)}</code>` : '<i>Not set</i>'} (Auto-Verify ON)`,
      ].join('\n')
    );
    return;
  }

  // Official Telegram Stars Refund (required for Telegram Bot Payments compliance)
  if (command === '/refundstar') {
    if (!access.isOwner) {
      await sendHtml(chatId, '⛔ Only the platform owner can issue Telegram Stars refunds.');
      return;
    }
    const targetUserId = Number(args[0]);
    const chargeId = args[1]?.trim();
    if (!targetUserId || Number.isNaN(targetUserId) || !chargeId) {
      await sendHtml(
        chatId,
        '⚠️ <b>Usage:</b> <code>/refundstar &lt;user_id&gt; &lt;telegram_payment_charge_id&gt;</code>'
      );
      return;
    }
    try {
      await api.refundStarPayment({
        user_id: targetUserId,
        telegram_payment_charge_id: chargeId,
      });
      await sendHtml(
        chatId,
        `✅ <b>Telegram Stars Refund Issued!</b>\n👤 User: <code>${targetUserId}</code>\n🧾 Charge ID: <code>${escapeHtml(chargeId)}</code>`
      );
    } catch (err) {
      await sendHtml(chatId, `❌ <b>Refund Failed:</b> <code>${escapeHtml(err.message)}</code>`);
    }
    return;
  }

  if (command === '/setpayinfo') {
    if (!access.isOwner) {
      await sendHtml(chatId, '⛔ Only the platform owner can configure payment details.');
      return;
    }
    const info = rawText.replace(/^\/setpayinfo(?:@\S+)?\s*/i, '').trim();
    if (!info) {
      const current = await getPayInfo();
      await sendHtml(
        chatId,
        [
          '🟡 <b>Current Binance Pay / Crypto Deposit Info:</b>',
          current ? escapeHtml(current) : '<i>Not configured yet.</i>',
          '',
          'To update, send:\n<code>/setpayinfo Binance Pay ID: 123456789 | USDT (TRC20): T...</code>',
        ].join('\n')
      );
      return;
    }
    await setPayInfo(info);
    await sendHtml(
      chatId,
      `✅ <b>Binance Pay / Crypto deposit details updated!</b>\n\n${escapeHtml(info)}`
    );
    return;
  }

  if (command === '/setstarsrate') {
    if (!access.isOwner) {
      await sendHtml(chatId, '⛔ Only the platform owner can change the Stars rate.');
      return;
    }
    if (!args[0]) {
      const current = await getStarsPerUsd();
      await sendHtml(
        chatId,
        `⭐ <b>Current Stars Rate:</b> <code>${current} Stars = $1.00 USD</code>\n\nTo change, send <code>/setstarsrate &lt;stars_per_usd&gt;</code>.`
      );
      return;
    }
    const rate = Number(args[0]);
    if (!Number.isFinite(rate) || rate < 1 || rate > 10000) {
      await sendHtml(chatId, '⚠️ Please enter a valid number of Stars per $1 USD (e.g. <code>50</code>).');
      return;
    }
    await setStarsPerUsd(rate);
    await sendHtml(chatId, `✅ <b>Telegram Stars rate updated:</b> <code>${Math.round(rate)} ⭐ = $1.00 USD</code>`);
    return;
  }

  if (command === '/setmarkup') {
    if (!access.isOwner) {
      await sendHtml(chatId, '⛔ Only the platform owner can change the price markup.');
      return;
    }
    if (!args[0]) {
      const current = await getMarkupPercent();
      await sendHtml(
        chatId,
        `📈 <b>Current Reseller Commission:</b> <code>+${current}%</code>\n\nTo change it, send <code>/setmarkup &lt;percent&gt;</code> (e.g. <code>/setmarkup 20</code>).`
      );
      return;
    }
    const pct = Number(args[0]);
    if (!Number.isFinite(pct) || pct < 0 || pct > 500) {
      await sendHtml(chatId, '⚠️ Please enter a valid percentage between <code>0</code> and <code>500</code>.');
      return;
    }
    await setMarkupPercent(pct);
    await sendHtml(
      chatId,
      `<b>Commission updated to +${pct}%</b>`,
      buildMainMenuKeyboard(true, null, lang)
    );
    return;
  }

  if (command === '/setrefpoints') {
    if (!access.isOwner) {
      await sendHtml(chatId, 'Owner only.');
      return;
    }
    if (!args[0]) {
      const current = await getReferralRewardPoints();
      await sendHtml(
        chatId,
        `<b>Referral Reward:</b> <code>${current} pts</code> per invite\n\nUsage: <code>/setrefpoints &lt;points&gt;</code>`
      );
      return;
    }
    const pts = Math.round(Number(args[0]));
    if (!Number.isFinite(pts) || pts < 0 || pts > 100000) {
      await sendHtml(chatId, 'Enter a valid number of points (e.g. <code>10</code>).');
      return;
    }
    await setReferralRewardPoints(pts);
    await sendHtml(chatId, `<b>Referral reward updated:</b> <code>+${pts} pts</code> per new friend.`);
    return;
  }

  if (command === '/setrefbonus') {
    if (!access.isOwner) {
      await sendHtml(chatId, 'Owner only.');
      return;
    }
    if (!args[0]) {
      const current = await getReferralWelcomePoints();
      await sendHtml(
        chatId,
        `<b>Invited Friend Welcome Bonus:</b> <code>${current} pts</code>\n\nUsage: <code>/setrefbonus &lt;points&gt;</code>`
      );
      return;
    }
    const pts = Math.round(Number(args[0]));
    if (!Number.isFinite(pts) || pts < 0 || pts > 100000) {
      await sendHtml(chatId, 'Enter a valid number of points (e.g. <code>5</code> or <code>0</code>).');
      return;
    }
    await setReferralWelcomePoints(pts);
    await sendHtml(chatId, `<b>Friend welcome bonus updated:</b> <code>+${pts} pts</code>.`);
    return;
  }

  if (command === '/setpointsrate') {
    if (!access.isOwner) {
      await sendHtml(chatId, 'Owner only.');
      return;
    }
    if (!args[0]) {
      const current = await getPointsPerUsd();
      await sendHtml(
        chatId,
        `<b>Dynamic Points Rate:</b> <code>${current} pts = $1.00</code>\n\nUsage: <code>/setpointsrate &lt;points_per_usd&gt;</code>`
      );
      return;
    }
    const rate = Math.round(Number(args[0]));
    if (!Number.isFinite(rate) || rate < 1 || rate > 100000) {
      await sendHtml(chatId, 'Enter a valid rate (e.g. <code>100</code> for 100 pts = $1.00).');
      return;
    }
    await setPointsPerUsd(rate);
    await sendHtml(chatId, `<b>Points rate updated:</b> <code>${rate} pts = $1.00</code>.`);
    return;
  }

  if (command === '/setservicepoints') {
    if (!access.isOwner) {
      await sendHtml(chatId, 'Owner only.');
      return;
    }
    const svcCode = String(args[0] || '').trim().toLowerCase();
    const rawVal = String(args[1] || '').trim().toLowerCase();
    if (!svcCode || !rawVal) {
      await sendHtml(
        chatId,
        '<b>Usage:</b>\n<code>/setservicepoints &lt;service_code&gt; &lt;points&gt;</code>\n<code>/setservicepoints &lt;service_code&gt; clear</code>\n\nExample: <code>/setservicepoints tg 120</code>'
      );
      return;
    }
    const known = findService(svcCode);
    const label = known ? `${known.name} (${known.code})` : svcCode;
    if (rawVal === 'clear' || rawVal === 'reset' || rawVal === '0') {
      await clearServicePointsOverride(svcCode);
      await sendHtml(chatId, `<b>Custom points cleared</b> for <b>${escapeHtml(label)}</b>. Using dynamic USD rate.`);
      return;
    }
    const pts = Math.round(Number(rawVal));
    if (!Number.isFinite(pts) || pts <= 0 || pts > 1000000) {
      await sendHtml(chatId, 'Enter a positive number of points (or <code>clear</code>).');
      return;
    }
    await setServicePointsOverride(svcCode, pts);
    await sendHtml(chatId, `<b>Service points set:</b> <b>${escapeHtml(label)}</b> = <code>${pts} pts</code>.`);
    return;
  }

  if (command === '/servicepoints') {
    if (!access.isOwner) {
      await sendHtml(chatId, 'Owner only.');
      return;
    }
    const [rate, reward, welcome, overrides] = await Promise.all([
      getPointsPerUsd(),
      getReferralRewardPoints(),
      getReferralWelcomePoints(),
      listServicePointsOverrides(),
    ]);
    const entries = Object.entries(overrides);
    const overrideLines = entries.length
      ? entries.map(([code, pts]) => {
          const s = findService(code);
          return `• <b>${escapeHtml(s ? s.name : code)}</b> (<code>${escapeHtml(code)}</code>): <code>${pts} pts</code>`;
        })
      : ['<i>No custom service overrides set (all services use dynamic rate).</i>'];
    await sendHtml(
      chatId,
      [
        '<b>Points &amp; Referral Config</b>',
        '',
        '<blockquote>' +
          [
            `Referral Reward: <code>+${reward} pts</code>`,
            `Friend Bonus: <code>+${welcome} pts</code>`,
            `Dynamic Rate: <code>${rate} pts = $1.00</code>`,
          ].join('\n') +
          '</blockquote>',
        '',
        '<b>Custom Service Overrides</b>',
        ...overrideLines,
      ].join('\n')
    );
    return;
  }

  if (command === '/addpoints' || command === '/deductpoints') {
    if (!access.isOwner) {
      await sendHtml(chatId, 'Owner only.');
      return;
    }
    const targetId = Number(args[0]);
    const pts = Math.round(Number(args[1]));
    const note = args.slice(2).join(' ').trim() || (command === '/addpoints' ? 'Admin points credit' : 'Admin points debit');
    if (!targetId || !Number.isFinite(pts) || pts <= 0) {
      await sendHtml(chatId, `<b>Usage:</b> <code>${command} &lt;user_id&gt; &lt;points&gt; [note]</code>`);
      return;
    }
    if (command === '/addpoints') {
      const w = await creditPoints({
        userId: targetId,
        amountPoints: pts,
        type: 'admin_credit',
        note,
      });
      await sendHtml(
        chatId,
        `<b>Points Credited</b>\nUser: <code>${targetId}</code>\nAdded: <code>+${pts} pts</code>\nNew Balance: <code>${Number(w?.pointsBalance || 0)} pts</code>`
      );
    } else {
      const res = await debitPointsAtomic({
        userId: targetId,
        amountPoints: pts,
        type: 'admin_debit',
        note,
      });
      if (!res.ok) {
        await sendHtml(
          chatId,
          `Insufficient points. User <code>${targetId}</code> only has <code>${Number(res.wallet?.pointsBalance || 0)} pts</code>.`
        );
        return;
      }
      await sendHtml(
        chatId,
        `<b>Points Deducted</b>\nUser: <code>${targetId}</code>\nDeducted: <code>-${pts} pts</code>\nNew Balance: <code>${Number(res.wallet?.pointsBalance || 0)} pts</code>`
      );
    }
    return;
  }

  if (command === '/block') {
    if (!access.isOwner) {
      await sendHtml(chatId, '⛔ Only the platform owner can block users.');
      return;
    }
    const targetId = Number(args[0]);
    if (!targetId || Number.isNaN(targetId)) {
      await sendHtml(chatId, '⚠️ <b>Usage:</b> <code>/block &lt;telegram_user_id&gt; [reason]</code>');
      return;
    }
    if (targetId === userId) {
      await sendHtml(chatId, '⚠️ You cannot block yourself as the platform owner.');
      return;
    }
    const reason = args.slice(1).join(' ') || 'Blocked by owner';
    await blockUser(targetId, reason);
    await sendHtml(
      chatId,
      `🚫 Blocked user <code>${targetId}</code> (<b>${escapeHtml(reason)}</b>).`
    );
    return;
  }

  if (command === '/unblock') {
    if (!access.isOwner) {
      await sendHtml(chatId, '⛔ Only the platform owner can unblock users.');
      return;
    }
    const targetId = Number(args[0]);
    if (!targetId || Number.isNaN(targetId)) {
      await sendHtml(chatId, '⚠️ <b>Usage:</b> <code>/unblock &lt;telegram_user_id&gt;</code>');
      return;
    }
    await unblockUser(targetId);
    await sendHtml(chatId, `✅ Unblocked user <code>${targetId}</code>.`);
    return;
  }

  if (command === '/blocked') {
    if (!access.isOwner) {
      await sendHtml(chatId, '⛔ Only the platform owner can view blocked users.');
      return;
    }
    const users = await listBlockedUsers();
    if (users.length === 0) {
      await sendHtml(chatId, '✅ No users are currently blocked.', buildMainMenuKeyboard(true));
      return;
    }
    const lines = users.map(
      (u) => `• <code>${u.tgId}</code> — <b>${escapeHtml(u.label || 'Blocked')}</b>`
    );
    await sendHtml(
      chatId,
      ['🚫 <b>Blocked Users</b>', '', ...lines].join('\n'),
      buildMainMenuKeyboard(true)
    );
    return;
  }

  // ==========================================
  // Core User Commands
  // ==========================================

  if (command === '/start') {
    // Check for referral deep link payload: /start ref_<referrerUserId>
    let refResult = null;
    const startPayload = String(args[0] || '').trim();
    const refMatch = startPayload.match(/^ref_(\d+)$/i);
    if (refMatch && userId) {
      const referrerId = Number(refMatch[1]);
      refResult = await processReferralJoin({
        referredUserId: userId,
        referrerUserId: referrerId,
      });
      if (refResult.awarded && refResult.pointsAwarded > 0) {
        try {
          const refLang = await getUserLang(referrerId);
          await sendHtml(
            referrerId,
            t(refLang, 'ref_notify_referrer', {
              pts: refResult.pointsAwarded.toLocaleString(),
              bal: Number(refResult.referrerBalance || 0).toLocaleString(),
            })
          );
        } catch {
          // Ignore if referrer blocked the bot
        }
      }
    }

    const hasLang = await hasUserSelectedLang(userId);
    if (!hasLang) {
      const bonusLine =
        refResult?.awarded && refResult.welcomeBonusPoints > 0
          ? `\n\n${t(lang, 'ref_welcome_bonus', { pts: refResult.welcomeBonusPoints.toLocaleString() })}`
          : '';
      await sendHtml(
        chatId,
        getFirstStartLanguageMessage(firstName) + bonusLine,
        buildLanguageKeyboard(lang, false)
      );
      return;
    }
    const { apiKey } = await getApiConfig();
    const wallet = await getWallet(userId);
    await sendHtml(
      chatId,
      getWelcomeMessage(firstName, Boolean(apiKey), wallet.balanceCents, lang, wallet.pointsBalance),
      buildMainMenuKeyboard(access.isOwner, wallet.balanceCents, lang)
    );
    return;
  }

  if (command === '/referral' || command === '/invite' || command === '/points') {
    await runReferralAction(chatId, userId, null, lang);
    return;
  }

  if (command === '/lang' || command === '/language') {
    if (args[0]) {
      const saved = await setUserLang(userId, args[0]);
      const wallet = await getWallet(userId);
      const { apiKey } = await getApiConfig();
      await sendHtml(
        chatId,
        getWelcomeMessage(firstName, Boolean(apiKey), wallet.balanceCents, saved, wallet.pointsBalance),
        buildMainMenuKeyboard(access.isOwner, wallet.balanceCents, saved)
      );
      return;
    }
    await sendHtml(chatId, t(lang, 'lang_title'), buildLanguageKeyboard(lang));
    return;
  }

  if (command === '/wallet' || command === '/history') {
    await runWalletAction(chatId, userId, null, lang);
    return;
  }

  if (command === '/topup') {
    if (userId) {
      await setUserState(userId, { mode: 'await_topup_amount' });
    }
    await sendHtml(
      chatId,
      lang === 'fa'
        ? '➕ <b>شارژ کیف پول</b>\n\nمبلغ دلاری (USD) که می‌خواهید به حساب خود اضافه کنید را انتخاب کنید یا به صورت عددی تایپ نمایید (مثلاً <code>10</code> یا <code>25.50</code>):'
        : '➕ <b>Top Up Your Wallet</b>\n\nChoose an amount below or type any custom USD amount you want to add (e.g. <code>10</code> or <code>25.50</code>):',
      buildTopUpAmountKeyboard(lang)
    );
    return;
  }

  // Mandatory /paysupport & /terms commands for Telegram Stars Bot Payments compliance
  if (command === '/paysupport') {
    const ownerId = await getOwnerId();
    await sendHtml(
      chatId,
      lang === 'fa'
        ? [
            '🛟 <b>پشتیبانی پرداخت‌های یک‌تپ (YekTap)</b>',
            '',
            '• پرداخت‌های <b>استارز تلگرام (Telegram Stars)</b> به صورت آنی به کیف پول شما اضافه می‌شوند.',
            '• اگر پس از فعال‌سازی شماره مجازی، کد پیامک دریافت نشد، می‌توانید سفارش را لغو کنید تا مبلغ به صورت خودکار به کیف پول شما بازگردد.',
            '• برای پیگیری مشکلات پرداخت یا درخواست بازگشت وجه استارز، شناسه کاربری (<code>/id</code>) و شماره تراکنش خود را برای مدیر ارسال کنید.',
            ...(ownerId ? [`👤 <b>شناسه پشتیبانی:</b> <code>${ownerId}</code>`] : []),
          ].join('\n')
        : [
            '🛟 <b>YekTap Payment Support</b>',
            '',
            '• <b>Telegram Stars (XTR)</b> payments are credited to your YekTap wallet instantly.',
            '• If a virtual number does not receive an SMS code, cancelling the activation automatically refunds your wallet balance.',
            '• For any payment issue or Star refund request, please contact the platform administrator with your User ID (<code>/id</code>) and payment charge ID.',
            ...(ownerId ? [`👤 <b>Support Admin ID:</b> <code>${ownerId}</code>`] : []),
          ].join('\n'),
      buildMainMenuKeyboard(access.isOwner, null, lang)
    );
    return;
  }

  if (command === '/terms') {
    await sendHtml(
      chatId,
      lang === 'fa'
        ? [
            '📜 <b>قوانین و شرایط استفاده از یک‌تپ (YekTap)</b>',
            '',
            '۱. شماره‌های مجازی صرفاً برای دریافت کد تایید یک‌بارمصرف (SMS/OTP) و استفاده‌های قانونی ارائه می‌شوند.',
            '۲. پرداخت‌های درون‌برنامه‌ای از طریق <b>Telegram Stars (XTR)</b> مطابق قوانین پرداخت ربات‌های تلگرام پردازش می‌شوند.',
            '۳. در صورت عدم دریافت پیامک روی شماره فعال‌شده، با زدن دکمه لغو، وجه به کیف پول شما بازگردانده می‌شود.',
            '۴. برای راهنمایی یا پیگیری پرداخت‌ها از دستور /paysupport استفاده کنید.',
          ].join('\n')
        : [
            '📜 <b>YekTap Terms of Service</b>',
            '',
            '1. Virtual numbers are provided solely for lawful one-time SMS/OTP verification.',
            '2. Digital purchases inside Telegram are processed via <b>Telegram Stars (XTR)</b> in compliance with Telegram Bot Payments Terms.',
            '3. Unused activations that receive no SMS are automatically refunded to your YekTap wallet upon cancellation.',
            '4. For payment assistance or refund inquiries, use /paysupport.',
          ].join('\n'),
      buildMainMenuKeyboard(access.isOwner, null, lang)
    );
    return;
  }

  if (command === '/help') {
    const wallet = await getWallet(userId);
    await sendHtml(
      chatId,
      getHelpMessage(access.isOwner, lang),
      buildMainMenuKeyboard(access.isOwner, wallet.balanceCents, lang)
    );
    return;
  }

  if (command === '/balance') {
    if (!access.isOwner) {
      await runWalletAction(chatId, userId, null, lang);
      return;
    }
    const wallet = await getWallet(userId);
    await runBalanceAction(chatId, null, lang, wallet.balanceCents);
    return;
  }

  if (command === '/orders') {
    await runOrdersListAction(chatId, userId, null, lang);
    return;
  }

  if (command === '/search' || command === '/s') {
    const query = args.join(' ').trim();
    if (!query) {
      await sendHtml(
        chatId,
        '🔎 <b>Search Services & Countries</b>\nSend <code>/search &lt;name&gt;</code> (e.g. <code>/search telegram</code>, <code>/search uber</code>, <code>/search usa</code>), or simply type any service name directly!'
      );
      return;
    }

    const matchedServices = searchServices(query, 12);
    const matchedCountries = searchCountries(query, 8);

    if (matchedServices.length === 0 && matchedCountries.length === 0) {
      await sendHtml(
        chatId,
        `No services or countries matched <code>${escapeHtml(query)}</code>.`,
        buildMainMenuKeyboard(access.isOwner, null, lang)
      );
      return;
    }

    const lines = [`🔎 <b>Search Results for</b> <code>${escapeHtml(query)}</code>`];
    if (matchedCountries.length > 0) {
      lines.push(
        '',
        '<b>Matching Countries:</b>',
        ...matchedCountries.map(
          (c) => `• ${c.flag} <b>${escapeHtml(c.name)}</b> — ID: <code>${escapeHtml(c.id)}</code>`
        )
      );
    }
    if (matchedServices.length > 0) {
      lines.push('', '<b>Matching Services</b> (tap one to see live prices & stock):');
    }

    await sendHtml(
      chatId,
      lines.join('\n'),
      matchedServices.length > 0
        ? buildServiceSelectionKeyboard(matchedServices, 0, 'search', lang)
        : buildMainMenuKeyboard(access.isOwner, null, lang)
    );
    return;
  }

  if (command === '/services') {
    const query = args.join(' ').trim();
    if (query) {
      const matches = searchServices(query, 16);
      await sendHtml(
        chatId,
        `🔎 <b>Services matching</b> <code>${escapeHtml(query)}</code> (${matches.length} shown):`,
        buildServiceSelectionKeyboard(matches, 0, 'search')
      );
      return;
    }
    await sendHtml(
      chatId,
      `📚 <b>All Services (${ALL_SERVICES.length.toLocaleString()})</b>\nBrowse below or send <code>/search &lt;name&gt;</code> to filter:`,
      buildServiceSelectionKeyboard(ALL_SERVICES, 0, 'all')
    );
    return;
  }

  if (command === '/countries') {
    const query = args.join(' ').trim();
    const matches = query ? searchCountries(query, 25) : ALL_COUNTRIES.slice(0, 25);
    const lines = [
      query
        ? `🌍 <b>Countries matching</b> <code>${escapeHtml(query)}</code> (${matches.length})`
        : `🌍 <b>Supported Countries (${ALL_COUNTRIES.length} total, showing first 25)</b>`,
      '',
      ...matches.map(
        (c) => `${c.flag} <b>${escapeHtml(c.name)}</b> — ID: <code>${escapeHtml(c.id)}</code>`
      ),
      '',
      '<i>Use <code>/countries &lt;name&gt;</code> to filter, or select a service via /buy to see live prices per country.</i>',
    ];
    await sendHtml(chatId, lines.join('\n'), buildMainMenuKeyboard(access.isOwner));
    return;
  }

  if (command === '/prices' || command === '/price') {
    if (!args[0]) {
      await sendHtml(
        chatId,
        '💵 <b>Live Prices & Stock</b>\nUsage: <code>/prices &lt;service_code&gt; [country_id]</code>\nExamples: <code>/prices tg</code> or <code>/prices wa 187</code>'
      );
      return;
    }
    await runPricesAction(chatId, args[0], args[1] || null);
    return;
  }

  if (command === '/buy') {
    if (args.length === 0) {
      await sendHtml(
        chatId,
        t(lang, 'step1_country'),
        buildCountrySelectionKeyboard(POPULAR_COUNTRIES, 0, 'popular', lang)
      );
      return;
    }
    if (args.length === 1) {
      if (/^\d+$/.test(args[0])) {
        await runCountryServicesAction({ chatId, countryId: args[0], page: 0, lang });
      } else {
        await runServiceCountriesAction({ chatId, serviceCode: args[0], page: 0 });
      }
      return;
    }
    const [serviceCode, countryId, maxPrice] = args;
    await runBuyNumberAction({ chatId, userId, serviceCode, countryId, maxPrice, lang });
    return;
  }

  if (command === '/status') {
    if (!args[0]) {
      await sendHtml(chatId, '⚠️ <b>Usage:</b> <code>/status &lt;activation_id&gt;</code>');
      return;
    }
    await runCheckStatusAction(chatId, userId, args[0], null, lang, access.isOwner);
    return;
  }

  if (command === '/cancel') {
    if (!args[0]) {
      await sendHtml(chatId, '⚠️ <b>Usage:</b> <code>/cancel &lt;activation_id&gt;</code>');
      return;
    }
    await runSetStatusAction(chatId, userId, args[0], ActivationSetStatus.CANCEL, null, lang, access.isOwner);
    return;
  }

  if (command === '/finish') {
    if (!args[0]) {
      await sendHtml(chatId, '⚠️ <b>Usage:</b> <code>/finish &lt;activation_id&gt;</code>');
      return;
    }
    await runSetStatusAction(chatId, userId, args[0], ActivationSetStatus.COMPLETE, null, lang, access.isOwner);
    return;
  }

  if (command === '/next') {
    if (!args[0]) {
      await sendHtml(chatId, '⚠️ <b>Usage:</b> <code>/next &lt;activation_id&gt;</code>');
      return;
    }
    await runSetStatusAction(chatId, userId, args[0], ActivationSetStatus.REQUEST_MORE_SMS, null, lang, access.isOwner);
    return;
  }

  await sendHtml(
    chatId,
    t(lang, 'unrecognized_msg'),
    buildMainMenuKeyboard(access.isOwner, null, lang)
  );
}
