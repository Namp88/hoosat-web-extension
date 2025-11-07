import { DAppRequest } from '../../shared/types';
import { formatTimeAgo, isRequestOld, t } from '../utils';
import { ICONS } from '../utils/icons';
/**
 * Show DApp connection request screen
 */
export function showDAppConnectionScreen(
  app: HTMLElement,
  request: DAppRequest,
  onApprove: () => Promise<void>,
  onReject: () => Promise<void>
): void {
  // Extract domain from origin
  const url = new URL(request.origin);
  const domain = url.hostname;

  // Format timestamp
  const timeAgo = formatTimeAgo(request.timestamp);
  const isOld = isRequestOld(request.timestamp);

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
          <div style="width: 32px;"></div>
          <div class="create-import-header-title">
            <img src="icons/icon48.png" class="create-import-header-icon" alt="Hoosat" />
            <h1>${t('connectionRequest')}</h1>
          </div>
          <div style="width: 32px;"></div>
        </div>

        <!-- Content -->
        <div class="create-import-content">
          <!-- Site Info Card -->
          <div class="create-import-card" style="text-align: center; margin-bottom: var(--spacing-md);">
            <div style="width: 72px; height: 72px; display: flex; align-items: center; justify-content: center; background: rgba(20, 184, 166, 0.15); border: 2px solid rgba(20, 184, 166, 0.3); border-radius: 50%; margin: 0 auto var(--spacing-md); font-size: 36px; color: var(--color-hoosat-teal);">
              ${ICONS.globe}
            </div>
            <div style="margin-bottom: var(--spacing-xs); font-size: var(--font-size-sm); color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">
              ${t('siteRequestingConnection')}
            </div>
            <div style="font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: var(--text-primary); margin-bottom: var(--spacing-xs);">
              ${domain}
            </div>
            <div style="font-size: var(--font-size-xs); color: var(--text-tertiary); word-break: break-all;">
              ${request.origin}
            </div>
            <div style="display: flex; align-items: center; justify-content: center; gap: var(--spacing-xs); margin-top: var(--spacing-md); font-size: var(--font-size-xs); color: var(--text-tertiary);">
              ${ICONS.clock} ${t('requestedTime')} ${timeAgo}
              ${isOld ? `<span style="color: #eab308;">${ICONS.warning} ${t('oldRequestWarning')}</span>` : ''}
            </div>
          </div>

          <!-- Permissions Info Box -->
          <div class="hero-info-box warning" style="margin-bottom: var(--spacing-md);">
            <div class="hero-info-box-icon">${ICONS.warning}</div>
            <div>
              <strong>${t('thisSiteWillBeAbleTo')}</strong>
              <ul style="margin: var(--spacing-xs) 0 0 var(--spacing-md); padding: 0; list-style-position: inside;">
                <li>${t('viewYourWalletAddress')}</li>
                <li>${t('requestTransactionApprovals')}</li>
                <li>${t('viewAccountBalance')}</li>
              </ul>
            </div>
          </div>

          <!-- Security Warning Info Box -->
          <div class="hero-info-box error" style="margin-bottom: var(--spacing-md);">
            <div class="hero-info-box-icon">${ICONS.lock}</div>
            <div>
              <strong>${t('onlyConnectTrustedSites')}</strong><br>
              ${t('maliciousSitesWarning')}
            </div>
          </div>

          <div class="create-import-error" id="error"></div>

          <!-- Action Buttons -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-sm);">
            <button id="rejectBtn" class="btn btn-secondary">${t('reject')}</button>
            <button id="approveBtn" class="btn btn-primary">${t('connect')}</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Event listeners
  document.getElementById('rejectBtn')!.addEventListener('click', () => handleReject(onReject));
  document.getElementById('approveBtn')!.addEventListener('click', () => handleApprove(onApprove));
}

/**
 * Handle approve connection
 */
async function handleApprove(onApprove: () => Promise<void>): Promise<void> {
  const errorEl = document.getElementById('error')!;
  const approveBtn = document.getElementById('approveBtn') as HTMLButtonElement;
  const rejectBtn = document.getElementById('rejectBtn') as HTMLButtonElement;

  try {
    approveBtn.disabled = true;
    rejectBtn.disabled = true;
    approveBtn.textContent = t('connecting');

    await onApprove();
  } catch (error: any) {
    errorEl.innerHTML = `${ICONS.error} ${error.message || t('failedToApproveConnection')}`;
    approveBtn.disabled = false;
    rejectBtn.disabled = false;
    approveBtn.textContent = t('connect');
  }
}

/**
 * Handle reject connection
 */
async function handleReject(onReject: () => Promise<void>): Promise<void> {
  const errorEl = document.getElementById('error')!;
  const approveBtn = document.getElementById('approveBtn') as HTMLButtonElement;
  const rejectBtn = document.getElementById('rejectBtn') as HTMLButtonElement;

  try {
    approveBtn.disabled = true;
    rejectBtn.disabled = true;
    rejectBtn.textContent = t('rejecting');

    await onReject();
  } catch (error: any) {
    errorEl.innerHTML = `${ICONS.error} ${error.message || t('failedToRejectConnection')}`;
    approveBtn.disabled = false;
    rejectBtn.disabled = false;
    rejectBtn.textContent = t('reject');
  }
}
