/**
 * Password validation utilities
 */

import { MIN_PASSWORD_LENGTH } from '../../shared/constants';
import { ICONS } from '../utils/icons';
import { t } from './i18n';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface PasswordStrength {
  score: number;
  feedback: string[];
}

/**
 * Validate password requirements
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { valid: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }

  return { valid: true };
}

/**
 * Calculate password strength (0-6 score)
 */
export function calculatePasswordStrength(password: string): PasswordStrength {
  let score = 0;
  const feedback: string[] = [];

  // Length
  if (password.length >= MIN_PASSWORD_LENGTH) score++;
  if (password.length >= 12) score++;
  else if (password.length < MIN_PASSWORD_LENGTH) feedback.push(`At least ${MIN_PASSWORD_LENGTH} characters`);

  // Has uppercase
  if (/[A-Z]/.test(password)) score++;
  else feedback.push('Add uppercase letters');

  // Has lowercase
  if (/[a-z]/.test(password)) score++;
  else feedback.push('Add lowercase letters');

  // Has numbers
  if (/[0-9]/.test(password)) score++;
  else feedback.push('Add numbers');

  // Has special characters (bonus)
  if (/[^A-Za-z0-9]/.test(password)) score++;
  else feedback.push('Add special characters (recommended)');

  return { score, feedback };
}

/**
 * Add live password strength indicator to input field
 */
export function addPasswordStrengthIndicator(inputId: string, strengthId: string): void {
  const passwordInput = document.getElementById(inputId) as HTMLInputElement;
  const strengthDiv = document.getElementById(strengthId);

  if (!passwordInput || !strengthDiv) {
    console.warn(`Password strength indicator: elements not found (${inputId}, ${strengthId})`);
    return;
  }

  passwordInput.addEventListener('input', () => {
    const password = passwordInput.value;
    const strength = calculatePasswordStrength(password);

    strengthDiv.className = 'password-strength';

    if (password.length === 0) {
      strengthDiv.innerHTML = '';
      return;
    }

    if (strength.score < 3) {
      strengthDiv.classList.add('weak');
      strengthDiv.innerHTML = `${ICONS.statusRed} ${t('weakPassword')}`;
    } else if (strength.score < 4) {
      strengthDiv.classList.add('medium');
      strengthDiv.innerHTML = `${ICONS.statusYellow} ${t('mediumPassword')}`;
    } else {
      strengthDiv.classList.add('strong');
      strengthDiv.innerHTML = `${ICONS.statusGreen} ${t('strongPassword')}`;
    }
  });
}
