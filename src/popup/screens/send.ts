import { APP_NAME } from '../../shared/constants';
import { showTransactionPreview } from '../components/transaction-preview';
import { getCurrentBalance } from './wallet';
import { HoosatUtils } from 'hoosat-sdk-web';

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
    <div class="screen">
      <div class="header">
        <button id="backBtn" class="btn-icon">←</button>
        <div class="header-center">
          <img src="icons/icon48.png" class="header-icon" alt="Hoosat" />
          <h1>Send HTN</h1>
        </div>
        <div style="width: 32px;"></div>
      </div>

      <div class="content">
        <div class="form">
          <div class="form-group">
            <label for="recipient">Recipient Address</label>
            <input type="text" id="recipient" placeholder="hoosat:..." />
          </div>

          <div class="form-group">
            <label for="amount">Amount (HTN)</label>
            <input type="number" id="amount" step="0.00000001" placeholder="0.00" />
          </div>

          <div class="balance-info">
            Available: ${HoosatUtils.sompiToAmount(balance)} HTN
          </div>

          <div class="error" id="error"></div>

          <button id="sendBtn" class="btn btn-primary">Send Transaction</button>
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

  errorEl.textContent = '';

  // Validation
  if (!recipient || !amount) {
    errorEl.textContent = 'Recipient and amount are required';
    return;
  }

  if (!recipient.startsWith('hoosat:')) {
    errorEl.textContent = 'Invalid address format. Must start with "hoosat:"';
    return;
  }

  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    errorEl.textContent = 'Invalid amount';
    return;
  }

  try {
    // Show loading state
    const sendBtn = document.getElementById('sendBtn') as HTMLButtonElement;
    const originalText = sendBtn.textContent;
    sendBtn.disabled = true;
    sendBtn.textContent = 'Estimating fee...';

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
    const minFeeHTN = parseFloat(feeEstimate.fee) / 100000000;

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
    const amountSompi = BigInt(Math.floor(amountNum * 100000000));
    const totalRequired = amountSompi + minFeeSompi;

    if (totalRequired > balanceSompi) {
      errorEl.textContent = `Insufficient balance. Need ${(parseFloat(totalRequired.toString()) / 100000000).toFixed(8)} HTN (including ${minFeeHTN.toFixed(8)} HTN fee)`;
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
    sendBtn.textContent = 'Sending...';

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
    errorEl.textContent = error.message || 'Transaction failed';
    // Re-enable button
    const sendBtn = document.getElementById('sendBtn') as HTMLButtonElement;
    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.textContent = 'Send Transaction';
    }
  }
}
