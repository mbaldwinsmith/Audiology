/**
 * Converts a string to Title Case, correctly handling hyphens, apostrophes, and spaces.
 * Example: "MELANIE DUDMAN" -> "Melanie Dudman", "o'connor" -> "O'Connor", "smith-jones" -> "Smith-Jones"
 */
export function toTitleCase(input?: string | null): string {
  if (!input) return '';
  const trimmed = input.trim();
  if (!trimmed) return '';

  return trimmed
    .toLowerCase()
    .replace(/(?:^|[\s\-\'\’])\w/g, (match) => match.toUpperCase())
    .replace(/\b(Llc|Ltd|Uk|Gb|Nhs)\b/gi, (match) => match.toUpperCase());
}

/**
 * Normalizes input date strings into DD/MM/YYYY format.
 * Supports ISO (YYYY-MM-DD), UK (DD/MM/YYYY, DD-MM-YYYY), US (MM/DD/YYYY if unambiguous), and timestamp strings.
 */
export function normalizeDate(dateInput?: string | null): string {
  if (!dateInput) return '';
  const str = dateInput.trim();
  if (!str) return '';

  // Case 1: Already DD/MM/YYYY or DD-MM-YYYY
  const ukMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (ukMatch) {
    const day = ukMatch[1].padStart(2, '0');
    const month = ukMatch[2].padStart(2, '0');
    const year = ukMatch[3];
    return `${day}/${month}/${year}`;
  }

  // Case 2: ISO format YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = isoMatch[2].padStart(2, '0');
    const day = isoMatch[3].padStart(2, '0');
    return `${day}/${month}/${year}`;
  }

  // Case 3: Try parsing with JS Date
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = String(parsed.getFullYear());
    return `${day}/${month}/${year}`;
  }

  return str;
}

/**
 * Standard system placeholder date of birth used for internal code integrity when DOB is missing.
 */
export const PLACEHOLDER_DOB = '01/01/1906';

/**
 * Checks if a given date of birth is the system placeholder or blank.
 */
export function isPlaceholderDob(dob?: string | null): boolean {
  if (!dob) return true;
  const clean = dob.trim();
  return clean === '01/01/1906' || clean === '1906-01-01' || clean === '01011906';
}

/**
 * Formats a date of birth for UI and document display.
 * Returns blank empty string if the DOB is the system placeholder (01/01/1906) or missing.
 */
export function formatDobDisplay(dob?: string | null): string {
  if (!dob || isPlaceholderDob(dob)) return '';
  return dob;
}

/**
 * Adds a number of days to a DD/MM/YYYY date string and returns the new date in DD/MM/YYYY format.
 */
export function addDaysToDate(dateStr: string, days: number): string {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed
    const year = parseInt(parts[2], 10);

    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      d.setDate(d.getDate() + days);
      const resDay = String(d.getDate()).padStart(2, '0');
      const resMonth = String(d.getMonth() + 1).padStart(2, '0');
      const resYear = String(d.getFullYear());
      return `${resDay}/${resMonth}/${resYear}`;
    }
  }
  return dateStr;
}

/**
 * Normalizes boolean values from string inputs like 'Yes', 'No', 'Y', 'N', 'true', 'false', '1', '0'
 */
export function parseBoolean(value?: string | boolean | number | null): boolean {
  if (value === true || value === 1) return true;
  if (value === false || value === 0 || value === null || value === undefined) return false;

  const str = String(value).trim().toLowerCase();
  if (['yes', 'y', 'true', '1', 't', 'positive', 'seen'].includes(str)) {
    return true;
  }
  return false;
}

import { EarWaxLevel } from '../types/audiology';

/**
 * Normalizes ear wax level from string, number, or boolean inputs:
 * 0 = Clear
 * 1 = Minor
 * 2 = Moderate
 * 3 = Severe
 */
export function parseEarWaxLevel(value?: string | boolean | number | null): EarWaxLevel {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') {
    if (value <= 0) return 0;
    if (value === 1) return 1;
    if (value === 2) return 2;
    return 3;
  }
  if (typeof value === 'boolean') {
    return value ? 2 : 0;
  }

  const str = String(value).trim().toLowerCase();
  if (!str || ['0', 'clear', 'no', 'n', 'false', 'none', 'clean', 'nil', 'healthy'].includes(str)) {
    return 0;
  }
  if (['1', 'minor', 'mild', 'slight', 'low'].includes(str)) {
    return 1;
  }
  if (['2', 'moderate', 'mod', 'medium', 'yes', 'y', 'true', 'seen', 'positive'].includes(str)) {
    return 2;
  }
  if (['3', 'severe', 'heavy', 'impacted', 'occluded', 'full', 'high'].includes(str)) {
    return 3;
  }

  const parsed = parseInt(str, 10);
  if (!isNaN(parsed)) {
    if (parsed <= 0) return 0;
    if (parsed === 1) return 1;
    if (parsed === 2) return 2;
    return 3;
  }

  return 0;
}

