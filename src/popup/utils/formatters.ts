import { SOMPI_PER_HTN } from '../../shared/constants';
import { ICONS } from '../utils/icons';

/**
 * Format address for display (shorten)
 */
export function formatAddress(address: string): string {
  if (!address) return '';
  if (address.length <= 20) return address;
  return `${address.substring(0, 12)}...${address.substring(address.length - 8)}`;
}

/**
 * Format timestamp to relative time
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

/**
 * Validate amount input
 */
export function validateAmount(amount: string, balance: string): { valid: boolean; error?: string } {
  if (!amount) {
    return { valid: false, error: 'Amount is required' };
  }

  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    return { valid: false, error: 'Invalid amount' };
  }

  const balanceHTN = parseFloat(balance) / SOMPI_PER_HTN;
  if (amountNum > balanceHTN) {
    return { valid: false, error: 'Insufficient balance' };
  }

  return { valid: true };
}
