import { t } from '../utils/i18n';

/**
 * Show welcome screen with Create/Import wallet options
 */
export function showWelcomeScreen(
  app: HTMLElement,
  onCreateNew: () => void,
  onImport: () => void
): void {
  app.innerHTML = `
    <div class="screen">
      <div class="header">
        <div class="header-left">
          <img src="icons/icon48.png" class="header-icon" alt="Hoosat" />
          <h1>${t('appName')}</h1>
        </div>
      </div>

      <div class="content">
        <div class="welcome">
          <h2>${t('welcome')}</h2>
          <p>${t('welcomeDescription')}</p>
        </div>

        <div class="wallet-options">
          <button id="createNewBtn" class="btn btn-primary wallet-option-btn">
            <div class="option-icon">🔑</div>
            <div class="option-text">
              <div class="option-title">${t('createNewWallet')}</div>
              <div class="option-desc">${t('createNewWalletDesc')}</div>
            </div>
          </button>

          <button id="importBtn" class="btn btn-secondary wallet-option-btn">
            <div class="option-icon">📥</div>
            <div class="option-text">
              <div class="option-title">${t('importExistingWallet')}</div>
              <div class="option-desc">${t('importExistingWalletDesc')}</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('createNewBtn')!.addEventListener('click', onCreateNew);
  document.getElementById('importBtn')!.addEventListener('click', onImport);
}
