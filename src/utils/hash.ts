/**
 * Derives uppercase initials from a Care Home name.
 * e.g., "Colne View Care Home" -> "CV", "Oakfield House" -> "OH", "Sunrise Senior Living" -> "SSL"
 */
export function getCareHomeInitials(careHomeName: string): string {
  if (!careHomeName) return 'CH';

  // Remove common generic suffix words if there are other distinguishing words
  const words = careHomeName
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);

  const significantWords = words.filter(
    (w) => !['the', 'and', '&', 'of', 'for', 'in', 'at'].includes(w.toLowerCase())
  );

  const targetWords = significantWords.length > 0 ? significantWords : words;

  // Filter out 'Care' and 'Home' if we still have at least 2 words
  let filtered = targetWords;
  if (targetWords.length > 2) {
    const withoutGeneric = targetWords.filter(
      (w) => !['care', 'home', 'house', 'lodge', 'court', 'manor'].includes(w.toLowerCase())
    );
    if (withoutGeneric.length >= 2) {
      filtered = withoutGeneric;
    }
  }

  const initials = filtered.map((w) => w[0].toUpperCase()).join('');
  return initials.slice(0, 4) || 'CH';
}

/**
 * Derives patient initials from first and surname.
 * e.g., "Melanie", "Dudman" -> "MD"
 */
export function getPatientInitials(firstName: string, surname: string): string {
  const f = (firstName.trim()[0] || 'P').toUpperCase();
  const s = (surname.trim()[0] || 'X').toUpperCase();
  return `${f}${s}`;
}

/**
 * Extracts a compact DOB string (e.g., "30/12/1945" -> "3012").
 */
export function getCompactDob(dob: string): string {
  const digitsOnly = dob.replace(/\D/g, '');
  if (digitsOnly.length >= 4) {
    return digitsOnly.slice(0, 4); // DDMM
  }
  return digitsOnly || '0101';
}

/**
 * Simple deterministic hash for salt / checksum.
 */
export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36).toUpperCase().slice(0, 4);
}

/**
 * Generates deterministic Report Reference.
 * Format: {CareHomeInitials}-{PatientInitials}{DOB_compact}-{RefSuffix}
 * e.g., "CV-MD3012-A1"
 */
export function generateReportRef(
  careHome: string,
  firstName: string,
  surname: string,
  dob: string,
  rowIndex: number = 1
): string {
  const chInitials = getCareHomeInitials(careHome);
  const pInitials = getPatientInitials(firstName, surname);
  const compactDob = getCompactDob(dob);
  const suffix = `A${rowIndex}`;

  return `${chInitials}-${pInitials}${compactDob}-${suffix}`;
}

/**
 * Generates deterministic Invoice Number.
 * Format: {CareHomeInitials}-{PatientInitials}{DOB_compact}-INV{Suffix}
 * e.g., "CV-MD3012-INV1"
 */
export function generateInvoiceNo(
  careHome: string,
  firstName: string,
  surname: string,
  dob: string,
  rowIndex: number = 1
): string {
  const chInitials = getCareHomeInitials(careHome);
  const pInitials = getPatientInitials(firstName, surname);
  const compactDob = getCompactDob(dob);
  const suffix = `INV${rowIndex}`;

  return `${chInitials}-${pInitials}${compactDob}-${suffix}`;
}
