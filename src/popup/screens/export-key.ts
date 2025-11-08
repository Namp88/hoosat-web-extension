import { ICONS } from '../utils/icons';
import { t } from '../utils/i18n';
import { displayError, clearError } from '../utils/error-handler';
import { addEnterKeyHandler } from '../utils/keyboard';
import { executeWithButtonLoading } from '../utils/button-state';
import { createErrorBox, createWarningBox } from '../components/info-box';

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
          <div class="hero-header-spacer"></div>
        </div>

        <!-- Content -->
        <div class="create-import-content">
          ${createErrorBox({
            icon: ICONS.warning,
            title: t('securityWarning'),
            message: t('neverSharePrivateKey')
          })}

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
  addEnterKeyHandler('password', () => handleExportPrivateKey(onExport, onBack));

  // Focus password field
  const passwordInput = document.getElementById('password') as HTMLInputElement;
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

  clearError('error');

  if (!password) {
    displayError('error', t('passwordRequired'));
    return;
  }

  const result = await executeWithButtonLoading(
    {
      buttonId: 'exportBtn',
      loadingText: t('verifying'),
      originalText: t('showPrivateKey'),
      errorElementId: 'error',
      errorMessage: t('invalidPassword')
    },
    () => onExport(password)
  );

  if (result) {
    // Show the private key
    showPrivateKeyExported(result.privateKey, result.address, onBack);
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
            <div class="hero-header-spacer"></div>
          </div>

          <!-- Content -->
          <div class="create-import-content">
            ${createErrorBox({
              icon: ICONS.key,
              title: t('keepThisKeySafe'),
              message: t('keepKeySafeWarning')
            })}

            <!-- Key Display Card -->
            <div class="create-import-card">
              <div class="create-import-form-group">
                <label>${t('yourAddress')}</label>
                <div class="hero-code-block">${address}</div>
              </div>

              <div class="create-import-form-group">
                <label>${t('privateKeyHex')}</label>
                <div class="hero-code-block ${isKeyVisible ? 'hero-code-block-visible' : 'hero-code-block-hidden'}">
                  ${isKeyVisible ? privateKey : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                </div>
                <button id="toggleKeyBtn" class="btn btn-secondary hero-btn-full mb-md">
                  ${isKeyVisible ? `${ICONS.eyeHide} ${t('hideKey')}` : `${ICONS.eye} ${t('showKey')}`}
                </button>
              </div>

              ${
                isKeyVisible
                  ? `<button id="copyKeyBtn" class="btn btn-primary create-import-submit-btn">${ICONS.copy} ${t('copyToClipboard')}</button>`
                  : ''
              }
            </div>

            ${createWarningBox({
              icon: ICONS.lightbulb,
              title: t('bestPractices'),
              listItems: [
                t('bestPractice1'),
                t('bestPractice2'),
                t('bestPractice3'),
                t('bestPractice4')
              ]
            })}

            <button id="doneBtn" class="btn btn-secondary hero-btn-full">${t('done')}</button>
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
