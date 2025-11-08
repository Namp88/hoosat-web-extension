import { t, changeLanguage } from '../utils/i18n';
import { getSelectedLanguage, saveLanguage, AVAILABLE_LANGUAGES, type SupportedLanguage } from '../../shared/language';
import { showAlertDialog } from '../components/modal';
import { ICONS } from '../utils/icons';
import { DEFAULT_CONSOLIDATION_THRESHOLD } from '../../shared/types';
import { setButtonLoading } from '../utils/button-state';

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
    <div class="settings-hero">
      <!-- Static Background -->
      <div class="settings-background">
        <div class="settings-gradient-orb settings-orb-1"></div>
        <div class="settings-gradient-orb settings-orb-2"></div>
        <div class="settings-grid-pattern"></div>
      </div>

      <!-- Container -->
      <div class="settings-container">
        <!-- Header -->
        <div class="settings-header">
          <button id="backBtn" class="settings-back-btn">${ICONS.back}</button>
          <div class="settings-header-title">
            <img src="icons/icon48.png" class="settings-header-icon" alt="Hoosat" />
            <h1>${t('settings')}</h1>
          </div>
          <div class="hero-header-spacer"></div>
        </div>

        <!-- Content -->
        <div class="settings-content">
          <div class="settings-card">
            <button id="languageBtn" class="settings-menu-btn">${ICONS.language} ${t('languageSettings')}</button>
            <button id="utxoBtn" class="settings-menu-btn">${ICONS.refresh} ${t('utxoManagement')}</button>
          </div>

          <div class="settings-card">
            <button id="connectedSitesBtn" class="settings-menu-btn">${ICONS.link} ${t('connectedSites')}</button>
            <button id="changePasswordBtn" class="settings-menu-btn">${ICONS.key} ${t('changePassword')}</button>
            <button id="exportKeyBtn" class="settings-menu-btn">${ICONS.send} ${t('exportPrivateKey')}</button>
          </div>

          <div class="settings-card">
            <button id="resetBtn" class="settings-menu-btn danger">${ICONS.trash} ${t('resetWallet')}</button>
          </div>
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
    <div class="settings-hero">
      <!-- Static Background -->
      <div class="settings-background">
        <div class="settings-gradient-orb settings-orb-1"></div>
        <div class="settings-gradient-orb settings-orb-2"></div>
        <div class="settings-grid-pattern"></div>
      </div>

      <!-- Container -->
      <div class="settings-container">
        <!-- Header -->
        <div class="settings-header">
          <button id="backBtn" class="settings-back-btn">${ICONS.back}</button>
          <div class="settings-header-title">
            <img src="icons/icon48.png" class="settings-header-icon" alt="Hoosat" />
            <h1>${t('languageSettings')}</h1>
          </div>
          <div class="hero-header-spacer"></div>
        </div>

        <!-- Content -->
        <div class="settings-content">
          <div class="settings-card">
            <div class="settings-form-group">
              <label for="languageSelect">${t('selectLanguage')}</label>
              <select id="languageSelect" class="settings-select">
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
    <div class="settings-hero">
      <!-- Static Background -->
      <div class="settings-background">
        <div class="settings-gradient-orb settings-orb-1"></div>
        <div class="settings-gradient-orb settings-orb-2"></div>
        <div class="settings-grid-pattern"></div>
      </div>

      <!-- Container -->
      <div class="settings-container">
        <!-- Header -->
        <div class="settings-header">
          <button id="backBtn" class="settings-back-btn">${ICONS.back}</button>
          <div class="settings-header-title">
            <img src="icons/icon48.png" class="settings-header-icon" alt="Hoosat" />
            <h1>${t('utxoManagement')}</h1>
          </div>
          <div class="hero-header-spacer"></div>
        </div>

        <!-- Content -->
        <div class="settings-content">
          <div class="settings-card">
            <div class="settings-utxo-info">
              <p id="utxoCount">${t('checkingUtxos')}</p>
              <button id="consolidateBtn" class="btn btn-primary settings-action-btn" disabled>${t('consolidateUtxos')}</button>
            </div>

            <label class="settings-checkbox-label">
              <input type="checkbox" id="autoConsolidateCheckbox" />
              ${t('autoConsolidateWhen', [DEFAULT_CONSOLIDATION_THRESHOLD.toString()])}
            </label>
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
      try {
        setButtonLoading('consolidateBtn', true, t('consolidating'), t('consolidateUtxos'));

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
        setButtonLoading('consolidateBtn', false, t('consolidating'), t('consolidateUtxos'));
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
