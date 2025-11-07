import { ICONS } from '../utils/icons';
import { SOMPI_PER_HTN } from '../../shared/constants';
import { showTransactionPreview } from '../components/transaction-preview';
import { getCurrentBalance } from './wallet';
import { HoosatUtils } from 'hoosat-sdk-web';
import { t, tn } from '../utils/i18n';

/**
 * Show send transaction screen
 */
export function showSendScreen(
  app: HTMLElement,
  balance: string,
  onBack: () => void,
  onSuccess: (txId: string) => Promise<void>
): void {
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
          <button id="backBtn" class="create-import-back-btn">${ICONS.back}</button>
          <div class="create-import-header-title">
            <img src="icons/icon48.png" class="create-import-header-icon" alt="Hoosat" />
            <h1>${t('sendHTN')}</h1>
          </div>
          <div style="width: 32px;"></div>
        </div>

        <!-- Content -->
        <div class="create-import-content">
          <!-- Info Box with Balance -->
          <div class="hero-info-box">
            <div class="hero-info-box-icon">${ICONS.wallet}</div>
            <div>
              <strong>${t('available')}</strong><br>
              ${HoosatUtils.sompiToAmount(balance)} HTN
            </div>
          </div>

          <!-- Form Card -->
          <div class="create-import-card">
            <div class="create-import-form-group">
              <label for="recipient">${t('recipientAddress')}</label>
              <input type="text" id="recipient" placeholder="hoosat:..." autocomplete="off" />
            </div>

            <div class="create-import-form-group">
              <label for="amount">${t('amount')}</label>
              <input type="number" id="amount" step="0.00000001" placeholder="0.00" autocomplete="off" />
            </div>

            <div class="create-import-error" id="error"></div>

            <button id="sendBtn" class="btn btn-primary create-import-submit-btn">${t('sendTransaction')}</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('backBtn')!.addEventListener('click', onBack);
  document.getElementById('sendBtn')!.addEventListener('click', () => handleSendTransaction(balance, onSuccess));
}

/**
 * Handle send transaction
 */
async function handleSendTransaction(balance: string, onSuccess: (txId: string) => Promise<void>): Promise<void> {
  const recipient = (document.getElementById('recipient') as HTMLInputElement).value.trim();
  const amount = (document.getElementById('amount') as HTMLInputElement).value;
  const errorEl = document.getElementById('error')!;

  errorEl.innerHTML = '';

  // Validation
  if (!recipient || !amount) {
    errorEl.innerHTML = `${ICONS.warning} ${t('recipientAndAmountRequired')}`;
    return;
  }

  if (!recipient.startsWith('hoosat:')) {
    errorEl.innerHTML = `${ICONS.warning} ${t('invalidAddressFormat')}`;
    return;
  }

  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    errorEl.innerHTML = `${ICONS.warning} ${t('invalidAmount')}`;
    return;
  }

  try {
    // Show loading state
    const sendBtn = document.getElementById('sendBtn') as HTMLButtonElement;
    const originalText = sendBtn.textContent;
    sendBtn.disabled = true;
    sendBtn.textContent = t('estimatingFee');

    // Get real fee estimate from background
    const feeEstimateResponse = await chrome.runtime.sendMessage({
      type: 'ESTIMATE_FEE',
      data: {
        to: recipient,
        amount: amountNum,
      },
    });

    if (!feeEstimateResponse.success) {
      throw new Error(feeEstimateResponse.error);
    }

    const feeEstimate = feeEstimateResponse.data;
    const minFeeSompi = BigInt(feeEstimate.fee);
    const minFeeHTN = parseFloat(feeEstimate.fee) / SOMPI_PER_HTN;

    console.log('💵 Minimum fee estimate:', {
      fee: feeEstimate.fee + ' sompi',
      feeHTN: minFeeHTN.toFixed(8) + ' HTN',
      inputs: feeEstimate.inputs,
      outputs: feeEstimate.outputs,
    });

    // Re-enable button
    sendBtn.disabled = false;
    sendBtn.textContent = originalText;

    // Check if amount exceeds balance
    const balanceSompi = BigInt(balance);
    const amountSompi = BigInt(Math.floor(amountNum * SOMPI_PER_HTN));
    const totalRequired = amountSompi + minFeeSompi;

    if (totalRequired > balanceSompi) {
      const total = (parseFloat(totalRequired.toString()) / SOMPI_PER_HTN).toFixed(8);
      const fee = minFeeHTN.toFixed(8);
      errorEl.innerHTML = `${ICONS.warning} ${tn('insufficientBalance', total, fee)}`;
      return;
    }

    // Show transaction preview with option to edit fee
    const result = await showTransactionPreview({
      to: recipient,
      amount: amountNum,
      minFee: minFeeHTN,
      minFeeSompi: feeEstimate.fee,
      balance: balance, // Pass balance in sompi
      inputs: feeEstimate.inputs,
      outputs: feeEstimate.outputs,
    });

    if (!result.confirmed) {
      return; // User cancelled
    }

    // Disable button during sending
    sendBtn.disabled = true;
    sendBtn.textContent = t('sending');

    // Use custom fee if provided, otherwise use minimum
    const finalFeeSompi = result.customFeeSompi || feeEstimate.fee;

    const response = await chrome.runtime.sendMessage({
      type: 'SEND_TRANSACTION',
      data: {
        to: recipient,
        amount: amountNum,
        fee: finalFeeSompi,
      },
    });

    if (!response.success) {
      throw new Error(response.error);
    }

    // Wait a bit for background to save the transaction
    await new Promise(resolve => setTimeout(resolve, 100));

    // Notify success
    await onSuccess(response.data);
  } catch (error: any) {
    errorEl.innerHTML = `${ICONS.error} ${error.message || t('transactionFailed')}`;
    // Re-enable button
    const sendBtn = document.getElementById('sendBtn') as HTMLButtonElement;
    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.textContent = t('sendTransaction');
    }
  }
}
