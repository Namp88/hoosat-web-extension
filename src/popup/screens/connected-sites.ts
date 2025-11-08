import { loadConnectedSites, removeConnectedSite } from '../../shared/storage';
import { showConfirmDialog } from '../components';
import { t, tn } from '../utils/i18n';
import { ICONS } from '../utils/icons';

/**
 * Show connected sites management screen
 */
export async function showConnectedSitesScreen(app: HTMLElement, onBack: () => void): Promise<void> {
  const sites = await loadConnectedSites();

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
            <h1>${t('connectedSitesTitle')}</h1>
          </div>
          <div class="hero-header-spacer"></div>
        </div>

        <!-- Content -->
        <div class="settings-content">
          ${
            sites.length === 0
              ? `
          <div class="settings-empty-state">
            <div class="settings-empty-icon">${ICONS.link}</div>
            <h3>${t('noConnectedSites')}</h3>
            <p>${t('noConnectedSitesDesc')}</p>
          </div>
          `
              : `
          <div class="hero-info-box warning mb-lg">
            <div class="hero-info-box-icon">${ICONS.info}</div>
            <div>
              ${t('connectedSitesInfo')}
            </div>
          </div>

          <div class="settings-card">
            ${sites
              .map(
                site => `
              <div class="settings-site-item" data-origin="${site.origin}">
                <div class="settings-site-info">
                  <div class="settings-site-name">
                    <div class="settings-site-icon">${ICONS.globe}</div>
                    ${new URL(site.origin).hostname}
                  </div>
                  <div class="settings-site-url">${site.origin}</div>
                  <div class="settings-site-date">${t('connected')} ${formatDate(site.connectedAt)}</div>
                </div>
                <button class="settings-disconnect-btn" data-origin="${site.origin}">
                  ${ICONS.unlink} ${t('disconnect')}
                </button>
              </div>
            `
              )
              .join('')}
          </div>
          `
          }
        </div>
      </div>
    </div>
  `;

  // Back button
  document.getElementById('backBtn')!.addEventListener('click', onBack);

  // Disconnect buttons
  document.querySelectorAll('.settings-disconnect-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const origin = (e.target as HTMLElement).closest('.settings-disconnect-btn')!.getAttribute('data-origin')!;
      await handleDisconnect(origin, onBack);
    });
  });
}

/**
 * Handle disconnect site
 */
async function handleDisconnect(origin: string, onBack: () => void): Promise<void> {
  const domain = new URL(origin).hostname;

  const confirmed = await showConfirmDialog(
    t('disconnectSite'),
    tn('disconnectSiteConfirm', domain)
  );

  if (confirmed) {
    await removeConnectedSite(origin);

    // Refresh the screen
    const app = document.getElementById('app')!;
    await showConnectedSitesScreen(app, onBack);
  }
}

/**
 * Format date to relative time
 */
function formatDate(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return days === 1 ? tn('dayAgo', days.toString()) : tn('daysAgo', days.toString());
  } else if (hours > 0) {
    return hours === 1 ? tn('hourAgo', hours.toString()) : tn('hoursAgo', hours.toString());
  } else if (minutes > 0) {
    return minutes === 1 ? tn('minuteAgo', minutes.toString()) : tn('minutesAgo', minutes.toString());
  } else {
    return t('justNow');
  }
}
