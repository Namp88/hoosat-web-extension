import { t, changeLanguage } from '../utils/i18n';
import { getSelectedLanguage, saveLanguage, AVAILABLE_LANGUAGES, type SupportedLanguage } from '../../shared/language';

/**
 * Show settings screen
 */
export async function showSettingsScreen(
  app: HTMLElement,
  onBack: () => void,
  onChangePassword: () => void,
  onExportKey: () => void,
  onConnectedSites: () => void,
  onReset: () => void
): Promise<void> {
  const currentLanguage = await getSelectedLanguage();

  app.innerHTML = `
    <div class="screen">
      <div class="header">
        <button id="backBtn" class="btn-icon">←</button>
        <div class="header-center">
          <img src="icons/icon48.png" class="header-icon" alt="Hoosat" />
          <h1>${t('settings')}</h1>
        </div>
        <div style="width: 32px;"></div>
      </div>

      <div class="content">
        <div class="settings">
          <div class="settings-section">
            <h3>🌍 ${t('language')}</h3>
            <div class="form-group">
              <label for="languageSelect">${t('selectLanguage')}</label>
              <select id="languageSelect" class="language-select">
                ${AVAILABLE_LANGUAGES.map(
                  lang => `
                  <option value="${lang.code}" ${lang.code === currentLanguage ? 'selected' : ''}>
                    ${lang.nativeName}
                  </option>
                `
                ).join('')}
              </select>
            </div>
          </div>

          <div class="settings-divider"></div>

          <button id="connectedSitesBtn" class="btn btn-secondary">🔗 ${t('connectedSites')}</button>
          <button id="changePasswordBtn" class="btn btn-secondary">🔑 ${t('changePassword')}</button>
          <button id="exportKeyBtn" class="btn btn-secondary">📤 ${t('exportPrivateKey')}</button>

          <div class="settings-divider"></div>

          <button id="resetBtn" class="btn btn-danger">🗑️ ${t('resetWallet')}</button>
        </div>
      </div>
    </div>
  `;

  // Event listeners
  document.getElementById('backBtn')!.addEventListener('click', onBack);
  document.getElementById('connectedSitesBtn')!.addEventListener('click', onConnectedSites);
  document.getElementById('changePasswordBtn')!.addEventListener('click', onChangePassword);
  document.getElementById('exportKeyBtn')!.addEventListener('click', onExportKey);
  document.getElementById('resetBtn')!.addEventListener('click', onReset);

  // Language selector handler
  const languageSelect = document.getElementById('languageSelect') as HTMLSelectElement;
  languageSelect.addEventListener('change', async () => {
    const newLanguage = languageSelect.value as SupportedLanguage;
    const originalValue = languageSelect.value;

    try {
      // Show loading state
      languageSelect.disabled = true;
      languageSelect.style.opacity = '0.6';

      // Save language preference
      await saveLanguage(newLanguage);

      // Apply language change
      await changeLanguage(newLanguage);

      // Small delay for better UX (shows the change is happening)
      await new Promise(resolve => setTimeout(resolve, 150));

      // Re-render settings screen with new language (stay on same page)
      await showSettingsScreen(app, onBack, onChangePassword, onExportKey, onConnectedSites, onReset);
    } catch (error) {
      console.error('Failed to change language:', error);

      // Restore previous value on error
      languageSelect.value = originalValue;
      languageSelect.disabled = false;
      languageSelect.style.opacity = '1';

      // Show error message
      alert(t('failedToChangeLanguage') || 'Failed to change language');
    }
  });
}
