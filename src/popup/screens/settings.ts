import { t, changeLanguage } from '../utils/i18n';
import { getSelectedLanguage, saveLanguage, AVAILABLE_LANGUAGES, type SupportedLanguage } from '../../shared/language';
import { showAlertDialog } from '../components/modal';
import { ICONS } from '../utils/icons';
import { DEFAULT_CONSOLIDATION_THRESHOLD } from '../../shared/types';

/**
 * Show settings screen (main menu)
 */
export async function showSettingsScreen(
  app: HTMLElement,
  onBack: () => void,
  onLanguageSettings: () => void,
  onUtxoManagement: () => void,
  onChangePassword: () => void,
  onExportKey: () => void,
  onConnectedSites: () => void,
  onReset: () => void
): Promise<void> {

  app.innerHTML = `
    <div class="screen">
      <div class="header">
        <button id="backBtn" class="btn-icon">${ICONS.back}</button>
        <div class="header-center">
          <img src="icons/icon48.png" class="header-icon" alt="Hoosat" />
          <h1>${t('settings')}</h1>
        </div>
        <div style="width: 32px;"></div>
      </div>

      <div class="content">
        <div class="settings">
          <button id="languageBtn" class="btn btn-secondary">${ICONS.language} ${t('languageSettings')}</button>
          <button id="utxoBtn" class="btn btn-secondary">${ICONS.refresh} ${t('utxoManagement')}</button>

          <div class="settings-divider"></div>

          <button id="connectedSitesBtn" class="btn btn-secondary">${ICONS.link} ${t('connectedSites')}</button>
          <button id="changePasswordBtn" class="btn btn-secondary">${ICONS.key} ${t('changePassword')}</button>
          <button id="exportKeyBtn" class="btn btn-secondary">${ICONS.send} ${t('exportPrivateKey')}</button>

          <div class="settings-divider"></div>

          <button id="resetBtn" class="btn btn-danger">${ICONS.trash} ${t('resetWallet')}</button>
        </div>
      </div>
    </div>
  `;

  // Event listeners
  document.getElementById('backBtn')!.addEventListener('click', onBack);
  document.getElementById('languageBtn')!.addEventListener('click', onLanguageSettings);
  document.getElementById('utxoBtn')!.addEventListener('click', onUtxoManagement);
  document.getElementById('connectedSitesBtn')!.addEventListener('click', onConnectedSites);
  document.getElementById('changePasswordBtn')!.addEventListener('click', onChangePassword);
  document.getElementById('exportKeyBtn')!.addEventListener('click', onExportKey);
  document.getElementById('resetBtn')!.addEventListener('click', onReset);
}

/**
 * Show language settings screen
 */
export async function showLanguageSettingsScreen(
  app: HTMLElement,
  onBack: () => void
): Promise<void> {
  const currentLanguage = await getSelectedLanguage();

  app.innerHTML = `
    <div class="screen">
      <div class="header">
        <button id="backBtn" class="btn-icon">${ICONS.back}</button>
        <div class="header-center">
          <img src="icons/icon48.png" class="header-icon" alt="Hoosat" />
          <h1>${t('languageSettings')}</h1>
        </div>
        <div style="width: 32px;"></div>
      </div>

      <div class="content">
        <div class="settings">
          <div class="settings-section">
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
        </div>
      </div>
    </div>
  `;

  // Event listeners
  document.getElementById('backBtn')!.addEventListener('click', onBack);

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

      // Re-render language settings screen with new language
      await showLanguageSettingsScreen(app, onBack);
    } catch (error) {
      console.error('Failed to change language:', error);

      // Restore previous value on error
      languageSelect.value = originalValue;
      languageSelect.disabled = false;
      languageSelect.style.opacity = '1';

      // Show error message
      await showAlertDialog(t('error'), t('failedToChangeLanguage') || 'Failed to change language', 'error');
    }
  });
}

/**
 * Show UTXO management screen
 */
