import { APP_NAME, getExplorerTxUrl, getExplorerAddressUrl } from '../../shared/constants';
import { getCurrentWallet, loadTransactionHistory } from '../../shared/storage';
import { TransactionHistory } from '../../shared/types';
import { formatAddress, formatTime } from '../utils';
import { HoosatUtils } from 'hoosat-sdk-web';

let currentAddress: string | null = null;
let balance: string = '0';

/**
 * Show main wallet screen with balance and transactions
 */
export async function showWalletScreen(
  app: HTMLElement,
  onSend: () => void,
  onReceive: () => void,
  onLock: () => void,
  onSettings: () => void
): Promise<void> {
  const wallet = await getCurrentWallet();

  if (!wallet) {
    throw new Error('No wallet found');
  }

  currentAddress = wallet.address;

  // Get balance
  await updateBalance();

  // Load transaction history
  const txHistory = await loadTransactionHistory();

  app.innerHTML = `
    <div class="screen">
      <div class="header">
        <div class="header-left">
          <img src="icons/icon48.png" class="header-icon" alt="Hoosat" />
          <h1>${APP_NAME}</h1>
        </div>
        <div class="header-right">
          <button id="lockBtn" class="btn-icon" title="Lock Wallet">🔒</button>
          <button id="settingsBtn" class="btn-icon" title="Settings">⚙️</button>
        </div>
      </div>

      <div class="content">
        <div class="wallet-info">
          <div class="address">
            <label>Address</label>
            <div class="address-row">
              <div class="address-value" id="address">${formatAddress(currentAddress)}</div>
              <button id="copyBtn" class="btn-icon">📋</button>
            </div>
          </div>

          <div class="balance">
            <label>Balance</label>
            <div class="balance-row">
              <div class="balance-value" id="balance">${HoosatUtils.sompiToAmount(balance)} HTN</div>
              <button id="refreshBtn" class="btn-icon">🔄</button>
            </div>
          </div>
        </div>

        <div class="actions">
          <button id="sendBtn" class="btn btn-primary">Send</button>
          <button id="receiveBtn" class="btn btn-secondary">Receive</button>
        </div>

        <div class="transactions">
          <h3>Recent Transactions</h3>
          <div class="tx-list" id="txList">
            ${txHistory.length > 0 ? renderTransactions(txHistory.slice(0, 10)) : '<p class="empty">No transactions yet</p>'}
          </div>
          ${txHistory.length > 0 ? `<button id="viewHistoryBtn" class="btn-link">View Full History in Explorer →</button>` : ''}
        </div>
      </div>
    </div>
  `;

  // Event listeners
  document.getElementById('copyBtn')!.addEventListener('click', copyAddress);
  document.getElementById('refreshBtn')!.addEventListener('click', updateBalance);
  document.getElementById('sendBtn')!.addEventListener('click', onSend);
  document.getElementById('receiveBtn')!.addEventListener('click', onReceive);
  document.getElementById('lockBtn')!.addEventListener('click', onLock);
  document.getElementById('settingsBtn')!.addEventListener('click', onSettings);

  if (txHistory.length > 0) {
    document.getElementById('viewHistoryBtn')!.addEventListener('click', () => {
      window.open(getExplorerAddressUrl('mainnet', currentAddress!), '_blank');
    });

    // Add click listeners to each transaction
    document.querySelectorAll('.tx-item').forEach((item, index) => {
      item.addEventListener('click', () => {
        window.open(getExplorerTxUrl('mainnet', txHistory[index].txId), '_blank');
      });
    });
  }
}

/**
 * Render transaction list
 */
function renderTransactions(transactions: TransactionHistory[]): string {
  return transactions
    .map(
      tx => `
    <div class="tx-item" data-txid="${tx.txId}">
      <div class="tx-icon">${tx.type === 'sent' ? '📤' : '📥'}</div>
      <div class="tx-details">
        <div class="tx-type">${tx.type === 'sent' ? 'Sent' : 'Received'}</div>
        <div class="tx-address">${tx.type === 'sent' ? 'To: ' + formatAddress(tx.to!) : 'From: ' + formatAddress(tx.from || 'Unknown')}</div>
        <div class="tx-time">${formatTime(tx.timestamp)}</div>
      </div>
      <div class="tx-amount ${tx.type === 'sent' ? 'negative' : 'positive'}">
        ${tx.type === 'sent' ? '-' : '+'}${HoosatUtils.sompiToAmount(tx.amount)} HTN
      </div>
    </div>
  `
    )
    .join('');
}

/**
 * Update balance
 */
async function updateBalance(): Promise<void> {
  if (!currentAddress) return;

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_BALANCE',
      data: { address: currentAddress },
    });

    if (response.success) {
      balance = response.data;
      const balanceEl = document.getElementById('balance');
      if (balanceEl) {
        balanceEl.textContent = `${HoosatUtils.sompiToAmount(balance)} HTN`;
      }
    }
  } catch (error) {
    console.error('Failed to update balance:', error);
  }
}

/**
 * Copy address to clipboard
 */
function copyAddress(): void {
  if (!currentAddress) return;

  navigator.clipboard.writeText(currentAddress).then(() => {
    const btn = document.getElementById('copyBtn')!;
    btn.textContent = '✓';
    setTimeout(() => {
      btn.textContent = '📋';
    }, 1000);
  });
}

/**
 * Get current balance
 */
export function getCurrentBalance(): string {
  return balance;
}

/**
 * Get current address
 */
export function getCurrentAddress(): string | null {
  return currentAddress;
}

/**
 * Initialize wallet data (load address and balance) without showing UI
 * Useful when we need wallet data but want to show a different screen
 */
export async function initWalletData(): Promise<void> {
  const wallet = await getCurrentWallet();

  if (!wallet) {
    throw new Error('No wallet found');
  }

  currentAddress = wallet.address;

  // Get balance
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_BALANCE',
      data: { address: currentAddress },
    });

    if (response.success) {
      balance = response.data;
    }
  } catch (error) {
    console.error('Failed to load balance:', error);
  }
}
