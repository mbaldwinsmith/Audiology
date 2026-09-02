import React from 'react';
import { CareHomeSummary, PatientRow } from '../../types/audiology';
import { COMPANY_DETAILS } from '../../utils/constants';
import { formatDobDisplay, isPlaceholderDob } from '../../utils/cleaners';

interface CareHomeReportProps {
  summary: CareHomeSummary;
}

interface PageSectionChunk {
  items: PatientRow[];
  startIndex: number;
  isContinuation: boolean;
}

interface AudiologyReportPage {
  pageIndex: number;
  isFirstPage: boolean;
  section1?: PageSectionChunk;
  section2?: PageSectionChunk;
  section3?: PageSectionChunk;
}

function paginateAudiologyReport(
  treatmentPatients: PatientRow[],
  noFurtherTreatmentPatients: PatientRow[],
  unseenPatients: PatientRow[]
): AudiologyReportPage[] {
  const pages: AudiologyReportPage[] = [];

  // Capacity budget in estimated height units (px)
  // Page 1 budget: ~560px for table contents (accounting for main header + KPI ribbon + footer)
  // Continuation page budget: ~820px for table contents (accounting for compact header + footer)
  const PAGE_1_BUDGET = 560;
  const PAGE_N_BUDGET = 820;
  const SECTION_HEADER_COST = 55;
  const ROW_COST = 32;
  const EMPTY_SECTION_COST = 36;
  const SECTION_GAP = 18;

  let currentPageIndex = 0;
  let currentBudget = PAGE_1_BUDGET;

  let currentPage: AudiologyReportPage = {
    pageIndex: 0,
    isFirstPage: true,
  };

  function startNewPage() {
    pages.push(currentPage);
    currentPageIndex++;
    currentBudget = PAGE_N_BUDGET;
    currentPage = {
      pageIndex: currentPageIndex,
      isFirstPage: false,
    };
  }

  // 1. Process Section 1 (Treatment Needed & Invoices)
  if (treatmentPatients.length === 0) {
    currentPage.section1 = { items: [], startIndex: 0, isContinuation: false };
    currentBudget -= (SECTION_HEADER_COST + EMPTY_SECTION_COST + SECTION_GAP);
  } else {
    let tIndex = 0;
    while (tIndex < treatmentPatients.length) {
      const isCont = tIndex > 0;
      const availableRows = Math.floor((currentBudget - SECTION_HEADER_COST - SECTION_GAP) / ROW_COST);

      if (availableRows < 2 && (tIndex > 0 || !currentPage.isFirstPage)) {
        startNewPage();
        continue;
      }

      const chunkSize = Math.max(1, Math.min(Math.max(2, availableRows), treatmentPatients.length - tIndex));
      const chunk = treatmentPatients.slice(tIndex, tIndex + chunkSize);

      currentPage.section1 = {
        items: chunk,
        startIndex: tIndex,
        isContinuation: isCont,
      };

      currentBudget -= (SECTION_HEADER_COST + chunk.length * ROW_COST + SECTION_GAP);
      tIndex += chunkSize;

      if (tIndex < treatmentPatients.length) {
        startNewPage();
      }
    }
  }

  // 2. Process Section 2 (All Clear)
  if (noFurtherTreatmentPatients.length === 0) {
    const cost = SECTION_HEADER_COST + EMPTY_SECTION_COST + SECTION_GAP;
    if (currentBudget < cost && (currentPage.section1 || currentPage.section2 || currentPage.section3)) {
      startNewPage();
    }
    currentPage.section2 = { items: [], startIndex: 0, isContinuation: false };
    currentBudget -= cost;
  } else {
    let cIndex = 0;
    while (cIndex < noFurtherTreatmentPatients.length) {
      const isCont = cIndex > 0;
      const availableRows = Math.floor((currentBudget - SECTION_HEADER_COST - SECTION_GAP) / ROW_COST);

      if (availableRows < 2 && (currentPage.section1 || currentPage.section2 || currentPage.section3)) {
        startNewPage();
        continue;
      }

      const chunkSize = Math.max(1, Math.min(Math.max(2, availableRows), noFurtherTreatmentPatients.length - cIndex));
      const chunk = noFurtherTreatmentPatients.slice(cIndex, cIndex + chunkSize);

      currentPage.section2 = {
        items: chunk,
        startIndex: cIndex,
        isContinuation: isCont,
      };

      currentBudget -= (SECTION_HEADER_COST + chunk.length * ROW_COST + SECTION_GAP);
      cIndex += chunkSize;

      if (cIndex < noFurtherTreatmentPatients.length) {
        startNewPage();
      }
    }
  }

  // 3. Process Section 3 (Residents Not Seen)
  if (unseenPatients.length === 0) {
    const cost = SECTION_HEADER_COST + EMPTY_SECTION_COST + SECTION_GAP;
    if (currentBudget < cost && (currentPage.section1 || currentPage.section2 || currentPage.section3)) {
      startNewPage();
    }
    currentPage.section3 = { items: [], startIndex: 0, isContinuation: false };
    currentBudget -= cost;
  } else {
    let uIndex = 0;
    while (uIndex < unseenPatients.length) {
      const isCont = uIndex > 0;
      const availableRows = Math.floor((currentBudget - SECTION_HEADER_COST - SECTION_GAP) / ROW_COST);

      if (availableRows < 2 && (currentPage.section1 || currentPage.section2 || currentPage.section3)) {
        startNewPage();
        continue;
      }

      const chunkSize = Math.max(1, Math.min(Math.max(2, availableRows), unseenPatients.length - uIndex));
      const chunk = unseenPatients.slice(uIndex, uIndex + chunkSize);

      currentPage.section3 = {
        items: chunk,
        startIndex: uIndex,
        isContinuation: isCont,
      };

      currentBudget -= (SECTION_HEADER_COST + chunk.length * ROW_COST + SECTION_GAP);
      uIndex += chunkSize;

      if (uIndex < unseenPatients.length) {
        startNewPage();
      }
    }
  }

  pages.push(currentPage);
  return pages;
}

