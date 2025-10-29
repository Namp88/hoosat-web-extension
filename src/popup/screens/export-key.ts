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
    <div class="screen">
      <div class="header">
        <button id="backBtn" class="btn-icon">←</button>
        <div class="header-center">
          <img src="icons/icon48.png" class="header-icon" alt="Hoosat" />
          <h1>${t('exportPrivateKeyTitle')}</h1>
        </div>
        <div style="width: 32px;"></div>
      </div>

      <div class="content">
        <div class="info-box critical">
          <div class="info-icon">⚠️</div>
          <div class="info-text">
            <strong>${t('securityWarning')}</strong><br>
            ${t('neverSharePrivateKey')}
          </div>
        </div>

        <div class="form">
          <div class="form-group">
            <label for="password">${t('enterPasswordToConfirm')}</label>
            <input type="password" id="password" placeholder="${t('enterPassword')}" autocomplete="off" />
          </div>

          <div class="error" id="error"></div>

          <button id="exportBtn" class="btn btn-primary">${t('showPrivateKey')}</button>
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

  errorEl.textContent = '';

  if (!password) {
    errorEl.textContent = t('passwordRequired');
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
    errorEl.textContent = error.message || t('invalidPassword');
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
      <div class="screen">
        <div class="header">
          <button id="backBtn" class="btn-icon">←</button>
          <div class="header-center">
            <img src="icons/icon48.png" class="header-icon" alt="Hoosat" />
            <h1>${t('yourPrivateKey')}</h1>
          </div>
          <div style="width: 32px;"></div>
        </div>

        <div class="content">
          <div class="info-box critical">
            <div class="info-icon">🔐</div>
            <div class="info-text">
              <strong>${t('keepThisKeySafe')}</strong><br>
              ${t('keepKeySafeWarning')}
            </div>
          </div>

          <div class="key-display">
            <label>${t('yourAddress')}</label>
            <div class="key-value small">${address}</div>
          </div>

          <div class="key-display">
            <label>${t('privateKeyHex')}</label>
            <div class="key-value ${!isKeyVisible ? 'key-hidden' : ''}" id="keyValue">
              ${isKeyVisible ? privateKey : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
            </div>
            <button id="toggleKeyBtn" class="btn btn-secondary">
              ${isKeyVisible ? '🙈 ' + t('hideKey') : '👁️ ' + t('showKey')}
            </button>
          </div>

          ${
            isKeyVisible
              ? `
          <button id="copyKeyBtn" class="btn btn-primary">📋 ${t('copyToClipboard')}</button>
          `
              : ''
          }

          <div class="info-box warning" style="margin-top: 20px;">
            <div class="info-icon">💡</div>
            <div class="info-text">
              <strong>${t('bestPractices')}</strong><br>
              • ${t('bestPractice1')}<br>
              • ${t('bestPractice2')}<br>
              • ${t('bestPractice3')}<br>
              • ${t('bestPractice4')}
            </div>
          </div>

          <button id="doneBtn" class="btn btn-secondary" style="margin-top: 12px;">${t('done')}</button>
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
          const originalText = btn.textContent;
          btn.textContent = '✓ ' + t('copiedToClipboard');
          setTimeout(() => {
            btn.textContent = originalText;
          }, 2000);
        });
      });
    }
  };

  renderScreen();
}
