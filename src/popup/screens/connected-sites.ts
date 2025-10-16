import { APP_NAME } from '../../shared/constants';
import { loadConnectedSites, removeConnectedSite } from '../../shared/storage';
import { showConfirmDialog } from '../components';

/**
 * Show connected sites management screen
 */
export async function showConnectedSitesScreen(app: HTMLElement, onBack: () => void): Promise<void> {
  const sites = await loadConnectedSites();

  app.innerHTML = `
    <div class="screen">
      <div class="header">
        <button id="backBtn" class="btn-icon">←</button>
        <div class="header-center">
          <img src="icons/icon48.png" class="header-icon" alt="Hoosat" />
          <h1>Connected Sites</h1>
        </div>
        <div style="width: 32px;"></div>
      </div>

      <div class="content">
        ${
          sites.length === 0
            ? `
        <div class="empty-state">
          <div class="empty-icon">🔗</div>
          <h3>No Connected Sites</h3>
          <p>When you connect your wallet to a site, it will appear here.</p>
        </div>
        `
            : `
        <div class="info-box warning" style="margin-bottom: 20px;">
          <div class="info-icon">ℹ️</div>
          <div class="info-text">
            Connected sites can view your wallet address and request transactions.
            Disconnect sites you no longer use or trust.
          </div>
        </div>

        <div class="sites-list">
          ${sites
            .map(
              site => `
            <div class="site-item" data-origin="${site.origin}">
              <div class="site-info">
                <div class="site-icon">🌐</div>
                <div class="site-details">
                  <div class="site-name">${new URL(site.origin).hostname}</div>
                  <div class="site-url">${site.origin}</div>
                  <div class="site-date">Connected ${formatDate(site.connectedAt)}</div>
                </div>
              </div>
              <button class="btn-disconnect" data-origin="${site.origin}">
                Disconnect
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
    'Disconnect Site',
    `Are you sure you want to disconnect ${domain}? The site will need to request connection again.`
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
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    return 'just now';
  }
}
