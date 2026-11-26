import { EndpointError } from 'sdk';
import {
  checkAccess,
  hasUserSelectedLang,
  getUserLang,
  getWallet,
  getRecentOrders,
  getRecentTransactions,
  getMarkupPercent,
  getStarsPerUsd,
  getPayInfo,
  getPaymentAddresses,
  getReferralSummary,
} from '../lib/store.js';
import {
  ALL_SERVICES,
  ALL_COUNTRIES,
  POPULAR_SERVICES,
  POPULAR_COUNTRIES,
  findService,
  findCountry,
} from '../lib/catalog.js';

export default async function (_input, ctx) {
  const user = ctx.initData?.user;
  if (!user?.id) {
    throw new EndpointError('Unauthorized', { code: 'UNAUTHORIZED' });
  }

  const access = await checkAccess(user.id);
  if (!access.authorized) {
    throw new EndpointError('Your account is restricted.', { code: 'RESTRICTED' });
  }

  const [
    langSelected,
    lang,
    wallet,
    orders,
    transactions,
    markupPercent,
    starsPerUsd,
    payInfo,
    addresses,
    referral,
  ] = await Promise.all([
    hasUserSelectedLang(user.id),
    getUserLang(user.id, user.language_code),
    getWallet(user.id),
    getRecentOrders(user.id, 15),
    getRecentTransactions(user.id, 15),
    getMarkupPercent(),
    getStarsPerUsd(),
    getPayInfo(),
    getPaymentAddresses(),
    getReferralSummary(user.id),
  ]);

  const enrichedOrders = orders.map((o) => {
    const svc = findService(o.serviceCode);
    const ctry = findCountry(o.countryId);
    return {
      ...o,
      serviceName: svc ? svc.name : o.serviceCode,
      serviceEmoji: svc ? svc.emoji : '📱',
      countryName: ctry ? ctry.name : `Country #${o.countryId}`,
      countryFlag: ctry ? ctry.flag : '🌍',
    };
  });

  return {
    user: {
      id: user.id,
      firstName: user.first_name || '',
      username: user.username || '',
      isOwner: access.isOwner,
      lang,
    },
    lang,
    langSelected,
    wallet,
    referral,
    orders: enrichedOrders,
    transactions,
    popularServices: POPULAR_SERVICES,
    popularCountries: POPULAR_COUNTRIES,
    services: ALL_SERVICES,
    countries: ALL_COUNTRIES,
    catalogStats: {
      servicesCount: ALL_SERVICES.length,
      countriesCount: ALL_COUNTRIES.length,
    },
    config: {
      markupPercent,
      starsPerUsd,
      payInfo: payInfo || '',
      methods: {
        stars: true,
        binance: Boolean(addresses.binance),
        usdt_bep20: Boolean(addresses.usdt_bep20),
        usdc_bep20: Boolean(addresses.usdc_bep20),
      },
    },
  };
}
