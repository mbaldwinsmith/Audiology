import Papa from 'papaparse';
import {
  RawCsvRow,
  PatientRow,
  CareHomeSummary,
  ValidationError,
  ParseResult,
} from '../types/audiology';
import { toTitleCase, normalizeDate, addDaysToDate, parseBoolean } from './cleaners';
import { generateReportRef, generateInvoiceNo, getCareHomeInitials, getPatientInitials } from './hash';
import { calculateLineItems, calculateTotalAmount } from './pricing';
import { CSV_REQUIRED_COLUMNS, PRICING } from './constants';

/**
 * Checks for missing required headers in raw CSV data.
 */
export function validateHeaders(headers: string[]): { missing: string[]; matched: Record<string, string> } {
  const normalizedHeaders = headers.map((h) => h.trim().toLowerCase());
  const missing: string[] = [];
  const matched: Record<string, string> = {};

  for (const col of CSV_REQUIRED_COLUMNS) {
    const colLower = col.toLowerCase();
    const foundIdx = normalizedHeaders.findIndex(
      (h) => h === colLower || h.replace(/[\?\:\_\s]/g, '') === colLower.replace(/[\?\:\_\s]/g, '')
    );
    if (foundIdx === -1) {
      // Check flexible variations
      if (col === 'Right Ear Wax' && normalizedHeaders.some((h) => h.includes('right') && h.includes('wax'))) {
        const found = headers[normalizedHeaders.findIndex((h) => h.includes('right') && h.includes('wax'))];
        matched[col] = found;
      } else if (col === 'Left Ear Wax?' && normalizedHeaders.some((h) => h.includes('left') && h.includes('wax'))) {
        const found = headers[normalizedHeaders.findIndex((h) => h.includes('left') && h.includes('wax'))];
        matched[col] = found;
      } else if (col === 'Reason not seen' && normalizedHeaders.some((h) => h.includes('reason'))) {
        const found = headers[normalizedHeaders.findIndex((h) => h.includes('reason'))];
        matched[col] = found;
      } else {
        missing.push(col);
      }
    } else {
      matched[col] = headers[foundIdx];
    }
  }

  return { missing, matched };
}

/**
 * Helper to get value from row using flexible column matching.
 */
function getRowValue(row: RawCsvRow, colName: string, matched: Record<string, string>): string {
  const exactKey = matched[colName] || colName;
  if (row[exactKey] !== undefined && row[exactKey] !== null) {
    return String(row[exactKey]).trim();
  }
  // Fallback direct case-insensitive match
  const colLower = colName.toLowerCase().replace(/[\?\:\_\s]/g, '');
  for (const key of Object.keys(row)) {
    if (key.toLowerCase().replace(/[\?\:\_\s]/g, '') === colLower) {
      return String(row[key]).trim();
    }
  }
  return '';
}

/**
 * Generates clinical helper findings based on patient flags.
 */
function generateDefaultClinicalFindings(
  leftWax: boolean,
  rightWax: boolean,
  audiogram: boolean,
  screening: boolean,
  notes: string
) {
  let leftEarFinding = 'Tympanic membrane clear, healthy landmarks visible, no obstructing cerumen.';
  let rightEarFinding = 'Tympanic membrane clear, healthy landmarks visible, no obstructing cerumen.';

  if (leftWax && rightWax) {
    leftEarFinding = 'Cerumen buildup identified. Wax removal performed / recommended.';
    rightEarFinding = 'Cerumen buildup identified. Wax removal performed / recommended.';
  } else if (leftWax) {
    leftEarFinding = 'Moderate to heavy cerumen impaction noted. Wax removal performed / recommended.';
    rightEarFinding = 'External auditory canal clear, tympanic membrane intact and visible.';
  } else if (rightWax) {
    leftEarFinding = 'External auditory canal clear, tympanic membrane intact and visible.';
    rightEarFinding = 'Moderate to heavy cerumen impaction noted. Wax removal performed / recommended.';
  }

  let hearingTestResult = 'Initial otoscopic examination & hearing check completed.';
  if (audiogram) {
    hearingTestResult = 'Comprehensive pure-tone air conduction diagnostic audiogram completed.';
  } else if (screening) {
    hearingTestResult = 'Routine hearing screening performed. Normal threshold indicators detected.';
  }

  let recommendations = 'Annual audiological health and hearing review recommended.';
  let nextStep = 'Discharged / Routine 12-Month Review';

  if (leftWax || rightWax) {
    recommendations = 'Apply 2-3 drops of medicinal olive oil twice daily for 14 days prior to follow-up ear irrigation / micro-suction if remaining cerumen persists.';
    nextStep = 'Follow-up Wax Removal / 2-Week Softening';
  } else if (audiogram) {
    recommendations = 'Discussed hearing aid trial and communicative strategies with resident and care team.';
    nextStep = 'Hearing Aid Consultation / Review';
  }

  if (notes) {
    recommendations += ` Note: ${notes}`;
  }

  return { leftEarFinding, rightEarFinding, hearingTestResult, recommendations, nextStep };
}

