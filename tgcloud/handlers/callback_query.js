import {
  usdToCents,
  centsToUsdString,
  checkAccess,
  getApiConfig,
  getMarkupPercent,
  getStarsPerUsd,
  getUserLang,
  setUserLang,
  getWallet,
  creditWallet,
  getDepositRequest,
  resolveDepositRequest,
  setUserState,
  clearUserState,
} from '../lib/store.js';
import { createProviderClient, applyMarkup } from '../lib/provider.js';
import {
  buildTopUpAmountKeyboard,
  buildPaymentMethodsKeyboard,
  createPaymentOrderAndSend,
  runServiceCheckoutAction,
  fulfillPendingServiceIfAny,
} from '../lib/payments.js';
import {
  ALL_SERVICES,
  ALL_COUNTRIES,
  POPULAR_SERVICES,
  POPULAR_COUNTRIES,
  findServiceName,
  findCountryName,
} from '../lib/catalog.js';
import {
  escapeHtml,
  sendHtml,
  editHtml,
  safeAnswerCallback,
  buildLanguageKeyboard,
  buildMainMenuKeyboard,
  buildCountrySelectionKeyboard,
  buildServiceSelectionKeyboard,
  getWelcomeMessage,
  getHelpMessage,
} from '../lib/ui.js';
import { t, getLanguageInfo } from '../lib/i18n.js';
import {
  runWalletAction,
  runReferralAction,
  runTopUpMenuAction,
  runStarsMenuAction,
  runSendStarsInvoiceAction,
  runCryptoDepositPromptAction,
  runPlatformStatsAction,
  runAdminUsersAction,
  runBalanceAction,
  runCountryServicesAction,
  runServiceCountriesAction,
  runBuyNumberAction,
  runCheckStatusAction,
  runSetStatusAction,
  runOrdersListAction,
} from '../lib/actions.js';

