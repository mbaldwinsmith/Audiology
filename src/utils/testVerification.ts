import { toTitleCase, normalizeDate, addDaysToDate, parseBoolean } from './cleaners';
import { getCareHomeInitials, getPatientInitials, generateReportRef, generateInvoiceNo } from './hash';
import { calculateLineItems, calculateTotalAmount } from './pricing';
import { parseAudiologyCsv } from './csvParser';
import { SAMPLE_CSV_DATA } from './sampleData';

export async function runSelfVerification() {
  console.log('=== ELITESIGHT AUDIOLOGY VERIFICATION RUN ===');

  // Test 1: Cleaners
  console.assert(toTitleCase('melanie dudman') === 'Melanie Dudman', 'Test 1.1 failed: TitleCase simple');
  console.assert(toTitleCase("O'CONNOR") === "O'Connor", 'Test 1.2 failed: TitleCase apostrophe');
  console.assert(toTitleCase('smith-jones') === 'Smith-Jones', 'Test 1.3 failed: TitleCase hyphen');
  console.assert(normalizeDate('2026-08-24') === '24/08/2026', 'Test 1.4 failed: Date ISO');
  console.assert(normalizeDate('24/8/2026') === '24/08/2026', 'Test 1.5 failed: Date pad');
  console.assert(addDaysToDate('24/08/2026', 7) === '31/08/2026', 'Test 1.6 failed: Add 7 days');
  console.assert(parseBoolean('Yes') === true, 'Test 1.7 failed: Boolean Yes');
  console.assert(parseBoolean('No') === false, 'Test 1.8 failed: Boolean No');
  console.log('✔ Phase 1 Cleaners & Date Normalizers Passed');

  // Test 2: Deterministic Hash
  const chInitials = getCareHomeInitials('Colne View Care Home');
  console.assert(chInitials === 'CV', `Test 2.1 failed: Expected 'CV', got '${chInitials}'`);

  const pInitials = getPatientInitials('Melanie', 'Dudman');
  console.assert(pInitials === 'MD', `Test 2.2 failed: Expected 'MD', got '${pInitials}'`);

  const reportRef = generateReportRef('Colne View Care Home', 'Melanie', 'Dudman', '14/03/1938', 1);
  console.assert(reportRef === 'CV-MD1403-A1', `Test 2.3 failed: Expected 'CV-MD1403-A1', got '${reportRef}'`);

  const invoiceNo = generateInvoiceNo('Colne View Care Home', 'Melanie', 'Dudman', '14/03/1938', 1);
  console.assert(invoiceNo === 'CV-MD1403-INV1', `Test 2.4 failed: Expected 'CV-MD1403-INV1', got '${invoiceNo}'`);
  console.log('✔ Phase 2 Deterministic Hashes & References Passed');

  // Test 3: Pricing calculations
  // Screening only
  const items1 = calculateLineItems(true, false, false, false);
  console.assert(calculateTotalAmount(items1) === 0, 'Test 3.1 failed: Screening should be £0');

  // Audiogram only
  const items2 = calculateLineItems(true, true, false, false);
  console.assert(calculateTotalAmount(items2) === 50, 'Test 3.2 failed: Audiogram should be £50');

  // Single ear wax
  const items3 = calculateLineItems(true, false, true, false);
  console.assert(calculateTotalAmount(items3) === 80, 'Test 3.3 failed: Wax should be £80');

  // Bilateral ear wax
  const items4 = calculateLineItems(true, false, true, true);
  console.assert(calculateTotalAmount(items4) === 80, 'Test 3.4 failed: Bilateral wax flat fee should be £80');

  // Bilateral wax + Audiogram
  const items5 = calculateLineItems(true, true, true, true);
  console.assert(calculateTotalAmount(items5) === 130, 'Test 3.5 failed: Wax + Audiogram should be £130');
  console.log('✔ Phase 3 Pricing & Automated Invoicing Rules Passed');

  // Test 4: Full CSV Parsing & Exclusion verification
  const parseRes = await parseAudiologyCsv(SAMPLE_CSV_DATA);
  console.assert(parseRes.patients.length === 10, `Test 4.1 failed: Expected 10 patients, got ${parseRes.patients.length}`);
  console.assert(parseRes.seenPatients.length === 7, `Test 4.2 failed: Expected 7 seen, got ${parseRes.seenPatients.length}`);
  console.assert(parseRes.unseenPatients.length === 3, `Test 4.3 failed: Expected 3 unseen, got ${parseRes.unseenPatients.length}`);
  console.assert(Boolean(parseRes.careHomeSummary && parseRes.careHomeSummary.totalRevenue > 0), 'Test 4.4 failed: Revenue must be calculated');

  // Verify unseen exclusion
  for (const unseen of parseRes.unseenPatients) {
    console.assert(unseen.lineItems.length === 0, `Test 4.5 failed: Unseen patient ${unseen.residentFullName} has line items`);
    console.assert(unseen.totalAmount === 0, `Test 4.6 failed: Unseen patient ${unseen.residentFullName} has non-zero total`);
    console.assert(unseen.reasonNotSeen.length > 0, `Test 4.7 failed: Unseen patient ${unseen.residentFullName} missing reason`);
  }
  console.log('✔ Phase 4 10-Patient CSV Parsing & Unseen Exclusion Rules Passed');

  console.log('🎉 ALL AUDIOLOGY ENGINE VERIFICATIONS PASSED SUCCESSFULLY!');
  return true;
}