/**
 * Parses raw CSV string or File into validated CareHomeSummary and PatientRow collections.
 */
export function parseAudiologyCsv(csvString: string): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse<RawCsvRow>(csvString, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        const rawHeaders = results.meta.fields || [];
        const { missing, matched } = validateHeaders(rawHeaders);
        const errors: ValidationError[] = [];
        const warnings: ValidationError[] = [];

        if (missing.length > 0) {
          errors.push({
            row: 0,
            field: 'Headers',
            message: `Missing required column(s): ${missing.join(', ')}`,
            type: 'error',
          });
        }

        const patients: PatientRow[] = [];
        let careHomeName = '';
        let careHomePostCode = '';
        let careHomeAppointmentDate = '';
        let careHomeAudiologist = '';

        results.data.forEach((row, index) => {
          const rowNumber = index + 2; // Accounting for 1-based index + header row

          const firstNameRaw = getRowValue(row, 'Resident First Name', matched);
          const surnameRaw = getRowValue(row, 'Resident Surname', matched);
          const careHomeRaw = getRowValue(row, 'Care Home', matched);
          const postCodeRaw = getRowValue(row, 'Post Code', matched);
          const appDateRaw = getRowValue(row, 'Appointment Date', matched);
          const dobRaw = getRowValue(row, 'DOB', matched);
          const audiologistRaw = getRowValue(row, 'Audiologist', matched);
          const seenRaw = getRowValue(row, 'Seen?', matched);
          const reasonNotSeenRaw = getRowValue(row, 'Reason not seen', matched);
          const screeningRaw = getRowValue(row, 'Screening?', matched);
          const audiogramRaw = getRowValue(row, 'Audiogram?', matched);
          const leftWaxRaw = getRowValue(row, 'Left Ear Wax?', matched);
          const rightWaxRaw = getRowValue(row, 'Right Ear Wax', matched);
          const notesRaw = getRowValue(row, 'Notes', matched);

          // Validation checks
          if (!firstNameRaw && !surnameRaw) {
            warnings.push({
              row: rowNumber,
              field: 'Resident Name',
              message: 'Patient row is missing resident name.',
              type: 'warning',
            });
            return;
          }

          const firstName = toTitleCase(firstNameRaw);
          const surname = toTitleCase(surnameRaw);
          const careHome = toTitleCase(careHomeRaw) || careHomeName || 'Care Home';
          const postCode = postCodeRaw.toUpperCase() || careHomePostCode || '';
          const appointmentDate = normalizeDate(appDateRaw) || careHomeAppointmentDate || normalizeDate(new Date().toISOString());
          const dob = normalizeDate(dobRaw) || '01/01/1940';
          const audiologist = toTitleCase(audiologistRaw) || careHomeAudiologist || 'Audiologist';

          // Set primary summary metadata from first valid row if not yet set
          if (!careHomeName && careHome) careHomeName = careHome;
          if (!careHomePostCode && postCode) careHomePostCode = postCode;
          if (!careHomeAppointmentDate && appointmentDate) careHomeAppointmentDate = appointmentDate;
          if (!careHomeAudiologist && audiologist) careHomeAudiologist = audiologist;

          const seen = parseBoolean(seenRaw || 'Yes');
          const reasonNotSeen = reasonNotSeenRaw || (seen ? '' : 'Resident unavailable or declined visit');
          const screening = parseBoolean(screeningRaw);
          const audiogram = parseBoolean(audiogramRaw);
          const leftEarWax = parseBoolean(leftWaxRaw);
          const rightEarWax = parseBoolean(rightWaxRaw);
          const hasEarWax = leftEarWax || rightEarWax;

          const reportRef = generateReportRef(careHome, firstName, surname, dob, index + 1);
          const invoiceNo = generateInvoiceNo(careHome, firstName, surname, dob, index + 1);
          const dueDate = addDaysToDate(appointmentDate, PRICING.PAYMENT_TERMS_DAYS);

          const lineItems = seen ? calculateLineItems(screening, audiogram, leftEarWax, rightEarWax) : [];
          const totalAmount = calculateTotalAmount(lineItems);

          const clinicalDefaults = generateDefaultClinicalFindings(
            leftEarWax,
            rightEarWax,
            audiogram,
            screening,
            notesRaw
          );

          const patient: PatientRow = {
            id: `pat-${index + 1}-${Date.now().toString(36)}`,
            careHome,
            postCode,
            appointmentDate,
            dob,
            audiologist,
            residentFirstName: firstName,
            residentSurname: surname,
            residentFullName: `${firstName} ${surname}`.trim(),
            seen,
            reasonNotSeen,
            screening,
            audiogram,
            leftEarWax,
            rightEarWax,
            hasEarWax,
            notes: notesRaw,
            reportRef,
            invoiceNo,
            careHomeInitials: getCareHomeInitials(careHome),
            patientInitials: getPatientInitials(firstName, surname),
            dueDate,
            lineItems,
            totalAmount,
            leftEarFinding: clinicalDefaults.leftEarFinding,
            rightEarFinding: clinicalDefaults.rightEarFinding,
            hearingTestResult: clinicalDefaults.hearingTestResult,
            recommendations: clinicalDefaults.recommendations,
            nextStep: clinicalDefaults.nextStep,
          };

          patients.push(patient);
        });

        const seenPatients = patients.filter((p) => p.seen);
        const unseenPatients = patients.filter((p) => !p.seen);

        const totalRevenue = seenPatients.reduce((sum, p) => sum + p.totalAmount, 0);
        const screeningsCount = seenPatients.filter((p) => p.screening).length;
        const audiogramsCount = seenPatients.filter((p) => p.audiogram).length;
        const waxRemovalCount = seenPatients.filter((p) => p.hasEarWax).length;

        const careHomeSummary: CareHomeSummary | null =
          patients.length > 0
            ? {
                careHome: careHomeName || 'Care Home',
                postCode: careHomePostCode,
                appointmentDate: careHomeAppointmentDate,
                audiologist: careHomeAudiologist,
                totalPatients: patients.length,
                seenPatientsCount: seenPatients.length,
                unseenPatientsCount: unseenPatients.length,
                totalRevenue,
                screeningsCount,
                audiogramsCount,
                waxRemovalCount,
                seenPatients,
                unseenPatients,
              }
            : null;

        resolve({
          careHomeSummary,
          patients,
          seenPatients,
          unseenPatients,
          errors,
          warnings,
        });
      },
      error: (err: Error) => {
        resolve({
          careHomeSummary: null,
          patients: [],
          seenPatients: [],
          unseenPatients: [],
          errors: [
            {
              row: 0,
              field: 'Parser',
              message: `CSV parsing failed: ${err.message}`,
              type: 'error',
            },
          ],
          warnings: [],
        });
      },
    });
  });
}

/**
 * Creates CSV template string for care home data ingestion.
 */
export function generateCsvTemplate(): string {
  const headers = CSV_REQUIRED_COLUMNS.join(',');
  const sampleRow1 = 'Colne View Care Home,CO9 2DY,24/08/2026,14/03/1938,Sarah Jenkins,Melanie,Dudman,Yes,,Yes,Yes,Yes,Yes,Resident reported reduced hearing and left ear fullness';
  const sampleRow2 = 'Colne View Care Home,CO9 2DY,24/08/2026,22/11/1942,Sarah Jenkins,Arthur,Pendleton,Yes,,Yes,No,Yes,No,Mild wax accumulation left ear';
  const sampleRow3 = 'Colne View Care Home,CO9 2DY,24/08/2026,05/09/1935,Sarah Jenkins,Dorothy,Evans,No,Resident resting in bed - family requested rescheduling,No,No,No,No,Rescheduled for next visit';

  return `${headers}\n${sampleRow1}\n${sampleRow2}\n${sampleRow3}\n`;
}
