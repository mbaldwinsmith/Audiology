import { CareHomeSummary, PatientRow, ValidationError } from '../types/audiology';

/**
 * Client-Side PIN Security & Inactivity Utilities
 * Uses Web Crypto API (SHA-256, PBKDF2, AES-GCM 256-bit) for zero-retention encryption.
 */

const PIN_STORAGE_KEY = 'elitesight_audiology_pin_hash_v2';
const SALT_STORAGE_KEY = 'elitesight_audiology_pin_salt_v2';
const ATTEMPTS_STORAGE_KEY = 'elitesight_audiology_failed_attempts';
const ENCRYPTED_SESSION_KEY = 'elitesight_encrypted_session_v1';
const DEFAULT_PIN = '1397';
const DEFAULT_SALT = 'elitesight_salt_1397_clinical';
const MAX_FAILED_ATTEMPTS = 5;
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export interface EncryptedSessionPayload {
  summary: CareHomeSummary | null;
  patients: PatientRow[];
  errors: ValidationError[];
  warnings: ValidationError[];
  savedAt: number;
}

/**
 * Converts ArrayBuffer/Uint8Array to hex string
 */
function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Converts hex string to Uint8Array
 */
function hexToBuffer(hex: string): Uint8Array {
  const pairs = hex.match(/[\da-f]{2}/gi) || [];
  return new Uint8Array(pairs.map((h) => parseInt(h, 16)));
}

/**
 * Computes SHA-256 hash of PIN + salt
 */
export async function computeHash(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
}

/**
 * Initializes storage with default PIN if not set or migrating from previous default
 */
export async function initializePinStorage(): Promise<void> {
  const existingHash = localStorage.getItem(PIN_STORAGE_KEY);
  if (!existingHash) {
    const defaultHash = await computeHash(DEFAULT_PIN, DEFAULT_SALT);
    localStorage.setItem(PIN_STORAGE_KEY, defaultHash);
    localStorage.setItem(SALT_STORAGE_KEY, DEFAULT_SALT);
  }
}

/**
 * Verifies if entered PIN matches stored hash
 */
export async function verifyPin(enteredPin: string): Promise<{ success: boolean; remainingAttempts: number; isLockedOut: boolean }> {
  await initializePinStorage();

  const storedHash = localStorage.getItem(PIN_STORAGE_KEY) || '';
  const storedSalt = localStorage.getItem(SALT_STORAGE_KEY) || DEFAULT_SALT;
  const failedAttempts = parseInt(localStorage.getItem(ATTEMPTS_STORAGE_KEY) || '0', 10);

  if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
    return { success: false, remainingAttempts: 0, isLockedOut: true };
  }

  const enteredHash = await computeHash(enteredPin, storedSalt);

  if (enteredHash === storedHash) {
    // Reset failed attempts on success
    localStorage.setItem(ATTEMPTS_STORAGE_KEY, '0');
    return { success: true, remainingAttempts: MAX_FAILED_ATTEMPTS, isLockedOut: false };
  } else {
    const nextAttempts = failedAttempts + 1;
    localStorage.setItem(ATTEMPTS_STORAGE_KEY, nextAttempts.toString());
    const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - nextAttempts);
    return {
      success: false,
      remainingAttempts: remaining,
      isLockedOut: remaining === 0,
    };
  }
}

/**
 * Sets a new 4-digit PIN
 */
export async function updatePin(currentPin: string, newPin: string): Promise<{ success: boolean; message: string }> {
  if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
    return { success: false, message: 'New PIN must be exactly 4 digits.' };
  }

  const verification = await verifyPin(currentPin);
  if (!verification.success) {
    return { success: false, message: 'Current PIN is incorrect.' };
  }

  // Generate random salt for the new PIN
  const randomSalt = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const newHash = await computeHash(newPin, randomSalt);
  localStorage.setItem(PIN_STORAGE_KEY, newHash);
  localStorage.setItem(SALT_STORAGE_KEY, randomSalt);
  localStorage.setItem(ATTEMPTS_STORAGE_KEY, '0');

  return { success: true, message: 'PIN updated successfully.' };
}

/**
 * Resets failed attempts count (e.g. after full session wipe)
 */
export function resetFailedAttempts(): void {
  localStorage.setItem(ATTEMPTS_STORAGE_KEY, '0');
}

/**
 * Derives a 256-bit AES-GCM key from PIN + salt using PBKDF2 (100,000 iterations)
 */
async function deriveAesKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Checks if an encrypted session package exists in storage
 */
export function hasEncryptedSession(): boolean {
  return Boolean(
    sessionStorage.getItem(ENCRYPTED_SESSION_KEY) ||
    localStorage.getItem(ENCRYPTED_SESSION_KEY)
  );
}

/**
 * Encrypts current session data into browser storage using PIN-derived AES-256 key
 */
export async function encryptSessionData(payload: EncryptedSessionPayload, pin: string): Promise<void> {
  if (!pin || pin.length !== 4) return;

  try {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveAesKey(pin, salt);

    const encoder = new TextEncoder();
    const encodedData = encoder.encode(JSON.stringify(payload));

    const ciphertextBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      key,
      encodedData
    );

    const packageData = JSON.stringify({
      salt: bufferToHex(salt),
      iv: bufferToHex(iv),
      ciphertext: bufferToHex(ciphertextBuffer),
      savedAt: payload.savedAt,
    });

    sessionStorage.setItem(ENCRYPTED_SESSION_KEY, packageData);
    localStorage.setItem(ENCRYPTED_SESSION_KEY, packageData);
  } catch (err) {
    console.error('Failed to encrypt session:', err);
  }
}

/**
 * Decrypts saved session data using the entered PIN
 */
export async function decryptSessionData(pin: string): Promise<EncryptedSessionPayload | null> {
  const rawPackage =
    sessionStorage.getItem(ENCRYPTED_SESSION_KEY) ||
    localStorage.getItem(ENCRYPTED_SESSION_KEY);

  if (!rawPackage || !pin) return null;

  try {
    const { salt, iv, ciphertext } = JSON.parse(rawPackage);
    const saltBuffer = hexToBuffer(salt);
    const ivBuffer = hexToBuffer(iv);
    const ciphertextBuffer = hexToBuffer(ciphertext);

    const key = await deriveAesKey(pin, saltBuffer);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBuffer as unknown as BufferSource },
      key,
      ciphertextBuffer as unknown as BufferSource
    );

    const decoder = new TextDecoder();
    const jsonString = decoder.decode(decryptedBuffer);
    return JSON.parse(jsonString) as EncryptedSessionPayload;
  } catch (err) {
    // Decryption failed (e.g. incorrect PIN or corrupted data)
    return null;
  }
}

/**
 * Purges encrypted session from all browser storage (GDPR Zero-Retention)
 */
export function clearEncryptedSession(): void {
  sessionStorage.removeItem(ENCRYPTED_SESSION_KEY);
  localStorage.removeItem(ENCRYPTED_SESSION_KEY);
}

export { INACTIVITY_TIMEOUT_MS, MAX_FAILED_ATTEMPTS, DEFAULT_PIN };