export async function showUtxoManagementScreen(
  app: HTMLElement,
  onBack: () => void
): Promise<void> {
  app.innerHTML = `
    <div class="screen">
      <div class="header">
        <button id="backBtn" class="btn-icon">${ICONS.back}</button>
        <div class="header-center">
          <img src="icons/icon48.png" class="header-icon" alt="Hoosat" />
          <h1>${t('utxoManagement')}</h1>
        </div>
        <div style="width: 32px;"></div>
      </div>

      <div class="content">
        <div class="settings">
          <div class="settings-section">
            <div class="utxo-info">
              <p id="utxoCount">${t('checkingUtxos')}</p>
              <button id="consolidateBtn" class="btn btn-secondary" disabled>${t('consolidateUtxos')}</button>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" id="autoConsolidateCheckbox" />
                ${t('autoConsolidateWhen', [DEFAULT_CONSOLIDATION_THRESHOLD.toString()])}
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Event listeners
  document.getElementById('backBtn')!.addEventListener('click', onBack);

  // Load UTXO info and consolidation settings
  loadUtxoInfo();

  async function loadUtxoInfo() {
    try {
      // Get consolidation info
      const infoResponse = await chrome.runtime.sendMessage({
        type: 'GET_CONSOLIDATION_INFO',
      });

      if (infoResponse.success) {
        const info = infoResponse.data;
        const utxoCountEl = document.getElementById('utxoCount');
        const consolidateBtn = document.getElementById('consolidateBtn') as HTMLButtonElement;

        if (utxoCountEl) {
          utxoCountEl.textContent = t('currentUtxos', [info.utxoCount.toString()]);
        }

        if (consolidateBtn) {
          consolidateBtn.disabled = info.utxoCount < 2;
        }
      }

      // Get consolidation settings
      const settingsResponse = await chrome.runtime.sendMessage({
        type: 'GET_CONSOLIDATION_SETTINGS',
      });

      if (settingsResponse.success) {
        const settings = settingsResponse.data;
        const checkbox = document.getElementById('autoConsolidateCheckbox') as HTMLInputElement;
        if (checkbox) {
          checkbox.checked = settings.autoConsolidate;
        }
      }
    } catch (error) {
      console.error('Failed to load UTXO info:', error);
    }
  }

  // Consolidate button handler
  const consolidateBtn = document.getElementById('consolidateBtn');
  if (consolidateBtn) {
    consolidateBtn.addEventListener('click', async () => {
      const originalText = consolidateBtn.textContent;
      try {
        consolidateBtn.textContent = t('consolidating');
        (consolidateBtn as HTMLButtonElement).disabled = true;

        const response = await chrome.runtime.sendMessage({
          type: 'CONSOLIDATE_UTXOS',
        });

        if (response.success) {
          await showAlertDialog(t('success'), t('consolidationComplete'), 'success');
          // Reload UTXO info to show updated count
          await loadUtxoInfo();
        } else {
          throw new Error(response.error);
        }
      } catch (error) {
        console.error('Consolidation failed:', error);
        await showAlertDialog(t('error'), t('consolidationFailed') + ': ' + (error as Error).message, 'error');
        // Restore button state on error
        consolidateBtn.textContent = originalText || t('consolidateUtxos');
        (consolidateBtn as HTMLButtonElement).disabled = false;
      }
    });
  }

  // Auto-consolidate checkbox handler
  const autoConsolidateCheckbox = document.getElementById('autoConsolidateCheckbox') as HTMLInputElement;
  if (autoConsolidateCheckbox) {
    autoConsolidateCheckbox.addEventListener('change', async () => {
      try {
        await chrome.runtime.sendMessage({
          type: 'UPDATE_CONSOLIDATION_SETTINGS',
          data: {
            autoConsolidate: autoConsolidateCheckbox.checked,
          },
        });
      } catch (error) {
        console.error('Failed to update auto-consolidate setting:', error);
        // Revert checkbox on error
        autoConsolidateCheckbox.checked = !autoConsolidateCheckbox.checked;
      }
    });
  }
}
