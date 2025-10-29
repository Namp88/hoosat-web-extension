/**
 * i18n utility functions for Chrome Extension i18n API with manual language override support
 */

import { getSelectedLanguage, getEffectiveLanguage, type SupportedLanguage } from '../../shared/language';

// Cache for loaded messages
let messagesCache: Record<string, any> = {};
let currentOverrideLanguage: string | null = null;

/**
 * Load messages for a specific language
 * @param lang - Language code
 * @returns Messages object
 */
async function loadMessages(lang: string): Promise<Record<string, any>> {
  try {
    const url = chrome.runtime.getURL(`_locales/${lang}/messages.json`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load messages for ${lang}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to load messages for ${lang}:`, error);
    // Fallback to English
    if (lang !== 'en') {
      return loadMessages('en');
    }
    return {};
  }
}

/**
 * Initialize language override
 */
export async function initLanguage(): Promise<void> {
  const selectedLang = await getSelectedLanguage();
  if (selectedLang !== 'auto') {
    currentOverrideLanguage = selectedLang;
    messagesCache = await loadMessages(selectedLang);
  }
}

/**
 * Change language manually
 * @param lang - Language code to switch to
 */
export async function changeLanguage(lang: SupportedLanguage): Promise<void> {
  const effectiveLang = getEffectiveLanguage(lang);
  currentOverrideLanguage = lang === 'auto' ? null : effectiveLang;

  if (currentOverrideLanguage) {
    messagesCache = await loadMessages(currentOverrideLanguage);
  } else {
    messagesCache = {};
  }
}

/**
 * Get translated message by key
 * @param key - Message key from messages.json
 * @param substitutions - Optional substitutions for placeholders
 * @returns Translated message
 */
export function t(key: string, substitutions?: string | string[]): string {
  // If language is overridden, use cached messages
  if (currentOverrideLanguage && messagesCache[key]) {
    let message = messagesCache[key].message;

    // Handle substitutions
    if (substitutions) {
      const subs = Array.isArray(substitutions) ? substitutions : [substitutions];
      subs.forEach((sub, index) => {
        message = message.replace(`$${index + 1}`, sub);
      });
    }

    return message;
  }

  // Otherwise use native Chrome i18n API
  return chrome.i18n.getMessage(key, substitutions);
}

/**
 * Get translated message with single substitution
 * @param key - Message key from messages.json
 * @param value - Value to substitute
 * @returns Translated message
 */
export function t1(key: string, value: string | number): string {
  return chrome.i18n.getMessage(key, String(value));
}

/**
 * Get translated message with multiple substitutions
 * @param key - Message key from messages.json
 * @param values - Array of values to substitute
 * @returns Translated message
 */
export function tn(key: string, ...values: (string | number)[]): string {
  return chrome.i18n.getMessage(key, values.map(String));
}

/**
 * Get current UI language
 * @returns Current language code (e.g., "en", "ru", "zh_CN")
 */
export function getCurrentLanguage(): string {
  return chrome.i18n.getUILanguage();
}

/**
 * Format time ago with proper pluralization
 * @param timestamp - Timestamp in milliseconds
 * @returns Formatted time string
 */
export function formatTimeAgoI18n(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return days === 1 ? t1('dayAgo', days) : t1('daysAgo', days);
  } else if (hours > 0) {
    return hours === 1 ? t1('hourAgo', hours) : t1('hoursAgo', hours);
  } else if (minutes > 0) {
    return minutes === 1 ? t1('minuteAgo', minutes) : t1('minutesAgo', minutes);
  } else {
    return t('justNow');
  }
}
