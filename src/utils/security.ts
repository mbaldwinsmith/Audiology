/**
 * Client-Side PIN Security & Inactivity Utilities
 * Uses Web Crypto API (SHA-256) for secure PIN hashing.
 */

const PIN_STORAGE_KEY = 'elitesight_audiology_pin_hash_v2';
const SALT_STORAGE_KEY = 'elitesight_audiology_pin_salt_v2';
const ATTEMPTS_STORAGE_KEY = 'elitesight_audiology_failed_attempts';
const DEFAULT_PIN = '1397';
const DEFAULT_SALT = 'elitesight_salt_1397_clinical';
const MAX_FAILED_ATTEMPTS = 5;
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Computes SHA-256 hash of PIN + salt
 */
export async function computeHash(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
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

export { INACTIVITY_TIMEOUT_MS, MAX_FAILED_ATTEMPTS, DEFAULT_PIN };
