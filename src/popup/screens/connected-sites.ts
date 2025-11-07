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
    <div class="screen">
      <div class="header">
        <button id="backBtn" class="btn-icon">${ICONS.back}</button>
        <div class="header-center">
          <img src="icons/icon48.png" class="header-icon" alt="Hoosat" />
          <h1>${t('connectedSitesTitle')}</h1>
        </div>
        <div style="width: 32px;"></div>
      </div>

      <div class="content">
        ${
          sites.length === 0
            ? `
        <div class="empty-state">
          <div class="empty-icon">${ICONS.link}</div>
          <h3>${t('noConnectedSites')}</h3>
          <p>${t('noConnectedSitesDesc')}</p>
        </div>
        `
            : `
        <div class="info-box warning" style="margin-bottom: 20px;">
          <div class="info-icon">${ICONS.info}</div>
          <div class="info-text">
            ${t('connectedSitesInfo')}
          </div>
        </div>

        <div class="sites-list">
          ${sites
            .map(
              site => `
            <div class="site-item" data-origin="${site.origin}">
              <div class="site-info">
                <div class="site-icon">${ICONS.globe}</div>
                <div class="site-details">
                  <div class="site-name">${new URL(site.origin).hostname}</div>
                  <div class="site-url">${site.origin}</div>
                  <div class="site-date">${t('connected')} ${formatDate(site.connectedAt)}</div>
                </div>
              </div>
              <button class="btn-disconnect" data-origin="${site.origin}">
                ${t('disconnect')}
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
  `;

  // Back button
  document.getElementById('backBtn')!.addEventListener('click', onBack);

  // Disconnect buttons
  document.querySelectorAll('.btn-disconnect').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const origin = (e.target as HTMLElement).dataset.origin!;
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
