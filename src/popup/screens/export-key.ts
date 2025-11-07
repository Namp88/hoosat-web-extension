import { ICONS } from '../utils/icons';
import { t } from '../utils/i18n';

/**
 * Show export private key screen with password verification
 */
export function showExportKeyScreen(
  app: HTMLElement,
  onBack: () => void,
  onExport: (password: string) => Promise<{ privateKey: string; address: string }>
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
            <h1>${t('exportPrivateKeyTitle')}</h1>
          </div>
          <div style="width: 32px;"></div>
        </div>

        <!-- Content -->
        <div class="create-import-content">
          <!-- Critical Warning Info Box -->
          <div class="hero-info-box error">
            <div class="hero-info-box-icon">${ICONS.warning}</div>
            <div>
              <strong>${t('securityWarning')}</strong><br>
              ${t('neverSharePrivateKey')}
            </div>
          </div>

          <!-- Form Card -->
          <div class="create-import-card">
            <div class="create-import-form-group">
              <label for="password">${t('enterPasswordToConfirm')}</label>
              <input type="password" id="password" placeholder="${t('enterPassword')}" autocomplete="off" />
            </div>

            <div class="create-import-error" id="error"></div>

            <button id="exportBtn" class="btn btn-primary create-import-submit-btn">${t('showPrivateKey')}</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('backBtn')!.addEventListener('click', onBack);
  document.getElementById('exportBtn')!.addEventListener('click', () => handleExportPrivateKey(onExport, onBack));

  // Enter key handler
  const passwordInput = document.getElementById('password') as HTMLInputElement;
  passwordInput.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleExportPrivateKey(onExport, onBack);
    }
  });

  // Focus password field
  passwordInput.focus();
}

/**
 * Handle export private key request
 */
async function handleExportPrivateKey(
  onExport: (password: string) => Promise<{ privateKey: string; address: string }>,
  onBack: () => void
): Promise<void> {
  const password = (document.getElementById('password') as HTMLInputElement).value;
  const errorEl = document.getElementById('error')!;

  errorEl.innerHTML = '';

  if (!password) {
    errorEl.innerHTML = `${ICONS.warning} ${t('passwordRequired')}`;
    return;
  }

  try {
    const exportBtn = document.getElementById('exportBtn') as HTMLButtonElement;
    exportBtn.disabled = true;
    exportBtn.textContent = t('verifying');

    const result = await onExport(password);

    // Show the private key
    showPrivateKeyExported(result.privateKey, result.address, onBack);
  } catch (error: any) {
    errorEl.innerHTML = `${ICONS.error} ${error.message || t('invalidPassword')}`;
    const exportBtn = document.getElementById('exportBtn') as HTMLButtonElement;
    exportBtn.disabled = false;
    exportBtn.textContent = t('showPrivateKey');
  }
}

/**
 * Show exported private key with security warnings
 */
function showPrivateKeyExported(privateKey: string, address: string, onBack: () => void): void {
  let isKeyVisible = false;

  const app = document.getElementById('app')!;

  const renderScreen = () => {
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
              <h1>${t('yourPrivateKey')}</h1>
            </div>
            <div style="width: 32px;"></div>
          </div>

          <!-- Content -->
          <div class="create-import-content">
            <!-- Critical Warning -->
            <div class="hero-info-box error">
              <div class="hero-info-box-icon">${ICONS.key}</div>
              <div>
                <strong>${t('keepThisKeySafe')}</strong><br>
                ${t('keepKeySafeWarning')}
              </div>
            </div>

            <!-- Key Display Card -->
            <div class="create-import-card">
              <div class="create-import-form-group">
                <label>${t('yourAddress')}</label>
                <div style="padding: var(--spacing-md); background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(20, 184, 166, 0.3); border-radius: var(--radius-md); color: var(--text-secondary); font-size: var(--font-size-sm); font-family: 'Courier New', monospace; word-break: break-all;">${address}</div>
              </div>

              <div class="create-import-form-group">
                <label>${t('privateKeyHex')}</label>
                <div style="padding: var(--spacing-md); background: rgba(15, 23, 42, 0.8); border: 2px solid ${isKeyVisible ? 'var(--color-hoosat-teal)' : 'rgba(20, 184, 166, 0.3)'}; border-radius: var(--radius-md); color: var(--text-primary); font-size: var(--font-size-sm); font-family: 'Courier New', monospace; word-break: break-all; margin-bottom: var(--spacing-md);">
                  ${isKeyVisible ? privateKey : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                </div>
                <button id="toggleKeyBtn" class="btn btn-secondary" style="width: 100%; margin-bottom: var(--spacing-md);">
                  ${isKeyVisible ? `${ICONS.eyeHide} ${t('hideKey')}` : `${ICONS.eye} ${t('showKey')}`}
                </button>
              </div>

              ${
                isKeyVisible
                  ? `<button id="copyKeyBtn" class="btn btn-primary create-import-submit-btn">${ICONS.copy} ${t('copyToClipboard')}</button>`
                  : ''
              }
            </div>

            <!-- Best Practices -->
            <div class="hero-info-box warning">
              <div class="hero-info-box-icon">${ICONS.lightbulb}</div>
              <div>
                <strong>${t('bestPractices')}</strong><br>
                • ${t('bestPractice1')}<br>
                • ${t('bestPractice2')}<br>
                • ${t('bestPractice3')}<br>
                • ${t('bestPractice4')}
              </div>
            </div>

            <button id="doneBtn" class="btn btn-secondary" style="width: 100%;">${t('done')}</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('backBtn')!.addEventListener('click', onBack);
    document.getElementById('doneBtn')!.addEventListener('click', onBack);

    document.getElementById('toggleKeyBtn')!.addEventListener('click', () => {
      isKeyVisible = !isKeyVisible;
      renderScreen();
    });

    if (isKeyVisible) {
      document.getElementById('copyKeyBtn')!.addEventListener('click', () => {
        navigator.clipboard.writeText(privateKey).then(() => {
          const btn = document.getElementById('copyKeyBtn')!;
          const originalText = btn.innerHTML;
          btn.innerHTML = `${ICONS.check} ${t('copiedToClipboard')}`;
          setTimeout(() => {
            btn.innerHTML = originalText;
          }, 2000);
        });
      });
    }
  };

  renderScreen();
}
