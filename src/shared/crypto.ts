// Crypto utilities for secure key storage

import CryptoJS from 'crypto-js';

/**
 * Encrypt private key with password using AES-256
 */
export function encryptPrivateKey(privateKey: string, password: string): string {
  if (!privateKey || !password) {
    throw new Error('Private key and password are required');
  }

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  // Use AES-256 encryption
  const encrypted = CryptoJS.AES.encrypt(privateKey, password).toString();
  return encrypted;
}

/**
 * Decrypt private key with password
 */
export function decryptPrivateKey(encryptedKey: string, password: string): string {
  if (!encryptedKey || !password) {
    throw new Error('Encrypted key and password are required');
  }

  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedKey, password);
    const privateKey = decrypted.toString(CryptoJS.enc.Utf8);

    if (!privateKey) {
      throw new Error('Invalid password');
    }

    return privateKey;
  } catch (error) {
    throw new Error('Failed to decrypt: Invalid password');
  }
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }

  return { valid: true };
}

/**
 * Generate random salt for additional security
 */
export function generateSalt(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash password with salt using SHA-256
 */
export function hashPassword(password: string, salt: string): string {
  return CryptoJS.SHA256(password + salt).toString();
}