export default async function (cb) {
  if (!cb) return;

  const userId = cb.from?.id;
  const firstName = cb.from?.first_name || '';
  const chatId = cb.message?.chat?.id;
  const messageId = cb.message?.message_id;
  const data = cb.data || '';

  const access = await checkAccess(userId);
  const lang = await getUserLang(userId, cb.from?.language_code);

  if (!access.authorized) {
    await safeAnswerCallback(cb.id, '⛔ Restricted', true);
    return;
  }

  if (!chatId || !messageId || data === 'noop') {
    await safeAnswerCallback(cb.id);
    return;
  }

  if (data === 'menu:lang') {
    await safeAnswerCallback(cb.id);
    await editHtml(chatId, messageId, t(lang, 'lang_title'), buildLanguageKeyboard(lang));
    return;
  }

  if (data.startsWith('setlang:')) {
    const newCode = data.slice('setlang:'.length);
    const saved = await setUserLang(userId, newCode);
    const info = getLanguageInfo(saved);
    await safeAnswerCallback(cb.id, `${info.flag} ${info.native}`);
    const { apiKey } = await getApiConfig();
    const wallet = await getWallet(userId);
    await editHtml(
      chatId,
      messageId,
      getWelcomeMessage(firstName, Boolean(apiKey), wallet.balanceCents, saved, wallet.pointsBalance),
      buildMainMenuKeyboard(access.isOwner, wallet.balanceCents, saved)
    );
    return;
  }

  if (data === 'menu:main') {
    if (userId) await clearUserState(userId);
    await safeAnswerCallback(cb.id);
    const { apiKey } = await getApiConfig();
    const wallet = await getWallet(userId);
    await editHtml(
      chatId,
      messageId,
      getWelcomeMessage(firstName, Boolean(apiKey), wallet.balanceCents, lang, wallet.pointsBalance),
      buildMainMenuKeyboard(access.isOwner, wallet.balanceCents, lang)
    );
    return;
  }

  if (data === 'menu:referral') {
    if (userId) await clearUserState(userId);
    await safeAnswerCallback(cb.id);
    await runReferralAction(chatId, userId, messageId, lang);
    return;
  }

  if (data === 'menu:wallet') {
    if (userId) await clearUserState(userId);
    await safeAnswerCallback(cb.id);
    await runWalletAction(chatId, userId, messageId, lang);
    return;
  }

  if (data === 'menu:topup') {
    if (userId) {
      await setUserState(userId, { mode: 'await_topup_amount' });
    }
    await safeAnswerCallback(cb.id);
    await editHtml(
      chatId,
      messageId,
      lang === 'fa'
        ? '<b>شارژ کیف پول</b>\n\nمبلغ دلاری مورد نظر را انتخاب کنید یا تایپ نمایید (مثلاً <code>10</code>):'
        : '<b>Top Up Wallet</b>\n\nChoose an amount below or type a custom USD amount (e.g. <code>10</code>):',
      buildTopUpAmountKeyboard(lang)
    );
    return;
  }

  if (data.startsWith('topamt:')) {
    const amountCents = Number(data.slice('topamt:'.length)) || 0;
    if (userId) await clearUserState(userId);
    await safeAnswerCallback(cb.id);
    if (amountCents < 100) return;
    const starsPerUsd = await getStarsPerUsd();
    await editHtml(
      chatId,
      messageId,
      [
        lang === 'fa' ? '<b>انتخاب روش پرداخت</b>' : '<b>Payment Method</b>',
        '',
        `${lang === 'fa' ? 'مبلغ' : 'Amount'}: <code>${escapeHtml(centsToUsdString(amountCents))}</code>`,
      ].join('\n'),
      buildPaymentMethodsKeyboard({ amountCents, starsPerUsd, lang })
    );
    return;
  }

  if (data.startsWith('paytop:')) {
    const [, method, centsStr] = data.split(':');
    const amountCents = Number(centsStr) || 0;
    await safeAnswerCallback(cb.id, 'Creating payment order…');
    if (amountCents < 100) return;

    if (method === 'stars') {
      await runSendStarsInvoiceAction(chatId, userId, amountCents / 100);
      return;
    }

    await createPaymentOrderAndSend({
      chatId,
      userId,
      amountCents,
      method,
      lang,
    });
    return;
  }

  // Service Checkout: check live price & wallet balance -> pay from wallet OR pay exact service price
  if (data.startsWith('chkout:')) {
    const [, serviceCode, countryId] = data.split(':');
    await safeAnswerCallback(cb.id, 'Checking live price…');
    const { apiKey, baseUrl } = await getApiConfig();
    if (!apiKey) {
      await editHtml(chatId, messageId, '⚠️ Platform gateway is not configured yet.');
      return;
    }
    const client = createProviderClient(apiKey, baseUrl);
    const markupPercent = await getMarkupPercent();
    const starsPerUsd = await getStarsPerUsd();
    const priceRes = await client.getPrices(serviceCode, countryId);
    const live = priceRes.ok ? priceRes.byCountry.get(String(countryId)) : null;

    if (!live || !Number.isFinite(live.basePrice)) {
      await editHtml(
        chatId,
        messageId,
        '⚠️ This service is currently out of stock for the selected country.',
        { inline_keyboard: [[{ text: '🌍 Back', callback_data: `pickctry:${countryId}` }]] }
      );
      return;
    }

    const retailPrice = applyMarkup(live.basePrice, markupPercent);
    const retailCents = Math.max(1, usdToCents(retailPrice));

    await runServiceCheckoutAction({
      chatId,
      userId,
      serviceCode,
      countryId,
      retailCents,
      phones: live.phones,
      starsPerUsd,
      editMessageId: messageId,
      lang,
    });
    return;
  }

  // Direct single-service payment (Stars, Binance Pay, USDT BEP20, USDC BEP20, USDT TON)
  if (data.startsWith('paysvc:')) {
    const [, method, serviceCode, countryId, centsStr] = data.split(':');
    const amountCents = Number(centsStr) || 0;
    await safeAnswerCallback(cb.id, 'Creating payment order…');
    if (amountCents <= 0) return;

    if (method === 'stars') {
      await runSendStarsInvoiceAction(chatId, userId, amountCents / 100, serviceCode, countryId);
      return;
    }

    await createPaymentOrderAndSend({
      chatId,
      userId,
      amountCents,
      method,
      targetService: serviceCode,
      targetCountry: countryId,
      lang,
    });
    return;
  }

  if (data.startsWith('canceldep:')) {
    const depId = Number(data.slice('canceldep:'.length)) || 0;
    if (userId) await clearUserState(userId);
    if (depId) await resolveDepositRequest(depId, 'expired');
    await safeAnswerCallback(cb.id, 'Payment order cancelled');
    await sendHtml(
      chatId,
      lang === 'fa' ? '❌ سفارش پرداخت لغو شد.' : '❌ Payment order cancelled.',
      buildMainMenuKeyboard(access.isOwner, null, lang)
    );
    return;
  }

  if (data === 'topup:stars_menu') {
    await safeAnswerCallback(cb.id);
    await runStarsMenuAction(chatId, messageId, lang);
    return;
  }

  if (data.startsWith('topup:stars:')) {
    const usd = Number(data.slice('topup:stars:'.length));
    await safeAnswerCallback(cb.id, 'Sending Telegram Stars invoice...');
    await runSendStarsInvoiceAction(chatId, userId, usd);
    return;
  }

  if (data === 'topup:crypto') {
    if (userId) {
      await setUserState(userId, { mode: 'deposit_crypto' });
    }
    await safeAnswerCallback(cb.id);
    await runCryptoDepositPromptAction(chatId, messageId, lang);
    return;
  }

  // Owner 1-tap approval / rejection for Binance & Crypto deposits
  if (data.startsWith('dep:approve:') || data.startsWith('dep:reject:')) {
    if (!access.isOwner) {
      await safeAnswerCallback(cb.id, '⛔ Owner only.', true);
      return;
    }
    const isApprove = data.startsWith('dep:approve:');
    const depId = Number(data.split(':')[2]);
    const dep = await getDepositRequest(depId);
    if (!dep) {
      await safeAnswerCallback(cb.id, 'Deposit request not found.', true);
      return;
    }
    const resolved = await resolveDepositRequest(depId, isApprove ? 'approved' : 'rejected');
    if (!resolved) {
      await safeAnswerCallback(cb.id, `Already ${dep.status}.`, true);
      return;
    }

    const userLang = await getUserLang(dep.userId);
    if (isApprove) {
      const updatedWallet = await creditWallet({
        userId: dep.userId,
        amountCents: dep.amountCents,
        type: 'deposit',
        referenceId: `dep:${dep.id}`,
        note: `Binance/Crypto Deposit #${dep.id}`,
      });
      await safeAnswerCallback(cb.id, 'Deposit approved & credited!');
      await editHtml(
        chatId,
        messageId,
        [
          `✅ <b>Deposit #${dep.id} Approved</b>`,
          `👤 <b>User:</b> <code>${dep.userId}</code>`,
          `💵 <b>Credited:</b> <code>+${escapeHtml(centsToUsdString(dep.amountCents))}</code>`,
          `💰 <b>User New Balance:</b> <code>${escapeHtml(centsToUsdString(updatedWallet.balanceCents))}</code>`,
        ].join('\n')
      );
      try {
        await sendHtml(
          dep.chatId,
          [
            '✅ <b>Deposit Approved!</b>',
            '',
            `🆔 <b>#${dep.id}</b>`,
            `💳 <code>+${escapeHtml(centsToUsdString(dep.amountCents))}</code>`,
            t(userLang, 'wallet_line', { bal: escapeHtml(centsToUsdString(updatedWallet.balanceCents)) }),
          ].join('\n'),
          dep.targetService
            ? undefined
            : buildMainMenuKeyboard(false, updatedWallet.balanceCents, userLang)
        );
        if (dep.targetService && dep.targetCountry) {
          await fulfillPendingServiceIfAny({
            deposit: dep,
            chatId: dep.chatId,
            userId: dep.userId,
            lang: userLang,
          });
        }
      } catch {
        // Ignore if user blocked bot
      }
    } else {
      await safeAnswerCallback(cb.id, 'Deposit rejected.');
      await editHtml(
        chatId,
        messageId,
        [
          `❌ <b>Deposit #${dep.id} Rejected</b>`,
          `👤 <b>User:</b> <code>${dep.userId}</code>`,
          `💵 <b>Amount:</b> <code>${escapeHtml(centsToUsdString(dep.amountCents))}</code>`,
        ].join('\n')
      );
      try {
        await sendHtml(
          dep.chatId,
          `❌ <b>Deposit #${dep.id} Rejected</b>\nAmount: <code>${escapeHtml(centsToUsdString(dep.amountCents))}</code>`
        );
      } catch {
        // Ignore
      }
    }
    return;
  }

  if (data === 'act:stats') {
    if (!access.isOwner) {
      await safeAnswerCallback(cb.id, 'Owner only.', true);
      return;
    }
    await safeAnswerCallback(cb.id);
    const wallet = await getWallet(userId);
    await runPlatformStatsAction(chatId, messageId, lang, wallet.balanceCents);
    return;
  }

  if (data.startsWith('act:users:')) {
    if (!access.isOwner) {
      await safeAnswerCallback(cb.id, 'Owner only.', true);
      return;
    }
    const page = Number(data.slice('act:users:'.length)) || 0;
    await safeAnswerCallback(cb.id);
    await runAdminUsersAction(chatId, page, messageId, lang);
    return;
  }

  if (data === 'menu:help') {
    await safeAnswerCallback(cb.id);
    const wallet = await getWallet(userId);
    await editHtml(
      chatId,
      messageId,
      getHelpMessage(access.isOwner, lang),
      buildMainMenuKeyboard(access.isOwner, wallet.balanceCents, lang)
    );
    return;
  }

  if (data === 'menu:smart') {
    if (userId) await clearUserState(userId);
    await safeAnswerCallback(cb.id);
    await editHtml(
      chatId,
      messageId,
      t(lang, 'smart_step1'),
      buildServiceSelectionKeyboard(POPULAR_SERVICES, 0, 'popular', lang)
    );
    return;
  }

  if (data === 'menu:countries') {
    if (userId) await clearUserState(userId);
    await safeAnswerCallback(cb.id);
    await editHtml(
      chatId,
      messageId,
      t(lang, 'step1_country'),
      buildCountrySelectionKeyboard(POPULAR_COUNTRIES, 0, 'popular', lang)
    );
    return;
  }

  if (data.startsWith('ctrys:all:')) {
    const page = Number(data.slice('ctrys:all:'.length)) || 0;
    await safeAnswerCallback(cb.id);
    await editHtml(
      chatId,
      messageId,
      t(lang, 'all_countries_title', { n: ALL_COUNTRIES.length }),
      buildCountrySelectionKeyboard(ALL_COUNTRIES, page, 'all', lang)
    );
    return;
  }

  if (data === 'search:ctry_pick') {
    if (userId) {
      await setUserState(userId, { mode: 'search_country_pick' });
    }
    await safeAnswerCallback(cb.id);
    await editHtml(chatId, messageId, t(lang, 'search_country_prompt'), {
      inline_keyboard: [[{ text: t(lang, 'btn_back_countries'), callback_data: 'menu:countries' }]],
    });
    return;
  }

  if (data.startsWith('pickctry:')) {
    const countryId = data.slice('pickctry:'.length);
    await safeAnswerCallback(cb.id, '...');
    await runCountryServicesAction({
      chatId,
      countryId,
      page: 0,
      editMessageId: messageId,
      lang,
    });
    return;
  }

  if (data.startsWith('svcs_in:')) {
    const [, countryId, pageStr] = data.split(':');
    const page = Number(pageStr) || 0;
    await safeAnswerCallback(cb.id);
    await runCountryServicesAction({
      chatId,
      countryId,
      page,
      editMessageId: messageId,
      lang,
    });
    return;
  }

  if (data.startsWith('search:svc_in:')) {
    const countryId = data.slice('search:svc_in:'.length);
    if (userId) {
      await setUserState(userId, { mode: 'search_service_in_country', countryId });
    }
    await safeAnswerCallback(cb.id);
    await editHtml(
      chatId,
      messageId,
      t(lang, 'search_service_prompt', { country: escapeHtml(findCountryName(countryId)) }),
      {
        inline_keyboard: [[{ text: t(lang, 'btn_back_countries'), callback_data: `pickctry:${countryId}` }]],
      }
    );
    return;
  }

  if (data === 'menu:services') {
    if (userId) await clearUserState(userId);
    await safeAnswerCallback(cb.id);
    await editHtml(
      chatId,
      messageId,
      t(lang, 'step1_country'),
      buildCountrySelectionKeyboard(POPULAR_COUNTRIES, 0, 'popular', lang)
    );
    return;
  }

  if (data.startsWith('svcs:all:')) {
    const page = Number(data.slice('svcs:all:'.length)) || 0;
    await safeAnswerCallback(cb.id);
    await editHtml(
      chatId,
      messageId,
      `📚 <b>All Services (${ALL_SERVICES.length.toLocaleString()})</b>`,
      buildServiceSelectionKeyboard(ALL_SERVICES, page, 'all', lang)
    );
    return;
  }

  if (data === 'search:svc') {
    if (userId) {
      await setUserState(userId, { mode: 'search_service' });
    }
    await safeAnswerCallback(cb.id);
    await editHtml(chatId, messageId, t(lang, 'search_country_prompt'), {
      inline_keyboard: [[{ text: t(lang, 'btn_main_menu'), callback_data: 'menu:main' }]],
    });
    return;
  }

  if (data.startsWith('search:ctry:')) {
    const serviceCode = data.slice('search:ctry:'.length);
    if (userId) {
      await setUserState(userId, { mode: 'search_country', serviceCode });
    }
    await safeAnswerCallback(cb.id);
    await editHtml(
      chatId,
      messageId,
      `🔎 ${escapeHtml(findServiceName(serviceCode))}`,
      {
        inline_keyboard: [[{ text: t(lang, 'btn_main_menu'), callback_data: 'menu:main' }]],
      }
    );
    return;
  }

  if (data === 'menu:orders') {
    await safeAnswerCallback(cb.id);
    await runOrdersListAction(chatId, userId, messageId, lang);
    return;
  }

  if (data.startsWith('svc:')) {
    const serviceCode = data.slice(4);
    await safeAnswerCallback(cb.id);
    await runServiceCountriesAction({
      chatId,
      serviceCode,
      page: 0,
      editMessageId: messageId,
      lang,
    });
    return;
  }

  if (data.startsWith('ctry:')) {
    const [, serviceCode, pageStr] = data.split(':');
    const page = Number(pageStr) || 0;
    await safeAnswerCallback(cb.id);
    await runServiceCountriesAction({
      chatId,
      serviceCode,
      page,
      editMessageId: messageId,
      lang,
    });
    return;
  }

  if (data === 'act:balance') {
    if (!access.isOwner) {
      await safeAnswerCallback(cb.id, 'Owner only.', true);
      return;
    }
    await safeAnswerCallback(cb.id);
    const wallet = await getWallet(userId);
    await runBalanceAction(chatId, messageId, lang, wallet.balanceCents);
    return;
  }

  if (data.startsWith('buy:') || data.startsWith('buyp:')) {
    const isPoints = data.startsWith('buyp:');
    const [, serviceCode, countryId] = data.split(':');
    await safeAnswerCallback(cb.id);
    await runBuyNumberAction({
      chatId,
      userId,
      serviceCode,
      countryId,
      paymentMethod: isPoints ? 'points' : 'wallet',
      editMessageId: messageId,
      lang,
    });
    return;
  }

  if (data.startsWith('chk:')) {
    const activationId = data.slice(4);
    const res = await runCheckStatusAction(chatId, userId, activationId, messageId, lang, access.isOwner);
    const toast = !res
      ? 'Error'
      : res.state === 'OK'
        ? `✅ ${res.code}`
        : res.state === 'WAIT_CODE'
          ? '⏳ ...'
          : res.raw;
    await safeAnswerCallback(cb.id, toast);
    return;
  }

  if (data.startsWith('set:')) {
    const [, activationId, statusStr] = data.split(':');
    const statusNum = Number(statusStr);
    const res = await runSetStatusAction(chatId, userId, activationId, statusNum, messageId, lang, access.isOwner);
    if (res && res.ok) {
      await safeAnswerCallback(cb.id, '✅');
    } else {
      await safeAnswerCallback(cb.id, res?.error || res?.raw || 'Error', true);
    }
    return;
  }

  await safeAnswerCallback(cb.id);
}
