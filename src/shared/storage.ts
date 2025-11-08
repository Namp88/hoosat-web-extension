// Chrome storage utilities

import { WalletData, StoredWallet, ConnectedSite, TransactionHistory, ConsolidationSettings, DEFAULT_CONSOLIDATION_THRESHOLD, AutoLockSettings, DEFAULT_AUTO_LOCK_TIMEOUT } from './types';

const STORAGE_KEYS = {
  WALLET: 'hoosat_wallet',
  CONNECTED_SITES: 'hoosat_connected_sites',
  SETTINGS: 'hoosat_settings',
  TX_HISTORY: 'hoosat_tx_history',
  CONSOLIDATION: 'hoosat_consolidation',
  AUTO_LOCK: 'hoosat_auto_lock',
} as const;

// Maximum number of transactions to store
const MAX_TX_HISTORY = 50;

/**
 * Save wallet data to chrome storage
 */
export async function saveWallet(walletData: StoredWallet): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [STORAGE_KEYS.WALLET]: walletData }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Load wallet data from chrome storage
 */
export async function loadWallet(): Promise<StoredWallet | null> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(STORAGE_KEYS.WALLET, result => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result[STORAGE_KEYS.WALLET] || null);
      }
    });
  });
}

/**
 * Check if wallet exists
 */
export async function hasWallet(): Promise<boolean> {
  const wallet = await loadWallet();
  return wallet !== null && wallet.wallets.length > 0;
}

/**
 * Get current wallet
 */
export async function getCurrentWallet(): Promise<WalletData | null> {
  const storedWallet = await loadWallet();

  if (!storedWallet || storedWallet.wallets.length === 0) {
    return null;
  }

  return storedWallet.wallets[storedWallet.currentWalletIndex];
}

/**
 * Add new wallet to storage
 */
export async function addWallet(walletData: WalletData): Promise<void> {
  let storedWallet = await loadWallet();

  if (!storedWallet) {
    storedWallet = {
      wallets: [],
      currentWalletIndex: 0,
    };
  }

  storedWallet.wallets.push(walletData);
  storedWallet.currentWalletIndex = storedWallet.wallets.length - 1;

  await saveWallet(storedWallet);
}

/**
 * Switch to different wallet
 */
export async function switchWallet(index: number): Promise<void> {
  const storedWallet = await loadWallet();

  if (!storedWallet || index >= storedWallet.wallets.length) {
    throw new Error('Invalid wallet index');
  }

  storedWallet.currentWalletIndex = index;
  await saveWallet(storedWallet);
}

/**
 * Delete wallet from storage
 */
export async function deleteWallet(index: number): Promise<void> {
  const storedWallet = await loadWallet();

  if (!storedWallet || index >= storedWallet.wallets.length) {
    throw new Error('Invalid wallet index');
  }

  storedWallet.wallets.splice(index, 1);

  if (storedWallet.currentWalletIndex >= storedWallet.wallets.length) {
    storedWallet.currentWalletIndex = Math.max(0, storedWallet.wallets.length - 1);
  }

  await saveWallet(storedWallet);
}

/**
 * Save connected sites
 */
export async function saveConnectedSites(sites: ConnectedSite[]): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [STORAGE_KEYS.CONNECTED_SITES]: sites }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Load connected sites
 */
export async function loadConnectedSites(): Promise<ConnectedSite[]> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(STORAGE_KEYS.CONNECTED_SITES, result => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        const sites = result[STORAGE_KEYS.CONNECTED_SITES] || [];

        // Remove duplicates by origin (keep the first occurrence)
        const uniqueSites = sites.filter((site: ConnectedSite, index: number, self: ConnectedSite[]) =>
          self.findIndex(s => s.origin === site.origin) === index
        );

        // If duplicates were found, save the cleaned list
        if (uniqueSites.length !== sites.length) {
          console.log(`🧹 Cleaned up ${sites.length - uniqueSites.length} duplicate connected site(s)`);
          saveConnectedSites(uniqueSites).catch(err => console.error('Failed to save cleaned sites:', err));
        }

        resolve(uniqueSites);
      }
    });
  });
}

/**
 * Check if origin is connected
 */
export async function isOriginConnected(origin: string): Promise<boolean> {
  const sites = await loadConnectedSites();
  return sites.some(site => site.origin === origin);
}

/**
 * Add connected site
 */
export async function addConnectedSite(origin: string): Promise<void> {
  const sites = await loadConnectedSites();

  if (!sites.some(site => site.origin === origin)) {
    sites.push({
      origin,
      connectedAt: Date.now(),
      permissions: ['read'],
    });
    await saveConnectedSites(sites);
  }
}

/**
 * Remove connected site
 */
export async function removeConnectedSite(origin: string): Promise<void> {
  const sites = await loadConnectedSites();
  const filtered = sites.filter(site => site.origin !== origin);
  await saveConnectedSites(filtered);
}

/**
 * Save transaction to history
 */
export async function saveTransactionToHistory(tx: TransactionHistory): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(STORAGE_KEYS.TX_HISTORY, result => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }

      const history: TransactionHistory[] = result[STORAGE_KEYS.TX_HISTORY] || [];

      // Check if transaction already exists (prevent duplicates)
      const exists = history.some(t => t.txId === tx.txId);
      if (exists) {
        console.log('⚠️ Transaction already in history:', tx.txId);
        resolve();
        return;
      }

      // Add new transaction at the beginning
      history.unshift(tx);

      // Keep only the last MAX_TX_HISTORY transactions
      const trimmedHistory = history.slice(0, MAX_TX_HISTORY);

      chrome.storage.local.set({ [STORAGE_KEYS.TX_HISTORY]: trimmedHistory }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  });
}

/**
 * Load transaction history
 */
export async function loadTransactionHistory(): Promise<TransactionHistory[]> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(STORAGE_KEYS.TX_HISTORY, result => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result[STORAGE_KEYS.TX_HISTORY] || []);
      }
    });
  });
}

/**
 * Get consolidation settings
 */
export async function getConsolidationSettings(): Promise<ConsolidationSettings> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(STORAGE_KEYS.CONSOLIDATION, result => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        const defaultSettings: ConsolidationSettings = {
          hasSeenModal: false,
          autoConsolidate: false,
          threshold: DEFAULT_CONSOLIDATION_THRESHOLD,
        };
        resolve(result[STORAGE_KEYS.CONSOLIDATION] || defaultSettings);
      }
    });
  });
}

/**
 * Save consolidation settings
 */
export async function saveConsolidationSettings(settings: ConsolidationSettings): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [STORAGE_KEYS.CONSOLIDATION]: settings }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Mark consolidation modal as seen
 */
export async function markConsolidationModalSeen(): Promise<void> {
  const settings = await getConsolidationSettings();
  settings.hasSeenModal = true;
  await saveConsolidationSettings(settings);
}

/**
 * Get auto-lock settings
 */
export async function getAutoLockSettings(): Promise<AutoLockSettings> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(STORAGE_KEYS.AUTO_LOCK, result => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        const defaultSettings: AutoLockSettings = {
          timeoutMinutes: DEFAULT_AUTO_LOCK_TIMEOUT,
        };
        resolve(result[STORAGE_KEYS.AUTO_LOCK] || defaultSettings);
      }
    });
  });
}

/**
 * Save auto-lock settings
 */
export async function saveAutoLockSettings(settings: AutoLockSettings): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [STORAGE_KEYS.AUTO_LOCK]: settings }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Clear all data (for reset/logout)
 */
export async function clearAllData(): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.clear(() => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}
