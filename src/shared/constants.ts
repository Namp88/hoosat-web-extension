// Application constants

export const APP_NAME = 'Hoosat Wallet';
export const APP_VERSION = '0.2.1';

// Node configuration
export const DEFAULT_NODE_URL = 'http://54.38.176.95:42420'; // Replace with your node
export const TESTNET_NODE_URL = 'http://testnet.hoosat.fi:42420'; // If available

// Network types
export const NETWORKS = {
  MAINNET: 'mainnet',
  TESTNET: 'testnet',
} as const;

export type Network = (typeof NETWORKS)[keyof typeof NETWORKS];

// Default network
export const DEFAULT_NETWORK: Network = NETWORKS.MAINNET;

// Transaction settings
export const DEFAULT_FEE = 100; // sompi
export const MIN_FEE = 50; // sompi

// Address validation
export const MAINNET_PREFIX = 'hoosat:';
export const TESTNET_PREFIX = 'hoosattest:';

// UI constants
export const POPUP_WIDTH = 360;
export const POPUP_HEIGHT = 600;

// Timeout for requests
export const REQUEST_TIMEOUT = 30000; // 30 seconds

// Storage keys (internal)
export const STORAGE_VERSION = '1.0';

// Decimals for display
export const DISPLAY_DECIMALS = 8;

// Unit conversion
export const SOMPI_PER_HTN = 100000000; // 1 HTN = 100,000,000 sompi

// Session timeout (auto-lock after 30 minutes of inactivity)
export const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// Grace period - time after closing popup when password is not required again
export const GRACE_PERIOD = 2 * 60 * 1000; // 2 minutes

// Validation
export const MIN_PASSWORD_LENGTH = 8;
export const ADDRESS_MIN_LENGTH = 10;

// Explorer URLs
export const MAINNET_EXPLORER = 'https://explorer.hoosat.fi';
export const TESTNET_EXPLORER = 'https://testnet-explorer.hoosat.fi';

export function getExplorerUrl(network: Network): string {
  return network === NETWORKS.MAINNET ? MAINNET_EXPLORER : TESTNET_EXPLORER;
}

export function getExplorerTxUrl(network: Network, txId: string): string {
  return `${getExplorerUrl(network)}/txs/${txId}`;
}

export function getExplorerAddressUrl(network: Network, address: string): string {
  return `${getExplorerUrl(network)}/addresses/${address}`;
}
