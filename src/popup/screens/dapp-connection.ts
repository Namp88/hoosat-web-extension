import { APP_NAME } from '../../shared/constants';
import { DAppRequest } from '../../shared/types';

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

  app.innerHTML = `
    <div class="screen">
      <div class="header">
        <div class="header-center">
          <img src="icons/icon48.png" class="header-icon" alt="Hoosat" />
          <h1>Connection Request</h1>
        </div>
      </div>

      <div class="content">
        <div class="dapp-request-container">
          <div class="dapp-icon">🌐</div>

          <div class="dapp-origin">
            <div class="dapp-origin-label">Site requesting connection:</div>
            <div class="dapp-origin-value">${domain}</div>
            <div class="dapp-origin-full">${request.origin}</div>
          </div>

          <div class="info-box warning">
            <div class="info-icon">⚠️</div>
            <div class="info-text">
              <strong>This site will be able to:</strong>
              <ul>
                <li>View your wallet address</li>
                <li>Request transaction approvals</li>
                <li>View your account balance</li>
              </ul>
            </div>
          </div>

          <div class="info-box critical">
            <div class="info-icon">🔒</div>
            <div class="info-text">
              <strong>Only connect to websites you trust!</strong><br>
              Malicious websites may attempt to steal your funds.
            </div>
          </div>

          <div class="error" id="error"></div>

          <div class="dapp-actions">
            <button id="rejectBtn" class="btn btn-secondary">Reject</button>
            <button id="approveBtn" class="btn btn-primary">Connect</button>
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
    approveBtn.textContent = 'Connecting...';

    await onApprove();
  } catch (error: any) {
    errorEl.textContent = error.message || 'Failed to approve connection';
    approveBtn.disabled = false;
    rejectBtn.disabled = false;
    approveBtn.textContent = 'Connect';
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
    rejectBtn.textContent = 'Rejecting...';

    await onReject();
  } catch (error: any) {
    errorEl.textContent = error.message || 'Failed to reject connection';
    approveBtn.disabled = false;
    rejectBtn.disabled = false;
    rejectBtn.textContent = 'Reject';
  }
}
