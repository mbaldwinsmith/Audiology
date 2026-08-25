import { CareHomeSummary, PatientRow } from '../types/audiology';

/**
 * Recomputes CareHomeSummary statistics based on an updated list of patients.
 */
export function recalculateSummary(
  patients: PatientRow[],
  baseSummary: CareHomeSummary | null
): CareHomeSummary | null {
  if (patients.length === 0) {
    return null;
  }

  const seenPatients = patients.filter((p) => p.seen);
  const unseenPatients = patients.filter((p) => !p.seen);

  const totalRevenue = seenPatients.reduce((sum, p) => sum + p.totalAmount, 0);
  const screeningsCount = seenPatients.filter((p) => p.screening).length;
  const audiogramsCount = seenPatients.filter((p) => p.audiogram).length;
  const waxRemovalCount = seenPatients.filter((p) => p.hasEarWax).length;

  const firstPatient = patients[0];

  return {
    careHome: baseSummary?.careHome || firstPatient.careHome || 'Care Home',
    postCode: baseSummary?.postCode || firstPatient.postCode || '',
    appointmentDate: baseSummary?.appointmentDate || firstPatient.appointmentDate || '',
    audiologist: baseSummary?.audiologist || firstPatient.audiologist || 'Audiologist',
    totalPatients: patients.length,
    seenPatientsCount: seenPatients.length,
    unseenPatientsCount: unseenPatients.length,
    totalRevenue,
    screeningsCount,
    audiogramsCount,
    waxRemovalCount,
    seenPatients,
    unseenPatients,
  };
}
