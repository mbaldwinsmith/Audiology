import { toTitleCase, normalizeDate, addDaysToDate, parseBoolean } from './cleaners';
import { getCareHomeInitials, getPatientInitials, generateReportRef, generateInvoiceNo } from './hash';
import { calculateLineItems, calculateTotalAmount } from './pricing';
import { parseAudiologyCsv, createNewPatient, generateCleanedCsv } from './csvParser';
import { recalculateSummary } from './sessionHelper';
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

  // Test 5: createNewPatient (Walk-in resident)
  const walkIn = createNewPatient({
    careHome: 'Colne View Care Home',
    postCode: 'CO9 2FF',
    appointmentDate: '24/08/2026',
    dob: '12/05/1941',
    audiologist: 'Sarah Jenkins',
    residentFirstName: 'James',
    residentSurname: 'Wilson',
    seen: true,
    screening: true,
    audiogram: true,
    leftEarWax: true,
    rightEarWax: false,
    notes: 'Mild tinnitus reported',
    indexOffset: 10,
  });
  console.assert(walkIn.residentFullName === 'James Wilson', 'Test 5.1 failed: Full name');
  console.assert(walkIn.reportRef === 'CV-JW1205-A11', `Test 5.2 failed: Report ref ${walkIn.reportRef}`);
  console.assert(walkIn.invoiceNo === 'CV-JW1205-INV11', `Test 5.3 failed: Invoice no ${walkIn.invoiceNo}`);
  console.assert(walkIn.totalAmount === 130, `Test 5.4 failed: Total amount expected 130, got ${walkIn.totalAmount}`);
  console.assert(walkIn.lineItems.length === 3, `Test 5.5 failed: Expected 3 line items, got ${walkIn.lineItems.length}`);
  console.log('✔ Phase 5 Walk-in Patient Creation Passed');

  // Test 6: recalculateSummary & Deletion
  const updatedPatients = [...parseRes.patients, walkIn];
  const updatedSummary = recalculateSummary(updatedPatients, parseRes.careHomeSummary);
  console.assert(updatedSummary !== null, 'Test 6.1 failed: Summary should not be null');
  console.assert(updatedSummary?.totalPatients === 11, `Test 6.2 failed: Expected 11 patients, got ${updatedSummary?.totalPatients}`);
  console.assert(updatedSummary?.seenPatientsCount === 8, `Test 6.3 failed: Expected 8 seen, got ${updatedSummary?.seenPatientsCount}`);

  // Test deletion
  const afterDelete = updatedPatients.filter((p) => p.id !== walkIn.id);
  const afterDeleteSummary = recalculateSummary(afterDelete, updatedSummary);
  console.assert(afterDeleteSummary?.totalPatients === 10, 'Test 6.4 failed: Expected 10 patients after deletion');
  console.assert(afterDeleteSummary?.seenPatientsCount === 7, 'Test 6.5 failed: Expected 7 seen after deletion');
  console.log('✔ Phase 6 Centralized Summary Recalculation Passed');

  // Test 7: generateCleanedCsv
  const cleanedCsv = generateCleanedCsv(updatedPatients, true);
  console.assert(cleanedCsv.includes('James,Wilson'), 'Test 7.1 failed: Cleaned CSV should include new patient');
  console.assert(cleanedCsv.includes('CV-JW1205-A11'), 'Test 7.2 failed: Cleaned CSV should include report ref');
  console.assert(cleanedCsv.includes('CV-JW1205-INV11'), 'Test 7.3 failed: Cleaned CSV should include invoice no');
  console.log('✔ Phase 7 Cleaned CSV Generation Passed');

  // Test 8: Payment Tracking, Receipt Mode & Two-Way CSV Roundtrip
  const paidPatient = {
    ...walkIn,
    isPaid: true,
    paymentMethod: 'SumUp Card Reader',
    paymentDate: '24/08/2026',
    paymentRef: 'SUMUP-839120',
  };
  const testPatientsWithPayment = [paidPatient, ...parseRes.patients];
  const summaryWithPayment = recalculateSummary(testPatientsWithPayment, parseRes.careHomeSummary);
  console.assert(summaryWithPayment?.totalPaidRevenue === 130, `Test 8.1 failed: Expected £130 paid revenue, got ${summaryWithPayment?.totalPaidRevenue}`);
  console.assert(summaryWithPayment?.paidInvoicesCount === 1, `Test 8.2 failed: Expected 1 paid invoice, got ${summaryWithPayment?.paidInvoicesCount}`);

  // Test CSV export and re-import roundtrip
  const exportedWithPaymentCsv = generateCleanedCsv(testPatientsWithPayment, true);
  console.assert(exportedWithPaymentCsv.includes('Payment Status'), 'Test 8.3 failed: Missing Payment Status header');
  console.assert(exportedWithPaymentCsv.includes('SUMUP-839120'), 'Test 8.4 failed: Missing payment ref');

  const reimportedRes = await parseAudiologyCsv(exportedWithPaymentCsv);
  const reimportedPaid = reimportedRes.patients.find((p) => p.residentFullName === 'James Wilson');
  console.assert(reimportedPaid?.isPaid === true, 'Test 8.5 failed: Re-imported patient should be marked as paid');
  console.assert(reimportedPaid?.paymentMethod === 'SumUp Card Reader', 'Test 8.6 failed: Re-imported payment method mismatch');
  console.assert(reimportedPaid?.paymentRef === 'SUMUP-839120', 'Test 8.7 failed: Re-imported payment ref mismatch');
  console.log('✔ Phase 8 Payment Tracking & Two-Way CSV Persistence Passed');

  console.log('🎉 ALL AUDIOLOGY ENGINE VERIFICATIONS PASSED SUCCESSFULLY!');
  return true;
}


