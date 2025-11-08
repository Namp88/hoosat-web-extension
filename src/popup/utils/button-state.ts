/**
 * Button state management utilities
 */

import { ICONS } from './icons';
import { t } from './i18n';

/**
 * Execute action with button loading state
 * Automatically disables buttons during execution and shows loading text
 */
export async function executeWithButtonLoading<T>(
  config: {
    buttonId: string;
    loadingText: string;
    originalText: string;
    otherButtonIds?: string[];
    errorElementId?: string;
    errorMessage?: string;
    errorIcon?: string;
  },
  action: () => Promise<T>
): Promise<T | null> {
  const button = document.getElementById(config.buttonId) as HTMLButtonElement;
  if (!button) {
    console.error(`Button not found: ${config.buttonId}`);
    return null;
  }

  const otherButtons = (config.otherButtonIds || [])
    .map(id => document.getElementById(id) as HTMLButtonElement)
    .filter(btn => btn !== null);

  // Save original states
  const originalText = button.innerHTML || config.originalText;

  // Disable all buttons and show loading
  button.disabled = true;
  button.innerHTML = config.loadingText;
  otherButtons.forEach(btn => (btn.disabled = true));

  try {
    const result = await action();
    // Success - don't re-enable buttons (usually navigating away)
    return result;
  } catch (error: any) {
    // Re-enable buttons
    button.disabled = false;
    button.innerHTML = originalText;
    otherButtons.forEach(btn => (btn.disabled = false));

    // Show error if error element provided
    if (config.errorElementId) {
      const errorEl = document.getElementById(config.errorElementId);
      if (errorEl) {
        const icon = config.errorIcon || ICONS.error;
        const message = error.message || config.errorMessage || t('operationFailed');
        errorEl.innerHTML = `${icon} ${message}`;
      }
    }

    return null;
  }
}

/**
 * Set button loading state manually
 */
export function setButtonLoading(
  buttonId: string,
  loading: boolean,
  loadingText?: string,
  originalText?: string
): void {
  const button = document.getElementById(buttonId) as HTMLButtonElement;
  if (!button) return;

  if (loading) {
    button.disabled = true;
    if (loadingText) {
      button.innerHTML = loadingText;
    }
  } else {
    button.disabled = false;
    if (originalText) {
      button.innerHTML = originalText;
    }
  }
}

/**
 * Enable/disable multiple buttons
 */
export function setButtonsEnabled(buttonIds: string[], enabled: boolean): void {
  buttonIds.forEach(id => {
    const button = document.getElementById(id) as HTMLButtonElement;
    if (button) {
      button.disabled = !enabled;
    }
  });
}
