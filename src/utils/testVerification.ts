import {
  toTitleCase,
  normalizeDate,
  addDaysToDate,
  parseBoolean,
  parseEarWaxLevel,
  PLACEHOLDER_DOB,
  isPlaceholderDob,
  formatDobDisplay,
} from './cleaners';
import { getCareHomeInitials, getPatientInitials, generateReportRef, generateInvoiceNo } from './hash';
import { calculateLineItems, calculateTotalAmount, calculateGrossSubtotal, calculateDiscountAmount } from './pricing';
import { parseAudiologyCsv, createNewPatient, generateCleanedCsv } from './csvParser';
import { recalculateSummary } from './sessionHelper';
import { SAMPLE_CSV_DATA } from './sampleData';
import {
  encryptSessionData,
  decryptSessionData,
  hasEncryptedSession,
  clearEncryptedSession,
} from './security';

export async function runSelfVerification() {
  console.log('=== ELITESIGHT AUDIOLOGY VERIFICATION RUN ===');

  // Test 1: Cleaners, Ear Wax Level Parser & Placeholder DOB
  console.assert(toTitleCase('melanie dudman') === 'Melanie Dudman', 'Test 1.1 failed: TitleCase simple');
  console.assert(toTitleCase("O'CONNOR") === "O'Connor", 'Test 1.2 failed: TitleCase apostrophe');
  console.assert(toTitleCase('smith-jones') === 'Smith-Jones', 'Test 1.3 failed: TitleCase hyphen');
  console.assert(normalizeDate('2026-08-24') === '24/08/2026', 'Test 1.4 failed: Date ISO');
  console.assert(normalizeDate('24/8/2026') === '24/08/2026', 'Test 1.5 failed: Date pad');
  console.assert(addDaysToDate('24/08/2026', 7) === '31/08/2026', 'Test 1.6 failed: Add 7 days');
  console.assert(parseBoolean('Yes') === true, 'Test 1.7 failed: Boolean Yes');
  console.assert(parseBoolean('No') === false, 'Test 1.8 failed: Boolean No');
  console.assert(parseEarWaxLevel('0') === 0, 'Test 1.9 failed: Ear wax level 0');
  console.assert(parseEarWaxLevel('1') === 1, 'Test 1.10 failed: Ear wax level 1');
  console.assert(parseEarWaxLevel('2') === 2, 'Test 1.11 failed: Ear wax level 2');
  console.assert(parseEarWaxLevel('3') === 3, 'Test 1.12 failed: Ear wax level 3');
  console.assert(parseEarWaxLevel('Clear') === 0, 'Test 1.13 failed: Ear wax level Clear');
  console.assert(parseEarWaxLevel('Minor') === 1, 'Test 1.14 failed: Ear wax level Minor');
  console.assert(parseEarWaxLevel('Moderate') === 2, 'Test 1.15 failed: Ear wax level Moderate');
  console.assert(parseEarWaxLevel('Severe') === 3, 'Test 1.16 failed: Ear wax level Severe');
  console.assert(PLACEHOLDER_DOB === '01/01/1906', 'Test 1.17 failed: PLACEHOLDER_DOB must be 01/01/1906');
  console.assert(isPlaceholderDob('01/01/1906') === true, 'Test 1.18 failed: isPlaceholderDob');
  console.assert(isPlaceholderDob('14/03/1938') === false, 'Test 1.19 failed: isPlaceholderDob real date');
  console.assert(formatDobDisplay('01/01/1906') === '', 'Test 1.20 failed: formatDobDisplay placeholder must be blank');
  console.assert(formatDobDisplay('14/03/1938') === '14/03/1938', 'Test 1.21 failed: formatDobDisplay real date');
  console.log('✔ Phase 1 Cleaners, Ear Wax & DOB Placeholder System Passed');

  // Test 2: Deterministic Hash (including placeholder DOB 01/01/1906)
  const chInitials = getCareHomeInitials('Colne View Care Home');
  console.assert(chInitials === 'CV', `Test 2.1 failed: Expected 'CV', got '${chInitials}'`);

  const pInitials = getPatientInitials('Melanie', 'Dudman');
  console.assert(pInitials === 'MD', `Test 2.2 failed: Expected 'MD', got '${pInitials}'`);

  const reportRef = generateReportRef('Colne View Care Home', 'Melanie', 'Dudman', '14/03/1938', 1);
  console.assert(reportRef === 'CV-MD1403-A1', `Test 2.3 failed: Expected 'CV-MD1403-A1', got '${reportRef}'`);

  const invoiceNo = generateInvoiceNo('Colne View Care Home', 'Melanie', 'Dudman', '14/03/1938', 1);
  console.assert(invoiceNo === 'CV-MD1403-INV1', `Test 2.4 failed: Expected 'CV-MD1403-INV1', got '${invoiceNo}'`);

  // Reference for resident with placeholder DOB
  const noDobRef = generateReportRef('Colne View Care Home', 'John', 'Smith', PLACEHOLDER_DOB, 1);
  console.assert(noDobRef === 'CV-JS0101-A1', `Test 2.5 failed: Expected 'CV-JS0101-A1', got '${noDobRef}'`);
  console.log('✔ Phase 2 Deterministic Hashes & References Passed');

  // Test 3: Pricing calculations (with 0..3 ear wax levels & 50% discount)
  // Screening only (0, 0 wax)
  const items1 = calculateLineItems(true, false, 0, 0);
  console.assert(calculateTotalAmount(items1) === 0, 'Test 3.1 failed: Screening should be £0');

  // Full Hearing Test only (0, 0 wax)
  const items2 = calculateLineItems(true, true, 0, 0);
  console.assert(calculateTotalAmount(items2) === 50, 'Test 3.2 failed: Full Hearing Test should be £50');

  // Single ear wax (level 2 left, 0 right)
  const items3 = calculateLineItems(true, false, 2, 0);
  console.assert(calculateTotalAmount(items3) === 80, 'Test 3.3 failed: Wax should be £80');

  // Bilateral ear wax (level 2 left, level 3 right)
  const items4 = calculateLineItems(true, false, 2, 3);
  console.assert(calculateTotalAmount(items4) === 80, 'Test 3.4 failed: Bilateral wax flat fee should be £80');

  // Bilateral wax + Full Hearing Test
  const items5 = calculateLineItems(true, true, 2, 3);
  console.assert(calculateTotalAmount(items5) === 130, 'Test 3.5 failed: Wax + Full Hearing Test should be £130');

  // Minor ear wax only (level 1 left, level 1 right) - Should NOT trigger removal
  const itemsMinor = calculateLineItems(true, false, 1, 1);
  console.assert(calculateTotalAmount(itemsMinor) === 0, 'Test 3.6 failed: Minor wax (level 1) should not trigger removal');
  console.assert(itemsMinor.length === 1 && itemsMinor[0].id === 'item-screening', 'Test 3.7 failed: Minor wax should only have screening');

  // Mixed levels (level 1 left [no removal], level 2 right [removal]) - Should trigger single Right Ear removal
  const itemsMixed = calculateLineItems(true, false, 1, 2);
  console.assert(calculateTotalAmount(itemsMixed) === 80, 'Test 3.8 failed: Level 1 + Level 2 should trigger single ear removal');
  console.assert(itemsMixed.find((i) => i.id === 'item-wax')?.description === 'Ear Wax Removal - Right Ear', 'Test 3.9 failed: Expected unilateral Right Ear removal');

  // Half-Price Discount Tests:
  // 50% discount on Ear Wax Removal (£80 -> £40)
  const itemsWaxHalf = calculateLineItems(true, false, 2, 0, true);
  console.assert(calculateTotalAmount(itemsWaxHalf) === 40, `Test 3.10 failed: Wax half price should be £40, got ${calculateTotalAmount(itemsWaxHalf)}`);
  console.assert(calculateGrossSubtotal(itemsWaxHalf) === 80, 'Test 3.11 failed: Wax gross subtotal should be £80');
  console.assert(calculateDiscountAmount(itemsWaxHalf) === 40, 'Test 3.12 failed: Wax discount amount should be £40');
  console.assert(Boolean(itemsWaxHalf.find((i) => i.id === 'item-discount-half')), 'Test 3.13 failed: Missing discount line item');

  // 50% discount on Full Hearing Test (£50 -> £25)
  const itemsTestHalf = calculateLineItems(true, true, 0, 0, true);
  console.assert(calculateTotalAmount(itemsTestHalf) === 25, `Test 3.14 failed: Test half price should be £25, got ${calculateTotalAmount(itemsTestHalf)}`);
  console.assert(calculateDiscountAmount(itemsTestHalf) === 25, 'Test 3.15 failed: Test discount amount should be £25');

  // 50% discount on Combined Wax + Hearing Test (£130 -> £65)
  const itemsCombinedHalf = calculateLineItems(true, true, 2, 3, true);
  console.assert(calculateTotalAmount(itemsCombinedHalf) === 65, `Test 3.16 failed: Combined half price should be £65, got ${calculateTotalAmount(itemsCombinedHalf)}`);
  console.assert(calculateGrossSubtotal(itemsCombinedHalf) === 130, 'Test 3.17 failed: Combined gross should be £130');
  console.assert(calculateDiscountAmount(itemsCombinedHalf) === 65, 'Test 3.18 failed: Combined discount should be £65');

  // 50% discount on complimentary screening (£0 -> £0)
  const itemsScreeningHalf = calculateLineItems(true, false, 0, 0, true);
  console.assert(calculateTotalAmount(itemsScreeningHalf) === 0, 'Test 3.19 failed: Screening half price should remain £0');
  console.assert(calculateDiscountAmount(itemsScreeningHalf) === 0, 'Test 3.20 failed: Screening discount should be £0');

  console.log('✔ Phase 3 Pricing & 50% Half-Price Discount Automated Rules Passed');

  // Test 4: Full CSV Parsing & Exclusion verification
  const parseRes = await parseAudiologyCsv(SAMPLE_CSV_DATA);
  console.assert(parseRes.patients.length === 10, `Test 4.1 failed: Expected 10 patients, got ${parseRes.patients.length}`);
  console.assert(parseRes.seenPatients.length === 7, `Test 4.2 failed: Expected 7 seen, got ${parseRes.seenPatients.length}`);
  console.assert(parseRes.unseenPatients.length === 3, `Test 4.3 failed: Expected 3 unseen, got ${parseRes.unseenPatients.length}`);
  console.assert(Boolean(parseRes.careHomeSummary && parseRes.careHomeSummary.totalRevenue > 0), 'Test 4.4 failed: Revenue must be calculated');

  // Verify Melanie Dudman has leftEarWax = 2 and rightEarWax = 3
  const melanie = parseRes.patients.find((p) => p.residentFullName === 'Melanie Dudman');
  console.assert(melanie?.leftEarWax === 2, `Test 4.5 failed: Expected Melanie leftEarWax 2, got ${melanie?.leftEarWax}`);
  console.assert(melanie?.rightEarWax === 3, `Test 4.6 failed: Expected Melanie rightEarWax 3, got ${melanie?.rightEarWax}`);

  // Verify unseen exclusion
  for (const unseen of parseRes.unseenPatients) {
    console.assert(unseen.lineItems.length === 0, `Test 4.7 failed: Unseen patient ${unseen.residentFullName} has line items`);
    console.assert(unseen.totalAmount === 0, `Test 4.8 failed: Unseen patient ${unseen.residentFullName} has non-zero total`);
    console.assert(unseen.reasonNotSeen.length > 0, `Test 4.9 failed: Unseen patient ${unseen.residentFullName} missing reason`);
  }
  console.log('✔ Phase 4 10-Patient CSV Parsing & Unseen Exclusion Rules Passed');

  // Test 5: createNewPatient (Walk-in resident with Half Price Discount)
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
    leftEarWax: 2,
    rightEarWax: 0,
    isHalfPrice: true,
    notes: 'Mild tinnitus reported - 50% discount voucher applied',
    indexOffset: 10,
  });
  console.assert(walkIn.residentFullName === 'James Wilson', 'Test 5.1 failed: Full name');
  console.assert(walkIn.reportRef === 'CV-JW1205-A11', `Test 5.2 failed: Report ref ${walkIn.reportRef}`);
  console.assert(walkIn.invoiceNo === 'CV-JW1205-INV11', `Test 5.3 failed: Invoice no ${walkIn.invoiceNo}`);
  console.assert(walkIn.leftEarWax === 2, `Test 5.4 failed: Left ear wax expected 2, got ${walkIn.leftEarWax}`);
  console.assert(walkIn.rightEarWax === 0, `Test 5.5 failed: Right ear wax expected 0, got ${walkIn.rightEarWax}`);
  console.assert(walkIn.isHalfPrice === true, 'Test 5.6 failed: Expected isHalfPrice true');
  console.assert(walkIn.discountAmount === 65, `Test 5.7 failed: Expected discount amount 65, got ${walkIn.discountAmount}`);
  console.assert(walkIn.totalAmount === 65, `Test 5.8 failed: Total amount expected 65 with 50% discount, got ${walkIn.totalAmount}`);
  console.assert(walkIn.lineItems.length === 4, `Test 5.9 failed: Expected 4 line items (screening, wax, test, discount), got ${walkIn.lineItems.length}`);
  console.log('✔ Phase 5 Walk-in Patient Creation with Half-Price Discount Passed');

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
  console.assert(cleanedCsv.includes('Half Price Discount'), 'Test 7.4 failed: Cleaned CSV should include Half Price Discount column');
  console.log('✔ Phase 7 Cleaned CSV Generation Passed');

  // Test 8: Payment Tracking, Receipt Mode & Two-Way CSV Roundtrip (including Half-Price)
  const paidPatient = {
    ...walkIn,
    isPaid: true,
    paymentMethod: 'SumUp Card Reader',
    paymentDate: '24/08/2026',
    paymentRef: 'SUMUP-839120',
  };
  const testPatientsWithPayment = [paidPatient, ...parseRes.patients];
  const summaryWithPayment = recalculateSummary(testPatientsWithPayment, parseRes.careHomeSummary);
  console.assert(summaryWithPayment?.totalPaidRevenue === 65, `Test 8.1 failed: Expected £65 paid revenue, got ${summaryWithPayment?.totalPaidRevenue}`);
  console.assert(summaryWithPayment?.paidInvoicesCount === 1, `Test 8.2 failed: Expected 1 paid invoice, got ${summaryWithPayment?.paidInvoicesCount}`);

  // Test CSV export and re-import roundtrip
  const exportedWithPaymentCsv = generateCleanedCsv(testPatientsWithPayment, true);
  console.assert(exportedWithPaymentCsv.includes('Payment Status'), 'Test 8.3 failed: Missing Payment Status header');
  console.assert(exportedWithPaymentCsv.includes('SUMUP-839120'), 'Test 8.4 failed: Missing payment ref');

  const reimportedRes = await parseAudiologyCsv(exportedWithPaymentCsv);
  const reimportedPaid = reimportedRes.patients.find((p) => p.residentFullName === 'James Wilson');
  console.assert(reimportedPaid?.isPaid === true, 'Test 8.5 failed: Re-imported patient should be marked as paid');
  console.assert(reimportedPaid?.isHalfPrice === true, 'Test 8.6 failed: Re-imported patient should have isHalfPrice true');
  console.assert(reimportedPaid?.totalAmount === 65, `Test 8.7 failed: Re-imported patient totalAmount expected 65, got ${reimportedPaid?.totalAmount}`);
  console.assert(reimportedPaid?.paymentMethod === 'SumUp Card Reader', 'Test 8.8 failed: Re-imported payment method mismatch');
  console.assert(reimportedPaid?.paymentRef === 'SUMUP-839120', 'Test 8.9 failed: Re-imported payment ref mismatch');
  console.log('✔ Phase 8 Payment Tracking, Half-Price & Two-Way CSV Persistence Passed');

  // Test 9: Web Crypto AES-GCM 256-bit Encrypted Session Auto-Save & Recovery
  await encryptSessionData(
    {
      summary: summaryWithPayment,
      patients: testPatientsWithPayment,
      errors: [],
      warnings: [],
      savedAt: Date.now(),
    },
    '1397'
  );
  console.assert(hasEncryptedSession() === true, 'Test 9.1 failed: Encrypted session should exist');

  // Test successful decryption with correct PIN
  const decryptedPayload = await decryptSessionData('1397');
  console.assert(decryptedPayload !== null, 'Test 9.2 failed: Decryption should succeed with correct PIN');
  console.assert(
    decryptedPayload?.patients.length === testPatientsWithPayment.length,
    `Test 9.3 failed: Expected ${testPatientsWithPayment.length} patients, got ${decryptedPayload?.patients.length}`
  );
  console.assert(
    decryptedPayload?.summary?.totalPaidRevenue === 65,
    'Test 9.4 failed: Decrypted summary revenue mismatch'
  );

  // Test decryption failure with incorrect PIN
  const wrongPinPayload = await decryptSessionData('9999');
  console.assert(wrongPinPayload === null, 'Test 9.5 failed: Decryption with wrong PIN must return null');

  // Test clear encrypted session
  clearEncryptedSession();
  console.assert(hasEncryptedSession() === false, 'Test 9.6 failed: Storage should be cleared');
  console.log('✔ Phase 9 Web Crypto AES-GCM Encrypted Session Auto-Save & Recovery Passed');

  console.log('🎉 ALL AUDIOLOGY ENGINE VERIFICATIONS PASSED SUCCESSFULLY!');
  return true;
}



