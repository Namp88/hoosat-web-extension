// Chrome storage utilities

import { WalletData, StoredWallet, ConnectedSite } from './types';

const STORAGE_KEYS = {
  WALLET: 'hoosat_wallet',
  CONNECTED_SITES: 'hoosat_connected_sites',
  SETTINGS: 'hoosat_settings',
} as const;

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
        resolve(result[STORAGE_KEYS.CONNECTED_SITES] || []);
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
