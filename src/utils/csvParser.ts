import Papa from 'papaparse';
import {
  RawCsvRow,
  PatientRow,
  CareHomeSummary,
  ValidationError,
  ParseResult,
  EarWaxLevel,
} from '../types/audiology';
import {
  toTitleCase,
  normalizeDate,
  addDaysToDate,
  parseBoolean,
  parseEarWaxLevel,
  PLACEHOLDER_DOB,
} from './cleaners';
import { generateReportRef, generateInvoiceNo, getCareHomeInitials, getPatientInitials } from './hash';
import { calculateLineItems, calculateTotalAmount, calculateDiscountAmount } from './pricing';
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
      } else if (
        col === 'Full Hearing Test?' &&
        normalizedHeaders.some((h) => h.includes('hearing') || h.includes('audiogram') || h.includes('test'))
      ) {
        const found = headers[normalizedHeaders.findIndex((h) => h.includes('hearing') || h.includes('audiogram') || h.includes('test'))];
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
 * Generates clinical helper findings based on patient flags and ear wax severity (0..3).
 */
function generateDefaultClinicalFindings(
  leftWax: EarWaxLevel,
  rightWax: EarWaxLevel,
  audiogram: boolean,
  screening: boolean,
  notes: string
) {
  const getFindingForSide = (level: EarWaxLevel) => {
    switch (level) {
      case 0:
        return 'Eardrum is clear and healthy with no wax buildup.';
      case 1:
        return 'Small amount of normal ear wax seen. Ear canal is clear, eardrum is visible, and no wax removal is needed.';
      case 2:
        return 'Moderate ear wax buildup found. Wax removal recommended after using olive oil drops.';
      case 3:
        return 'Heavy ear wax blocking the ear canal. Wax removal recommended after using olive oil drops.';
    }
  };

  const leftEarFinding = getFindingForSide(leftWax);
  const rightEarFinding = getFindingForSide(rightWax);

  let hearingTestResult = 'Ear check and hearing test completed.';
  if (audiogram) {
    hearingTestResult = 'Full hearing test completed.';
  } else if (screening) {
    hearingTestResult = 'Hearing screening completed. Good hearing response detected.';
  }

  let recommendations = 'Routine annual ear and hearing check recommended.';
  let nextStep = 'All Clear';

  if (leftWax >= 2 || rightWax >= 2) {
    recommendations = 'Please apply 2 to 3 drops of olive oil (or Earol spray) twice a day for 14 days to soften the wax before gentle cleaning.';
    nextStep = '2-Week Olive Oil Drops / Wax Removal';
  } else if (leftWax === 1 || rightWax === 1) {
    recommendations = 'Small amount of normal wax present. Normal ear hygiene advised; no wax removal needed.';
    nextStep = audiogram ? 'Hearing Aid Check & Discussion' : 'All Clear';
  } else if (audiogram) {
    recommendations = 'Discussed hearing results and helpful communication tips with resident and care team.';
    nextStep = 'Hearing Aid Check & Discussion';
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
          const audiogramRaw =
            getRowValue(row, 'Full Hearing Test?', matched) ||
            getRowValue(row, 'Audiogram?', matched) ||
            getRowValue(row, 'Hearing Test?', matched);
          const leftWaxRaw = getRowValue(row, 'Left Ear Wax?', matched);
          const rightWaxRaw = getRowValue(row, 'Right Ear Wax', matched);
          const notesRaw = getRowValue(row, 'Notes', matched);

          // Half-Price Discount Ingestion
          const halfPriceRaw =
            getRowValue(row, 'Half Price Discount', matched) ||
            getRowValue(row, 'Half Price?', matched) ||
            getRowValue(row, 'Half Price', matched) ||
            getRowValue(row, 'Discount?', matched) ||
            getRowValue(row, '50% Discount', matched) ||
            getRowValue(row, 'Discount', matched);
          const isHalfPrice =
            parseBoolean(halfPriceRaw) ||
            halfPriceRaw.toLowerCase().includes('half') ||
            halfPriceRaw.toLowerCase().includes('50%');

          // Optional Payment Ingestion (from previously exported cleaned CSVs)
          const paymentStatusRaw = getRowValue(row, 'Payment Status', matched) || getRowValue(row, 'Paid?', matched);
          const isPaid =
            paymentStatusRaw.toLowerCase().includes('paid') ||
            paymentStatusRaw.toLowerCase() === 'yes' ||
            paymentStatusRaw.toLowerCase() === 'true';
          const paymentMethod = getRowValue(row, 'Payment Method', matched) || (isPaid ? 'SumUp Card Reader' : '');
          const paymentDate =
            normalizeDate(getRowValue(row, 'Payment Date', matched)) || (isPaid ? normalizeDate(appDateRaw) || '' : '');
          const paymentRef =
            getRowValue(row, 'Payment Ref', matched) || getRowValue(row, 'Transaction Ref', matched) || '';

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
          const dob = normalizeDate(dobRaw) || PLACEHOLDER_DOB;
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
          const leftEarWax = parseEarWaxLevel(leftWaxRaw);
          const rightEarWax = parseEarWaxLevel(rightWaxRaw);
          const hasEarWax = leftEarWax >= 2 || rightEarWax >= 2;

          const reportRef = generateReportRef(careHome, firstName, surname, dob, index + 1);
          const invoiceNo = generateInvoiceNo(careHome, firstName, surname, dob, index + 1);
          const dueDate = addDaysToDate(appointmentDate, PRICING.PAYMENT_TERMS_DAYS);

          const lineItems = seen ? calculateLineItems(screening, audiogram, leftEarWax, rightEarWax, isHalfPrice) : [];
          const totalAmount = calculateTotalAmount(lineItems);
          const discountAmount = isHalfPrice ? calculateDiscountAmount(lineItems) : 0;

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
            isHalfPrice: seen ? isHalfPrice : false,
            discountAmount: seen ? discountAmount : 0,
            isPaid: seen ? isPaid : false,
            paymentMethod: seen && isPaid ? paymentMethod : '',
            paymentDate: seen && isPaid ? paymentDate || appointmentDate : '',
            paymentRef: seen && isPaid ? paymentRef : '',
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
        const totalPaidRevenue = seenPatients
          .filter((p) => p.isPaid)
          .reduce((sum, p) => sum + p.totalAmount, 0);
        const totalPendingRevenue = totalRevenue - totalPaidRevenue;
        const paidInvoicesCount = seenPatients.filter((p) => p.isPaid).length;
        const unpaidInvoicesCount = seenPatients.filter((p) => !p.isPaid).length;

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
                totalPaidRevenue,
                totalPendingRevenue,
                paidInvoicesCount,
                unpaidInvoicesCount,
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
  const sampleRow1 = 'Fairhaven Care Home,CB25 9EJ,24/08/2026,14/03/1938,Sarah Jenkins,Melanie,Dudman,Yes,,Yes,Yes,2,3,Resident reported reduced hearing and left ear fullness';
  const sampleRow2 = 'Fairhaven Care Home,CB25 9EJ,24/08/2026,22/11/1942,Sarah Jenkins,Arthur,Pendleton,Yes,,Yes,No,3,0,Mild wax accumulation left ear';
  const sampleRow3 = 'Fairhaven Care Home,CB25 9EJ,24/08/2026,05/09/1935,Sarah Jenkins,Dorothy,Evans,No,Resident resting in bed - family requested rescheduling,No,No,0,0,Rescheduled for next visit';

  return `${headers}\n${sampleRow1}\n${sampleRow2}\n${sampleRow3}\n`;
}

export interface NewPatientInput {
  careHome: string;
  postCode: string;
  appointmentDate: string;
  dob: string;
  audiologist: string;
  residentFirstName: string;
  residentSurname: string;
  seen: boolean;
  reasonNotSeen?: string;
  screening: boolean;
  audiogram: boolean;
  leftEarWax: EarWaxLevel;
  rightEarWax: EarWaxLevel;
  isHalfPrice?: boolean;
  isPaid?: boolean;
  paymentMethod?: string;
  paymentDate?: string;
  paymentRef?: string;
  notes?: string;
  indexOffset?: number;
}

/**
 * Creates a complete PatientRow instance for newly registered / walk-in residents.
 */
export function createNewPatient(input: NewPatientInput): PatientRow {
  const firstName = toTitleCase(input.residentFirstName.trim());
  const surname = toTitleCase(input.residentSurname.trim());
  const careHome = toTitleCase(input.careHome.trim()) || 'Care Home';
  const postCode = input.postCode.trim().toUpperCase();
  const appointmentDate = normalizeDate(input.appointmentDate.trim()) || normalizeDate(new Date().toISOString());
  const dob = normalizeDate(input.dob.trim()) || PLACEHOLDER_DOB;
  const audiologist = toTitleCase(input.audiologist.trim()) || 'Audiologist';
  const seen = input.seen;
  const reasonNotSeen = input.reasonNotSeen || (seen ? '' : 'Resident unavailable or declined visit');
  const screening = input.screening;
  const audiogram = input.audiogram;
  const leftEarWax = input.leftEarWax;
  const rightEarWax = input.rightEarWax;
  const hasEarWax = leftEarWax >= 2 || rightEarWax >= 2;
  const isHalfPrice = seen ? Boolean(input.isHalfPrice) : false;
  const isPaid = seen ? Boolean(input.isPaid) : false;
  const paymentMethod = isPaid ? input.paymentMethod || 'SumUp Card Reader' : '';
  const paymentDate = isPaid ? normalizeDate(input.paymentDate || appointmentDate) : '';
  const paymentRef = isPaid ? input.paymentRef || '' : '';
  const notes = input.notes || '';
  const idx = (input.indexOffset ?? 0) + 1;

  const reportRef = generateReportRef(careHome, firstName, surname, dob, idx);
  const invoiceNo = generateInvoiceNo(careHome, firstName, surname, dob, idx);
  const dueDate = addDaysToDate(appointmentDate, PRICING.PAYMENT_TERMS_DAYS);

  const lineItems = seen ? calculateLineItems(screening, audiogram, leftEarWax, rightEarWax, isHalfPrice) : [];
  const totalAmount = calculateTotalAmount(lineItems);
  const discountAmount = isHalfPrice ? calculateDiscountAmount(lineItems) : 0;

  const clinicalDefaults = generateDefaultClinicalFindings(
    leftEarWax,
    rightEarWax,
    audiogram,
    screening,
    notes
  );

  return {
    id: `pat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
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
    notes,
    reportRef,
    invoiceNo,
    careHomeInitials: getCareHomeInitials(careHome),
    patientInitials: getPatientInitials(firstName, surname),
    dueDate,
    lineItems,
    totalAmount,
    isHalfPrice,
    discountAmount,
    isPaid,
    paymentMethod,
    paymentDate,
    paymentRef,
    leftEarFinding: clinicalDefaults.leftEarFinding,
    rightEarFinding: clinicalDefaults.rightEarFinding,
    hearingTestResult: clinicalDefaults.hearingTestResult,
    recommendations: clinicalDefaults.recommendations,
    nextStep: clinicalDefaults.nextStep,
  };
}

/**
 * Generates cleaned and standardized CSV string from live PatientRow list.
 */
export function generateCleanedCsv(
  patients: PatientRow[],
  includeExtendedColumns: boolean = true
): string {
  const data = patients.map((p) => {
    const baseRow: Record<string, string | number> = {
      'Care Home': p.careHome,
      'Post Code': p.postCode,
      'Appointment Date': p.appointmentDate,
      'DOB': p.dob,
      'Audiologist': p.audiologist,
      'Resident First Name': p.residentFirstName,
      'Resident Surname': p.residentSurname,
      'Seen?': p.seen ? 'Yes' : 'No',
      'Reason not seen': p.reasonNotSeen,
      'Screening?': p.screening ? 'Yes' : 'No',
      'Full Hearing Test?': p.audiogram ? 'Yes' : 'No',
      'Left Ear Wax?': p.leftEarWax,
      'Right Ear Wax': p.rightEarWax,
      'Notes': p.notes,
    };

    if (includeExtendedColumns) {
      baseRow['Report Ref'] = p.reportRef;
      baseRow['Invoice No'] = p.invoiceNo;
      baseRow['Half Price Discount'] = p.seen ? (p.isHalfPrice ? 'Yes' : 'No') : 'No';
      baseRow['Discount Amount (GBP)'] = p.seen && p.isHalfPrice && p.discountAmount ? `£${p.discountAmount.toFixed(2)}` : '£0.00';
      baseRow['Total Amount (GBP)'] = p.seen ? `£${p.totalAmount.toFixed(2)}` : '£0.00';
      baseRow['Payment Status'] = p.seen ? (p.isPaid ? 'Paid' : 'Unpaid') : 'N/A';
      baseRow['Payment Method'] = p.seen && p.isPaid ? p.paymentMethod || '' : '';
      baseRow['Payment Date'] = p.seen && p.isPaid ? p.paymentDate || '' : '';
      baseRow['Payment Ref'] = p.seen && p.isPaid ? p.paymentRef || '' : '';
    }

    return baseRow;
  });

  return Papa.unparse(data);
}