export const CareHomeReport: React.FC<CareHomeReportProps> = ({ summary }) => {
  // Patients requiring invoicing / further action (wax removal, full hearing test, or billable treatment)
  const treatmentPatients = summary.seenPatients.filter(
    (p) => p.hasEarWax || p.audiogram || p.totalAmount > 0
  );

  // Patients assessed where no further treatment is needed (routine check clear)
  const noFurtherTreatmentPatients = summary.seenPatients.filter(
    (p) => !p.hasEarWax && !p.audiogram && p.totalAmount === 0
  );

  const hasTreatmentDob = treatmentPatients.some((p) => !isPlaceholderDob(p.dob));
  const hasClearDob = noFurtherTreatmentPatients.some((p) => !isPlaceholderDob(p.dob));
  const hasUnseenDob = summary.unseenPatients.some((p) => !isPlaceholderDob(p.dob));

  const pages = paginateAudiologyReport(
    treatmentPatients,
    noFurtherTreatmentPatients,
    summary.unseenPatients
  );
  const totalPages = pages.length;

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {pages.map((page, pageIdx) => (
        <div
          key={pageIdx}
          className="a4-page p-8 font-sans text-slate-800 flex flex-col justify-between text-xs leading-relaxed"
        >
          <div>
            {/* Document Header (Page 1: Full; Page 2+: Compact Continuation) */}
            {page.isFirstPage ? (
              <>
                <div className="flex items-center justify-between border-b-2 border-brand-navy pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src="./logo.png"
                      alt="EliteSight HomeCare"
                      width="48"
                      height="48"
                      className="h-12 w-12 object-contain flex-shrink-0"
                      style={{ width: '48px', height: '48px', minWidth: '48px', maxWidth: '48px', maxHeight: '48px', objectFit: 'contain' }}
                    />
                    <div>
                      <h1 className="text-xl font-bold text-brand-navy uppercase tracking-tight">
                        Care Home Ear &amp; Hearing Visit Summary
                      </h1>
                      <p className="text-[11px] text-slate-500 font-medium">{COMPANY_DETAILS.subtitle}</p>
                    </div>
                  </div>
                  <div className="text-right text-[11px]">
                    <div className="font-semibold text-brand-navy text-sm">{summary.careHome}</div>
                    <div className="text-slate-600">{summary.postCode || 'Care Home Visit'}</div>
                    <div className="text-slate-500 mt-0.5">Date: <span className="font-semibold text-slate-700">{summary.appointmentDate}</span></div>
                    <div className="text-slate-500">Audiologist: <span className="font-semibold text-slate-700">{summary.audiologist}</span></div>
                  </div>
                </div>

                {/* Top Summary KPI Ribbon */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="bg-brand-soft border border-brand-soft-dark rounded-md p-2.5 text-center">
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-brand-navy">Total Residents</div>
                    <div className="text-lg font-bold text-brand-navy mt-0.5">{summary.totalPatients}</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-2.5 text-center">
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-blue-900">Treatment / Invoiced</div>
                    <div className="text-lg font-bold text-blue-700 mt-0.5">{treatmentPatients.length}</div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-md p-2.5 text-center">
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-emerald-800">All Clear (No Action)</div>
                    <div className="text-lg font-bold text-emerald-700 mt-0.5">{noFurtherTreatmentPatients.length}</div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-2.5 text-center">
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-amber-800">Residents Not Seen</div>
                    <div className="text-lg font-bold text-amber-700 mt-0.5">{summary.unseenPatientsCount}</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between border-b border-brand-navy/30 pb-2.5 mb-4">
                <div className="flex items-center gap-2.5">
                  <img
                    src="./logo.png"
                    alt="EliteSight HomeCare"
                    width="32"
                    height="32"
                    className="h-8 w-8 object-contain flex-shrink-0"
                    style={{ width: '32px', height: '32px', minWidth: '32px', maxWidth: '32px', maxHeight: '32px', objectFit: 'contain' }}
                  />
                  <div>
                    <h2 className="text-sm font-bold text-brand-navy uppercase tracking-tight">
                      Care Home Ear &amp; Hearing Visit Summary (Cont.)
                    </h2>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {summary.careHome} • {summary.appointmentDate} • Audiologist: {summary.audiologist}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-brand-soft text-brand-navy border border-brand-soft-dark px-2.5 py-0.5 rounded text-[10px] font-bold">
                    Page {pageIdx + 1} of {totalPages}
                  </span>
                </div>
              </div>
            )}

            {/* SECTION 1: Treatment Needed & Invoices */}
            {page.section1 && (
              <div className="mb-4">
                <div className="flex items-center justify-between bg-brand-navy text-white px-3 py-1.5 rounded-t-md">
                  <h2 className="font-bold text-xs uppercase tracking-wider">
                    Section 1: Treatment Needed &amp; Invoices {page.section1.isContinuation ? '(Continued)' : ''}
                  </h2>
                  <span className="text-[10px] font-medium text-brand-soft">
                    {page.section1.isContinuation
                      ? `Residents ${page.section1.startIndex + 1} - ${page.section1.startIndex + page.section1.items.length} of ${treatmentPatients.length}`
                      : `${treatmentPatients.length} Resident(s)`}
                  </span>
                </div>
                <div className="border border-t-0 border-slate-200 rounded-b-md overflow-hidden bg-white">
                  {page.section1.items.length > 0 ? (
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-brand-soft text-brand-navy font-semibold border-b border-slate-200">
                          <th className="py-1.5 px-3 w-8">#</th>
                          <th className="py-1.5 px-3">Resident Name</th>
                          {hasTreatmentDob && <th className="py-1.5 px-3">DOB</th>}
                          <th className="py-1.5 px-3">Invoice No</th>
                          <th className="py-1.5 px-3">Services Provided</th>
                          <th className="py-1.5 px-3">Next Step / Advice</th>
                          <th className="py-1.5 px-3 text-center w-20">Status</th>
                          <th className="py-1.5 px-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {page.section1.items.map((p, idx) => {
                          const services: string[] = [];
                          if (p.hasEarWax) services.push('Wax Removal (£80)');
                          if (p.audiogram) services.push('Full Hearing Test (£50)');
                          if (p.screening && !p.hasEarWax && !p.audiogram) services.push('Hearing Screening (Free)');
                          if (p.isHalfPrice) services.push('50% Off');
                          const servicesText = services.length > 0 ? services.join(', ') : 'Ear & Hearing Visit';

                          return (
                            <tr key={p.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                              <td className="py-1.5 px-3 text-slate-400 font-mono">{page.section1!.startIndex + idx + 1}</td>
                              <td className="py-1.5 px-3 font-semibold text-slate-800">{p.residentFullName}</td>
                              {hasTreatmentDob && <td className="py-1.5 px-3 text-slate-600">{formatDobDisplay(p.dob)}</td>}
                              <td className="py-1.5 px-3 font-mono font-medium text-brand-blue">{p.invoiceNo}</td>
                              <td className="py-1.5 px-3 text-slate-700 font-medium">{servicesText}</td>
                              <td className="py-1.5 px-3 text-slate-600">
                                {p.nextStep || (p.hasEarWax ? '2-Week Olive Oil Drops / Wax Removal' : 'Hearing Aid Check')}
                              </td>
                              <td className="py-1.5 px-3 text-center">
                                {p.isPaid ? (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    ✓ Paid
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                    Due (7d)
                                  </span>
                                )}
                              </td>
                              <td className="py-1.5 px-3 text-right font-semibold text-slate-900">£{p.totalAmount.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-3 text-center text-slate-500 italic">
                      No billable treatments or invoices required for this visit round.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SECTION 2: All Clear (No Further Action Needed) */}
            {page.section2 && (
              <div className="mb-4">
                <div className="flex items-center justify-between bg-brand-navy text-white px-3 py-1.5 rounded-t-md">
                  <h2 className="font-bold text-xs uppercase tracking-wider">
                    Section 2: All Clear (No Action Needed) {page.section2.isContinuation ? '(Continued)' : ''}
                  </h2>
                  <span className="text-[10px] font-medium text-brand-soft">
                    {page.section2.isContinuation
                      ? `Residents ${page.section2.startIndex + 1} - ${page.section2.startIndex + page.section2.items.length} of ${noFurtherTreatmentPatients.length}`
                      : `${noFurtherTreatmentPatients.length} Resident(s)`}
                  </span>
                </div>
                <div className="border border-t-0 border-slate-200 rounded-b-md overflow-hidden bg-white">
                  {page.section2.items.length > 0 ? (
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                          <th className="py-1.5 px-3 w-8">#</th>
                          <th className="py-1.5 px-3">Resident Name</th>
                          {hasClearDob && <th className="py-1.5 px-3">DOB</th>}
                          <th className="py-1.5 px-3">Check Result</th>
                          <th className="py-1.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {page.section2.items.map((p, idx) => (
                          <tr key={p.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                            <td className="py-1.5 px-3 text-slate-400 font-mono">{page.section2!.startIndex + idx + 1}</td>
                            <td className="py-1.5 px-3 font-semibold text-slate-800">{p.residentFullName}</td>
                            {hasClearDob && <td className="py-1.5 px-3 text-slate-600">{formatDobDisplay(p.dob)}</td>}
                            <td className="py-1.5 px-3 text-slate-600">
                              {p.hearingTestResult || 'Routine check clear. Ear canals healthy.'}
                            </td>
                            <td className="py-1.5 px-3 text-emerald-700 font-medium">
                              ✓ All Clear
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-3 text-center text-slate-500 italic">
                      All assessed residents required follow-up or treatment.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SECTION 3: Residents Not Seen */}
            {page.section3 && (
              <div className="mb-4">
                <div className="flex items-center justify-between bg-brand-navy text-white px-3 py-1.5 rounded-t-md">
                  <h2 className="font-bold text-xs uppercase tracking-wider">
                    Section 3: Residents Not Seen {page.section3.isContinuation ? '(Continued)' : ''}
                  </h2>
                  <span className="text-[10px] font-medium text-brand-soft">
                    {page.section3.isContinuation
                      ? `Residents ${page.section3.startIndex + 1} - ${page.section3.startIndex + page.section3.items.length} of ${summary.unseenPatients.length}`
                      : `${summary.unseenPatients.length} Resident(s)`}
                  </span>
                </div>
                <div className="border border-t-0 border-slate-200 rounded-b-md overflow-hidden bg-white">
                  {page.section3.items.length > 0 ? (
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-amber-50/70 text-amber-900 font-semibold border-b border-amber-200">
                          <th className="py-1.5 px-3 w-8">#</th>
                          <th className="py-1.5 px-3">Resident Name</th>
                          {hasUnseenDob && <th className="py-1.5 px-3">DOB</th>}
                          <th className="py-1.5 px-3">Reason Not Seen / Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-100">
                        {page.section3.items.map((p, idx) => (
                          <tr key={p.id} className="bg-amber-50/20">
                            <td className="py-1.5 px-3 text-amber-700/60 font-mono">{page.section3!.startIndex + idx + 1}</td>
                            <td className="py-1.5 px-3 font-semibold text-slate-800">{p.residentFullName}</td>
                            {hasUnseenDob && <td className="py-1.5 px-3 text-slate-600">{formatDobDisplay(p.dob)}</td>}
                            <td className="py-1.5 px-3 text-amber-950 font-medium">
                              {p.reasonNotSeen || 'Not seen during scheduled visit - reschedule requested'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-3 text-center text-slate-500 italic">
                      All scheduled residents were successfully assessed.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Report Footer on Every Page */}
          <div className="border-t border-slate-200 pt-3 mt-auto text-[10px] text-slate-500 flex justify-between items-end">
            <div className="space-y-0.5">
              <div>
                <span className="font-semibold text-slate-700">{COMPANY_DETAILS.name}</span>
                <span className="text-slate-400 mx-1.5">•</span>
                <span>Co. Reg: {COMPANY_DETAILS.regNo}</span>
              </div>
              <div className="text-slate-500">{COMPANY_DETAILS.address}</div>
            </div>
            <div className="text-center font-semibold text-brand-navy">
              Page {pageIdx + 1} of {totalPages}
            </div>
            <div className="text-right space-y-0.5 font-medium text-slate-600">
              <div>Tel: <span className="text-slate-700 font-semibold">{COMPANY_DETAILS.phone}</span></div>
              <div className="text-slate-500">{COMPANY_DETAILS.email}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};


