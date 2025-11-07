import { ICONS } from '../utils/icons';
import { validatePassword, calculatePasswordStrength, addPasswordStrengthIndicator } from '../utils';
import { t } from '../utils/i18n';

/**
 * Show generate new wallet screen
 */
export function showGenerateWalletScreen(
  app: HTMLElement,
  onBack: () => void,
  onGenerate: (password: string, confirmPassword: string) => Promise<void>
): void {
  app.innerHTML = `
    <div class="screen">
      <div class="header">
        <button id="backBtn" class="btn-icon">${ICONS.back}</button>
        <div class="header-center">
          <img src="icons/icon48.png" class="header-icon" alt="Hoosat" />
          <h1>${t('createNewWalletTitle')}</h1>
        </div>
        <div style="width: 32px;"></div>
      </div>

      <div class="content">
        <div class="info-box warning">
          <div class="info-icon">${ICONS.warning}</div>
          <div class="info-text">
            <strong>${t('important')}</strong> ${t('savePrivateKeyWarning')}
          </div>
        </div>

        <div class="form">
          <div class="form-group">
            <label for="password">${t('password')}</label>
            <input type="password" id="password" placeholder="${t('createPassword')}" autocomplete="new-password" />
          </div>

          <div class="password-strength" id="passwordStrength"></div>

          <div class="form-group">
            <label for="confirmPassword">${t('confirmPassword')}</label>
            <input type="password" id="confirmPassword" placeholder="${t('confirmPasswordPlaceholder')}" autocomplete="new-password" />
          </div>

          <div class="password-requirements">
            <div class="requirements-title">${t('passwordRequirements')}</div>
            <ul>
              <li>${t('passwordReq8Chars')}</li>
              <li>${t('passwordReqUppercase')}</li>
              <li>${t('passwordReqLowercase')}</li>
              <li>${t('passwordReqNumber')}</li>
            </ul>
          </div>

          <div class="error" id="error"></div>

          <button id="generateBtn" class="btn btn-primary">${t('generateWallet')}</button>
        </div>
      </div>
    </div>
  `;

  const handleGenerate = async () => {
    const password = (document.getElementById('password') as HTMLInputElement).value;
    const confirmPassword = (document.getElementById('confirmPassword') as HTMLInputElement).value;
    const errorEl = document.getElementById('error')!;

    errorEl.textContent = '';

    // Validation
    if (!password || !confirmPassword) {
      errorEl.textContent = t('passwordRequired');
      return;
    }

    if (password !== confirmPassword) {
      errorEl.textContent = t('passwordsDoNotMatch');
      return;
    }

    // Use unified validation
    const validation = validatePassword(password);
    if (!validation.valid) {
      errorEl.textContent = validation.error!;
      return;
    }

    // Check strength (warn if too weak)
    const strength = calculatePasswordStrength(password);
    if (strength.score < 3) {
      errorEl.textContent = t('passwordTooWeak') + ' ' + strength.feedback.slice(0, 2).join(', ');
      return;
    }

    try {
      await onGenerate(password, confirmPassword);
    } catch (error: any) {
      errorEl.textContent = error.message || t('failedToGenerateWallet');
    }
  };

  document.getElementById('backBtn')!.addEventListener('click', onBack);
  document.getElementById('generateBtn')!.addEventListener('click', handleGenerate);

  // Enter key handler
  document.getElementById('confirmPassword')!.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleGenerate();
    }
  });

  // Add password strength indicator
  addPasswordStrengthIndicator('password', 'passwordStrength');
}
