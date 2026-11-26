import { api } from 'sdk';
import { getOwnerId } from './store.js';

const USER_COMMANDS_EN = [
  { command: 'start', description: 'Open YekTap menu & Mini App' },
  { command: 'buy', description: 'Buy a virtual number' },
  { command: 'orders', description: 'My numbers & SMS codes' },
  { command: 'wallet', description: 'Wallet balance & history' },
  { command: 'topup', description: 'Add funds to wallet' },
  { command: 'referral', description: 'Invite friends & earn points' },
  { command: 'lang', description: 'Change language' },
  { command: 'paysupport', description: 'Payment & refund support' },
  { command: 'help', description: 'Help & commands' },
];

const USER_COMMANDS_FA = [
  { command: 'start', description: 'منوی اصلی و ورود به یک‌تپ' },
  { command: 'buy', description: 'خرید شماره مجازی' },
  { command: 'orders', description: 'شماره‌های من و دریافت کد' },
  { command: 'wallet', description: 'کیف پول و تراکنش‌ها' },
  { command: 'topup', description: 'شارژ کیف پول' },
  { command: 'referral', description: 'دعوت از دوستان و کسب امتیاز' },
  { command: 'lang', description: 'تغییر زبان' },
  { command: 'paysupport', description: 'پشتیبانی پرداخت‌ها' },
  { command: 'help', description: 'راهنما' },
];

const USER_COMMANDS_AR = [
  { command: 'start', description: 'القائمة الرئيسية وفتح YekTap' },
  { command: 'buy', description: 'شراء رقم افتراضي' },
  { command: 'orders', description: 'أرقامي ورموز SMS' },
  { command: 'wallet', description: 'المحفظة والمعاملات' },
  { command: 'topup', description: 'شحن المحفظة' },
  { command: 'lang', description: 'تغيير اللغة' },
  { command: 'paysupport', description: 'دعم المدفوعات' },
  { command: 'help', description: 'المساعدة' },
];

const USER_COMMANDS_RU = [
  { command: 'start', description: 'Главное меню YekTap' },
  { command: 'buy', description: 'Купить виртуальный номер' },
  { command: 'orders', description: 'Мои номера и SMS-коды' },
  { command: 'wallet', description: 'Кошелёк и история' },
  { command: 'topup', description: 'Пополнить баланс' },
  { command: 'lang', description: 'Сменить язык' },
  { command: 'paysupport', description: 'Поддержка по оплате' },
  { command: 'help', description: 'Помощь' },
];

const USER_COMMANDS_TR = [
  { command: 'start', description: 'Ana menü ve YekTap' },
  { command: 'buy', description: 'Sanal numara al' },
  { command: 'orders', description: 'Numaralarım ve SMS kodları' },
  { command: 'wallet', description: 'Cüzdan ve işlemler' },
  { command: 'topup', description: 'Bakiye yükle' },
  { command: 'lang', description: 'Dili değiştir' },
  { command: 'paysupport', description: 'Ödeme desteği' },
  { command: 'help', description: 'Yardım' },
];

const OWNER_EXTRA_COMMANDS = [
  { command: 'stats', description: 'Owner: Revenue, points & profit stats' },
  { command: 'users', description: 'Owner: List users & all wallet balances' },
  { command: 'balance', description: 'Owner: Gateway balance' },
  { command: 'payconfig', description: 'Owner: Payment addresses' },
  { command: 'addbalance', description: 'Owner: Credit user wallet' },
  { command: 'setpay', description: 'Owner: Set payment addresses' },
  { command: 'setmarkup', description: 'Owner: Set markup percent' },
  { command: 'setrefpoints', description: 'Owner: Set points per referral' },
  { command: 'setservicepoints', description: 'Owner: Set service points price' },
  { command: 'block', description: 'Owner: Restrict user' },
];

export async function syncBotCommands() {
  await api.setChatMenuButton({
    menu_button: { type: 'commands' },
  });

  await api.setMyCommands({ commands: USER_COMMANDS_EN });
  await api.setMyCommands({ commands: USER_COMMANDS_FA, language_code: 'fa' });
  await api.setMyCommands({ commands: USER_COMMANDS_AR, language_code: 'ar' });
  await api.setMyCommands({ commands: USER_COMMANDS_RU, language_code: 'ru' });
  await api.setMyCommands({ commands: USER_COMMANDS_TR, language_code: 'tr' });

  const ownerId = await getOwnerId();
  let ownerSynced = false;
  if (ownerId) {
    try {
      await api.setMyCommands({
        commands: [...USER_COMMANDS_EN, ...OWNER_EXTRA_COMMANDS],
        scope: { type: 'chat', chat_id: ownerId },
      });
      ownerSynced = true;
    } catch (err) {
      console.warn('Owner scoped commands skipped:', err.message);
    }
  }

  return {
    ok: true,
    menuButton: 'commands',
    languages: ['default(en)', 'fa', 'ar', 'ru', 'tr'],
    userCommandCount: USER_COMMANDS_EN.length,
    ownerSynced,
  };
}

export default async function () {
  return await syncBotCommands();
}
