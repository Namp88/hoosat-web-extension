/**
 * Error handling utilities
 */

import { ICONS } from './icons';

/**
 * Display error message in error element
 */
export function displayError(errorElementId: string, message: string, icon: string = ICONS.warning): void {
  const errorEl = document.getElementById(errorElementId);
  if (errorEl) {
    errorEl.innerHTML = `${icon} ${message}`;
  }
}

/**
 * Clear error message
 */
export function clearError(errorElementId: string = 'error'): void {
  const errorEl = document.getElementById(errorElementId);
  if (errorEl) {
    errorEl.innerHTML = '';
  }
}

/**
 * Validate password match
 */
export function validatePasswordMatch(
  password: string,
  confirmPassword: string,
  errorElementId: string = 'error'
): boolean {
  clearError(errorElementId);

  if (!password || !confirmPassword) {
    return false;
  }

  if (password !== confirmPassword) {
    return false;
  }

  return true;
}
