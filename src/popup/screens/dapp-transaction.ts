import { APP_NAME, SOMPI_PER_HTN } from '../../shared/constants';
import { DAppRequest } from '../../shared/types';
import { formatAddress } from '../utils';
import { HoosatUtils } from 'hoosat-sdk-web';

/**
 * Show DApp transaction request screen
 */
export function showDAppTransactionScreen(
  app: HTMLElement,
  request: DAppRequest,
  balance: string,
  estimatedFee: string,
  onApprove: () => Promise<void>,
  onReject: () => Promise<void>
): void {
  // Extract domain from origin
  const url = new URL(request.origin);
  const domain = url.hostname;

  // Parse transaction params
  const { to, amount, fee } = request.params;
  const amountHTN = typeof amount === 'number' ? amount : parseFloat(amount) / SOMPI_PER_HTN;
  const feeHTN = parseFloat(fee || estimatedFee) / SOMPI_PER_HTN;
  const totalHTN = amountHTN + feeHTN;

  // Check if sufficient balance
  const balanceHTN = parseFloat(balance) / SOMPI_PER_HTN;
  const hasSufficientBalance = balanceHTN >= totalHTN;

  app.innerHTML = `
    <div class="screen">
      <div class="header">
        <div class="header-center">
          <img src="icons/icon48.png" class="header-icon" alt="Hoosat" />
          <h1>Transaction Request</h1>
        </div>
      </div>

      <div class="content">
        <div class="dapp-request-container">
          <div class="dapp-icon">📤</div>

          <div class="dapp-origin">
            <div class="dapp-origin-label">Requested by:</div>
            <div class="dapp-origin-value">${domain}</div>
            <div class="dapp-origin-full">${request.origin}</div>
          </div>

          <div class="tx-preview-section">
            <div class="tx-preview-label">Sending to</div>
            <div class="tx-preview-value address-preview">${formatAddress(to)}</div>
            <div class="tx-preview-full">${to}</div>
          </div>

          <div class="tx-preview-section">
            <div class="tx-preview-label">Amount</div>
            <div class="tx-preview-value amount-value">${amountHTN.toFixed(8)} HTN</div>
          </div>

          <div class="tx-preview-divider"></div>

          <div class="tx-preview-section">
            <div class="tx-preview-label">Network Fee</div>
            <div class="tx-preview-value fee-value">${feeHTN.toFixed(8)} HTN</div>
          </div>

          <div class="tx-preview-section total-section">
            <div class="tx-preview-label">Total</div>
            <div class="tx-preview-value total-value">${totalHTN.toFixed(8)} HTN</div>
          </div>

          ${
            !hasSufficientBalance
              ? `
          <div class="info-box critical">
            <div class="info-icon">⚠️</div>
            <div class="info-text">
              <strong>Insufficient balance!</strong><br>
              Available: ${balanceHTN.toFixed(8)} HTN<br>
              Required: ${totalHTN.toFixed(8)} HTN
            </div>
          </div>
          `
              : ''
          }

          <div class="tx-preview-warning">
            ⚠️ Please verify all details before approving
          </div>

          <div class="error" id="error"></div>

          <div class="dapp-actions">
            <button id="rejectBtn" class="btn btn-secondary">Reject</button>
            <button id="approveBtn" class="btn btn-primary" ${!hasSufficientBalance ? 'disabled' : ''}>
              Approve & Send
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Event listeners
  document.getElementById('rejectBtn')!.addEventListener('click', () => handleReject(onReject));

  if (hasSufficientBalance) {
    document.getElementById('approveBtn')!.addEventListener('click', () => handleApprove(onApprove));
  }
}

/**
 * Handle approve transaction
 */
async function handleApprove(onApprove: () => Promise<void>): Promise<void> {
  const errorEl = document.getElementById('error')!;
  const approveBtn = document.getElementById('approveBtn') as HTMLButtonElement;
  const rejectBtn = document.getElementById('rejectBtn') as HTMLButtonElement;

  try {
    approveBtn.disabled = true;
    rejectBtn.disabled = true;
    approveBtn.textContent = 'Sending...';

    await onApprove();
  } catch (error: any) {
    errorEl.textContent = error.message || 'Failed to approve transaction';
    approveBtn.disabled = false;
    rejectBtn.disabled = false;
    approveBtn.textContent = 'Approve & Send';
  }
}

/**
 * Handle reject transaction
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
    errorEl.textContent = error.message || 'Failed to reject transaction';
    approveBtn.disabled = false;
    rejectBtn.disabled = false;
    rejectBtn.textContent = 'Reject';
  }
}
