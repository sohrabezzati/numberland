/**
 * Popular services & countries quick-select catalog for SecondNumber.io.
 * Users can also order any custom service/country code via `/buy <service> <country> [maxPrice]`.
 */

export const POPULAR_SERVICES = [
  { code: 'tg', name: 'Telegram', emoji: '✈️' },
  { code: 'wa', name: 'WhatsApp', emoji: '💬' },
  { code: 'go', name: 'Google / Gmail', emoji: '🔍' },
  { code: 'oi', name: 'OpenAI / ChatGPT', emoji: '🤖' },
  { code: 'ig', name: 'Instagram', emoji: '📸' },
  { code: 'tw', name: 'X / Twitter', emoji: '🐦' },
  { code: 'fb', name: 'Facebook', emoji: '📘' },
  { code: 'ds', name: 'Discord', emoji: '🎮' },
  { code: 'mm', name: 'Microsoft', emoji: '🪟' },
  { code: 'lf', name: 'TikTok', emoji: '🎵' },
  { code: 'am', name: 'Amazon', emoji: '📦' },
  { code: 'ts', name: 'PayPal', emoji: '💳' },
];

export const POPULAR_COUNTRIES = [
  { id: '187', name: 'USA', flag: '🇺🇸' },
  { id: '16', name: 'United Kingdom', flag: '🇬🇧' },
  { id: '36', name: 'Canada', flag: '🇨🇦' },
  { id: '48', name: 'Netherlands', flag: '🇳🇱' },
  { id: '43', name: 'Germany', flag: '🇩🇪' },
  { id: '78', name: 'France', flag: '🇫🇷' },
  { id: '6', name: 'Indonesia', flag: '🇮🇩' },
  { id: '4', name: 'Philippines', flag: '🇵🇭' },
  { id: '22', name: 'India', flag: '🇮🇳' },
  { id: '73', name: 'Brazil', flag: '🇧🇷' },
  { id: '15', name: 'Poland', flag: '🇵🇱' },
  { id: '117', name: 'Portugal', flag: '🇵🇹' },
];

export function findServiceName(code) {
  const normalized = String(code || '').toLowerCase();
  const item = POPULAR_SERVICES.find((s) => s.code.toLowerCase() === normalized);
  return item ? `${item.emoji} ${item.name} (${item.code})` : String(code);
}

export function findCountryName(id) {
  const normalized = String(id || '');
  const item = POPULAR_COUNTRIES.find((c) => c.id === normalized);
  return item ? `${item.flag} ${item.name} (#${item.id})` : `Country #${normalized}`;
}
