import { checkAccess, getApiConfig } from '../lib/store.js';
import { findServiceName } from '../lib/catalog.js';
import {
  escapeHtml,
  editHtml,
  safeAnswerCallback,
  buildMainMenuKeyboard,
  buildServiceSelectionKeyboard,
  buildCountrySelectionKeyboard,
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

export default async function (cb) {
  if (!cb) return;

  const userId = cb.from?.id;
  const firstName = cb.from?.first_name || '';
  const chatId = cb.message?.chat?.id;
  const messageId = cb.message?.message_id;
  const data = cb.data || '';

  const access = await checkAccess(userId);
  if (!access.authorized) {
    await safeAnswerCallback(
      cb.id,
      '⛔ Access Denied. Ask the owner to whitelist your ID.',
      true
    );
    return;
  }

  if (!chatId || !messageId) {
    await safeAnswerCallback(cb.id);
    return;
  }

  if (data === 'menu:main') {
    await safeAnswerCallback(cb.id);
    const { apiKey } = await getApiConfig();
    await editHtml(
      chatId,
      messageId,
      getWelcomeMessage(firstName, Boolean(apiKey)),
      buildMainMenuKeyboard()
    );
    return;
  }

  if (data === 'menu:help') {
    await safeAnswerCallback(cb.id);
    await editHtml(
      chatId,
      messageId,
      getHelpMessage(access.isOwner),
      buildMainMenuKeyboard()
    );
    return;
  }

  if (data === 'menu:services') {
    await safeAnswerCallback(cb.id);
    await editHtml(
      chatId,
      messageId,
      '📱 <b>Step 1/2: Select a Target Service</b>\nChoose a service below (or use <code>/buy &lt;service&gt; &lt;country&gt;</code> for custom codes):',
      buildServiceSelectionKeyboard()
    );
    return;
  }

  if (data === 'menu:orders') {
    await safeAnswerCallback(cb.id);
    await runOrdersListAction(chatId, userId, messageId);
    return;
  }

  if (data.startsWith('svc:')) {
    const serviceCode = data.slice(4);
    await safeAnswerCallback(cb.id);
    await editHtml(
      chatId,
      messageId,
      `🌍 <b>Step 2/2: Select a Country</b>\nTarget Service: <b>${escapeHtml(findServiceName(serviceCode))}</b>\n\nTap a country below to order a virtual number:`,
      buildCountrySelectionKeyboard(serviceCode)
    );
    return;
  }

  if (data === 'act:balance') {
    await safeAnswerCallback(cb.id, 'Fetching balance...');
    await runBalanceAction(chatId, messageId);
    return;
  }

  if (data.startsWith('buy:')) {
    const [, serviceCode, countryId] = data.split(':');
    await safeAnswerCallback(cb.id, 'Ordering virtual number...');
    await runBuyNumberAction({
      chatId,
      userId,
      serviceCode,
      countryId,
      editMessageId: messageId,
    });
    return;
  }

  if (data.startsWith('chk:')) {
    const activationId = data.slice(4);
    const res = await runCheckStatusAction(chatId, activationId, messageId);
    const toast = !res
      ? 'Check failed'
      : res.state === 'OK'
        ? `✅ Code received: ${res.code}`
        : res.state === 'WAIT_CODE'
          ? '⏳ Still waiting for SMS...'
          : res.raw;
    await safeAnswerCallback(cb.id, toast);
    return;
  }

  if (data.startsWith('set:')) {
    const [, activationId, statusStr] = data.split(':');
    const statusNum = Number(statusStr);
    const res = await runSetStatusAction(chatId, activationId, statusNum, messageId);
    if (res && res.ok) {
      await safeAnswerCallback(cb.id, `Updated: ${res.statusText}`);
    } else {
      await safeAnswerCallback(
        cb.id,
        res?.error || res?.raw || 'Could not update activation',
        true
      );
    }
    return;
  }

  await safeAnswerCallback(cb.id);
}
