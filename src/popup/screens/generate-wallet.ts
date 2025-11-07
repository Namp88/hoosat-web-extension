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
    <div class="create-import-hero">
      <!-- Static Background -->
      <div class="create-import-background">
        <div class="create-import-gradient-orb create-import-orb-1"></div>
        <div class="create-import-gradient-orb create-import-orb-2"></div>
        <div class="create-import-grid-pattern"></div>
      </div>

      <!-- Container -->
      <div class="create-import-container">
        <!-- Header -->
        <div class="create-import-header">
          <button id="backBtn" class="create-import-back-btn">${ICONS.back}</button>
          <div class="create-import-header-title">
            <img src="icons/icon48.png" class="create-import-header-icon" alt="Hoosat" />
            <h1>${t('createNewWalletTitle')}</h1>
          </div>
          <div style="width: 32px;"></div>
        </div>

        <!-- Content -->
        <div class="create-import-content">
          <!-- Warning Info Box -->
          <div class="hero-info-box warning">
            <div class="hero-info-box-icon">${ICONS.warning}</div>
            <div>
              <strong>${t('important')}</strong> ${t('savePrivateKeyWarning')}
            </div>
          </div>

          <!-- Form Card -->
          <div class="create-import-card">
            <div class="create-import-form-group">
              <label for="password">${t('password')}</label>
              <input type="password" id="password" placeholder="${t('createPassword')}" autocomplete="new-password" />
            </div>

            <div class="create-import-password-strength" id="passwordStrength"></div>

            <div class="create-import-form-group">
              <label for="confirmPassword">${t('confirmPassword')}</label>
              <input type="password" id="confirmPassword" placeholder="${t('confirmPasswordPlaceholder')}" autocomplete="new-password" />
            </div>

            <div class="create-import-password-requirements">
              <div class="create-import-requirements-title">${t('passwordRequirements')}</div>
              <ul>
                <li>${t('passwordReq8Chars')}</li>
                <li>${t('passwordReqUppercase')}</li>
                <li>${t('passwordReqLowercase')}</li>
                <li>${t('passwordReqNumber')}</li>
              </ul>
            </div>

            <div class="create-import-error" id="error"></div>

            <button id="generateBtn" class="btn btn-primary create-import-submit-btn">${t('generateWallet')}</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const handleGenerate = async () => {
    const password = (document.getElementById('password') as HTMLInputElement).value;
    const confirmPassword = (document.getElementById('confirmPassword') as HTMLInputElement).value;
    const errorEl = document.getElementById('error')!;

    errorEl.innerHTML = '';

    // Validation
    if (!password || !confirmPassword) {
      errorEl.innerHTML = `${ICONS.warning} ${t('passwordRequired')}`;
      return;
    }

    if (password !== confirmPassword) {
      errorEl.innerHTML = `${ICONS.warning} ${t('passwordsDoNotMatch')}`;
      return;
    }

    // Use unified validation
    const validation = validatePassword(password);
    if (!validation.valid) {
      errorEl.innerHTML = `${ICONS.warning} ${validation.error!}`;
      return;
    }

    // Check strength (warn if too weak)
    const strength = calculatePasswordStrength(password);
    if (strength.score < 3) {
      errorEl.innerHTML = `${ICONS.warning} ${t('passwordTooWeak')} ${strength.feedback.slice(0, 2).join(', ')}`;
      return;
    }

    try {
      await onGenerate(password, confirmPassword);
    } catch (error: any) {
      errorEl.innerHTML = `${ICONS.error} ${error.message || t('failedToGenerateWallet')}`;
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
