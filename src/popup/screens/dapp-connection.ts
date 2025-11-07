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
    <div class="screen">
      <div class="header">
        <div class="header-center">
          <img src="icons/icon48.png" class="header-icon" alt="Hoosat" />
          <h1>${t('connectionRequest')}</h1>
        </div>
      </div>

      <div class="content">
        <div class="dapp-request-container">
          <div class="dapp-icon">${ICONS.globe}</div>

          <div class="dapp-origin">
            <div class="dapp-origin-label">${t('siteRequestingConnection')}</div>
            <div class="dapp-origin-value">${domain}</div>
            <div class="dapp-origin-full">${request.origin}</div>
          </div>

          <div class="request-timestamp ${isOld ? 'old' : ''}">
            <span class="timestamp-icon">${ICONS.clock}</span>
            <span class="timestamp-text">${t('requestedTime')} ${timeAgo}</span>
            ${isOld ? `<span class="timestamp-warning">${ICONS.warning} ${t('oldRequestWarning')}</span>` : ''}
          </div>

          <div class="info-box warning">
            <div class="info-icon">${ICONS.warning}</div>
            <div class="info-text">
              <strong>${t('thisSiteWillBeAbleTo')}</strong>
              <ul>
                <li>${t('viewYourWalletAddress')}</li>
                <li>${t('requestTransactionApprovals')}</li>
                <li>${t('viewAccountBalance')}</li>
              </ul>
            </div>
          </div>

          <div class="info-box critical">
            <div class="info-icon">${ICONS.lock}</div>
            <div class="info-text">
              <strong>${t('onlyConnectTrustedSites')}</strong><br>
              ${t('maliciousSitesWarning')}
            </div>
          </div>

          <div class="error" id="error"></div>

          <div class="dapp-actions">
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
    errorEl.textContent = error.message || t('failedToApproveConnection');
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
    errorEl.textContent = error.message || t('failedToRejectConnection');
    approveBtn.disabled = false;
    rejectBtn.disabled = false;
    rejectBtn.textContent = t('reject');
  }
}
