/**
 * Icon utilities - Font Awesome icons matching Landing style
 * Maps emoji icons to Font Awesome 6 classes
 */

export const ICONS = {
  // Navigation & UI
  back: '<i class="fa-solid fa-arrow-left"></i>',
  close: '<i class="fa-solid fa-xmark"></i>',
  menu: '<i class="fa-solid fa-bars"></i>',
  chevronDown: '<i class="fa-solid fa-chevron-down"></i>',

  // Actions
  copy: '<i class="fa-regular fa-copy"></i>',
  paste: '<i class="fa-regular fa-paste"></i>',
  download: '<i class="fa-solid fa-download"></i>',
  upload: '<i class="fa-solid fa-upload"></i>',
  refresh: '<i class="fa-solid fa-rotate"></i>',

  // Security & Auth
  lock: '<i class="fa-solid fa-lock"></i>',
  unlock: '<i class="fa-solid fa-lock-open"></i>',
  key: '<i class="fa-solid fa-key"></i>',
  shield: '<i class="fa-solid fa-shield-halved"></i>',
  eye: '<i class="fa-solid fa-eye"></i>',
  eyeSlash: '<i class="fa-solid fa-eye-slash"></i>',

  // Wallet & Transactions
  wallet: '<i class="fa-solid fa-wallet"></i>',
  send: '<i class="fa-solid fa-paper-plane"></i>',
  receive: '<i class="fa-solid fa-arrow-down-to-line"></i>',
  exchange: '<i class="fa-solid fa-arrow-right-arrow-left"></i>',
  coins: '<i class="fa-solid fa-coins"></i>',

  // Network & Connection
  globe: '<i class="fa-solid fa-globe"></i>',
  link: '<i class="fa-solid fa-link"></i>',
  chain: '<i class="fa-solid fa-link"></i>',
  unlink: '<i class="fa-solid fa-link-slash"></i>',

  // Status & Feedback
  check: '<i class="fa-solid fa-check"></i>',
  checkCircle: '<i class="fa-solid fa-circle-check"></i>',
  warning: '<i class="fa-solid fa-triangle-exclamation"></i>',
  error: '<i class="fa-solid fa-circle-xmark"></i>',
  info: '<i class="fa-solid fa-circle-info"></i>',

  // Settings & Tools
  settings: '<i class="fa-solid fa-gear"></i>',
  wrench: '<i class="fa-solid fa-wrench"></i>',
  sliders: '<i class="fa-solid fa-sliders"></i>',

  // Time & History
  clock: '<i class="fa-regular fa-clock"></i>',
  history: '<i class="fa-solid fa-clock-rotate-left"></i>',
  calendar: '<i class="fa-regular fa-calendar"></i>',

  // Misc
  lightbulb: '<i class="fa-regular fa-lightbulb"></i>',
  question: '<i class="fa-solid fa-circle-question"></i>',
  exclamation: '<i class="fa-solid fa-circle-exclamation"></i>',
  trash: '<i class="fa-solid fa-trash"></i>',
  wand: '<i class="fa-solid fa-wand-magic-sparkles"></i>',
  handWave: '<i class="fa-solid fa-hand-wave"></i>',
  party: '<i class="fa-solid fa-party-horn"></i>',
  eyeHide: '<i class="fa-solid fa-eye-slash"></i>',
  language: '<i class="fa-solid fa-language"></i>',
  arrowUp: '<i class="fa-solid fa-arrow-up"></i>',
  signature: '<i class="fa-solid fa-signature"></i>',
  fileSignature: '<i class="fa-solid fa-file-signature"></i>',
  bell: '<i class="fa-solid fa-bell"></i>',
  moneyBill: '<i class="fa-solid fa-money-bill"></i>',

  // Status indicators (colored)
  statusGreen: '<i class="fa-solid fa-circle" style="color: var(--color-success);"></i>',
  statusYellow: '<i class="fa-solid fa-circle" style="color: var(--color-warning);"></i>',
  statusRed: '<i class="fa-solid fa-circle" style="color: var(--color-error);"></i>',
} as const;

/**
 * Legacy emoji to Font Awesome mapping
 * For backward compatibility during migration
 */
export const EMOJI_TO_FA: Record<string, string> = {
  '←': ICONS.back,
  '🔒': ICONS.lock,
  '🔐': ICONS.key,
  '👁': ICONS.eye,
  '🌐': ICONS.globe,
  '🔗': ICONS.link,
  '⚠️': ICONS.warning,
  '💡': ICONS.lightbulb,
  '⏰': ICONS.clock,
  'ℹ️': ICONS.info,
  '📋': ICONS.copy,
  '⚙️': ICONS.settings,
  '🟢': ICONS.statusGreen,
  '🟡': ICONS.statusYellow,
  '🔴': ICONS.statusRed,
};

/**
 * Create icon element from icon key
 */
export function icon(key: keyof typeof ICONS): string {
  return ICONS[key];
}

/**
 * Replace emoji with Font Awesome icon in HTML string
 */
export function replaceEmoji(html: string): string {
  let result = html;
  for (const [emoji, faIcon] of Object.entries(EMOJI_TO_FA)) {
    result = result.replace(new RegExp(emoji, 'g'), faIcon);
  }
  return result;
}

/**
 * Get icon HTML by name with optional class
 */
export function getIcon(name: keyof typeof ICONS, className?: string): string {
  const iconHtml = ICONS[name];
  if (className) {
    return iconHtml.replace('<i class="', `<i class="${className} `);
  }
  return iconHtml;
}
