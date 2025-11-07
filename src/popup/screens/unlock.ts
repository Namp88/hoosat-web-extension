import { t } from '../utils/i18n';
import { ICONS } from '../utils/icons';

export interface UnlockContext {
  title?: string; // Custom title instead of "Unlock Wallet"
  message?: string; // Additional message to show
  origin?: string; // DApp origin if this is a DApp request
}

/**
 * Show unlock wallet screen
 */
export function showUnlockScreen(
  app: HTMLElement,
  onUnlock: (password: string) => Promise<void>,
  context?: UnlockContext
): void {
  const title = context?.title || t('unlockWallet');

  // Extract domain from origin if provided
  let domain = null;
  if (context?.origin) {
    try {
      domain = new URL(context.origin).hostname;
    } catch (e) {
      domain = context.origin;
    }
  }

  app.innerHTML = `
    <div class="unlock-hero">
      <!-- Animated Background Elements -->
      <div class="unlock-background">
        <!-- Gradient Orbs -->
        <div class="gradient-orb orb-1"></div>
        <div class="gradient-orb orb-2"></div>

        <!-- Floating Particles -->
        <div class="particle particle-1"></div>
        <div class="particle particle-2"></div>
        <div class="particle particle-3"></div>
        <div class="particle particle-4"></div>
        <div class="particle particle-5"></div>
        <div class="particle particle-6"></div>

        <!-- Grid Pattern -->
        <div class="grid-pattern"></div>
      </div>

      <!-- Main Content -->
      <div class="unlock-container">
        <!-- Logo & Brand -->
        <div class="unlock-brand">
          <img src="icons/icon48.png" class="unlock-logo" alt="Hoosat" />
          <h1 class="unlock-app-name">${t('appName')}</h1>
        </div>

        ${
          context?.origin
            ? `
        <div class="unlock-dapp-badge">
          <div class="dapp-badge-icon">${ICONS.globe}</div>
          <div class="dapp-badge-content">
            <div class="dapp-badge-label">${t('requestFrom')}</div>
            <div class="dapp-badge-domain">${domain}</div>
          </div>
        </div>
        `
            : ''
        }

        <!-- Lock Icon with Animation -->
        <div class="unlock-icon-wrapper">
          <div class="unlock-icon-glow"></div>
          <div class="unlock-icon">
            ${ICONS.lock}
          </div>
        </div>

        <!-- Welcome Message -->
        <h2 class="unlock-title">
          <span class="text-gradient">${context?.title || t('welcomeBack')}</span>
        </h2>

        <p class="unlock-subtitle">${context?.message || t('enterPasswordToUnlock')}</p>

        <!-- Unlock Form Card -->
        <div class="unlock-card">
          <div class="form-group">
            <label for="password">${ICONS.key} ${t('password')}</label>
            <input
              type="password"
              id="password"
              class="unlock-input"
              placeholder="${t('enterPassword')}"
              autocomplete="current-password"
            />
          </div>

          <div class="error" id="error"></div>

          <button type="button" id="unlockBtn" class="btn btn-primary unlock-btn">
            <span class="icon-with-text">${ICONS.unlock} ${t('unlock')}</span>
          </button>
        </div>

        <!-- Footer hint -->
        <div class="unlock-hint">
          ${ICONS.info} ${t('walletLockedHint')}
        </div>
      </div>
    </div>
  `;

  const handleUnlockAction = async () => {
    const password = (document.getElementById('password') as HTMLInputElement).value;
    const errorEl = document.getElementById('error')!;

    errorEl.innerHTML = '';

    if (!password) {
      errorEl.innerHTML = `${ICONS.warning} ${t('passwordRequired')}`;
      return;
    }

    try {
      await onUnlock(password);
    } catch (error: any) {
      errorEl.innerHTML = `${ICONS.warning} ${error.message || t('invalidPassword')}`;
    }
  };

  // Button click handler
  document.getElementById('unlockBtn')!.addEventListener('click', handleUnlockAction);

  // Auto-focus password field
  const passwordInput = document.getElementById('password') as HTMLInputElement;

  // Enter key handler
  passwordInput.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleUnlockAction();
    }
  });

  passwordInput.focus();
}
