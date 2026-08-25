import React from 'react';
import { CareHomeSummary } from '../../types/audiology';
import { COMPANY_DETAILS } from '../../utils/constants';

interface CareHomeReportProps {
  summary: CareHomeSummary;
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

  return (
    <div className="a4-page p-8 md:p-10 font-sans text-slate-800 flex flex-col justify-between text-xs leading-relaxed">
      <div>
        {/* Document Header */}
        <div className="flex items-center justify-between border-b-2 border-brand-navy pb-4 mb-5">
          <div className="flex items-center gap-3">
            <img src="./logo.png" alt="EliteSight HomeCare" className="h-12 w-12 object-contain" />
            <div>
              <h1 className="text-xl font-bold text-brand-navy uppercase tracking-tight">Care Home Audiology Report</h1>
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

        {/* Top Clinical KPI Ribbon (Non-Financial) */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          <div className="bg-brand-soft border border-brand-soft-dark rounded-md p-2.5 text-center">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-brand-navy">Total Patients</div>
            <div className="text-lg font-bold text-brand-navy mt-0.5">{summary.totalPatients}</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-2.5 text-center">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-blue-900">Treatment / Invoiced</div>
            <div className="text-lg font-bold text-blue-700 mt-0.5">{treatmentPatients.length}</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-md p-2.5 text-center">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-emerald-800">No Action Needed</div>
            <div className="text-lg font-bold text-emerald-700 mt-0.5">{noFurtherTreatmentPatients.length}</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-md p-2.5 text-center">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-amber-800">Patients Not Seen</div>
            <div className="text-lg font-bold text-amber-700 mt-0.5">{summary.unseenPatientsCount}</div>
          </div>
        </div>

        {/* SECTION 1: Invoices & Further Treatment */}
        <div className="mb-5">
          <div className="flex items-center justify-between bg-brand-navy text-white px-3 py-1.5 rounded-t-md">
            <h2 className="font-bold text-xs uppercase tracking-wider">Section 1: Invoices &amp; Further Treatment</h2>
            <span className="text-[10px] font-medium text-brand-soft">{treatmentPatients.length} Resident(s)</span>
          </div>
          <div className="border border-t-0 border-slate-200 rounded-b-md overflow-hidden bg-white">
            {treatmentPatients.length > 0 ? (
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-brand-soft text-brand-navy font-semibold border-b border-slate-200">
                    <th className="py-1.5 px-3 w-8">#</th>
                    <th className="py-1.5 px-3">Resident Name</th>
                    <th className="py-1.5 px-3">DOB</th>
                    <th className="py-1.5 px-3">Invoice No</th>
                    <th className="py-1.5 px-3">Services Conducted</th>
                    <th className="py-1.5 px-3">Clinical Next Step / Regimen</th>
                    <th className="py-1.5 px-3 text-center w-20">Status</th>
                    <th className="py-1.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {treatmentPatients.map((p, idx) => {
                    const services: string[] = [];
                    if (p.hasEarWax) services.push('Wax Removal (£80)');
                    if (p.audiogram) services.push('Full Hearing Test (£50)');
                    if (p.screening && !p.hasEarWax && !p.audiogram) services.push('Screening (Free)');
                    const servicesText = services.length > 0 ? services.join(', ') : 'Audiological Consultation';

                    return (
                      <tr key={p.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                        <td className="py-1.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-1.5 px-3 font-semibold text-slate-800">{p.residentFullName}</td>
                        <td className="py-1.5 px-3 text-slate-600">{p.dob}</td>
                        <td className="py-1.5 px-3 font-mono font-medium text-brand-blue">{p.invoiceNo}</td>
                        <td className="py-1.5 px-3 text-slate-700 font-medium">{servicesText}</td>
                        <td className="py-1.5 px-3 text-slate-600">
                          {p.nextStep || (p.hasEarWax ? '2-Week Olive Oil Regimen / Follow-up' : 'Hearing Aid Review')}
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

        {/* SECTION 2: No Further Treatment */}
        <div className="mb-5">
          <div className="flex items-center justify-between bg-brand-navy text-white px-3 py-1.5 rounded-t-md">
            <h2 className="font-bold text-xs uppercase tracking-wider">Section 2: No Further Treatment</h2>
            <span className="text-[10px] font-medium text-brand-soft">{noFurtherTreatmentPatients.length} Resident(s)</span>
          </div>
          <div className="border border-t-0 border-slate-200 rounded-b-md overflow-hidden bg-white">
            {noFurtherTreatmentPatients.length > 0 ? (
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="py-1.5 px-3 w-8">#</th>
                    <th className="py-1.5 px-3">Resident Name</th>
                    <th className="py-1.5 px-3">DOB</th>
                    <th className="py-1.5 px-3">Assessment Finding</th>
                    <th className="py-1.5 px-3">Clinical Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {noFurtherTreatmentPatients.map((p, idx) => (
                    <tr key={p.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="py-1.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-1.5 px-3 font-semibold text-slate-800">{p.residentFullName}</td>
                      <td className="py-1.5 px-3 text-slate-600">{p.dob}</td>
                      <td className="py-1.5 px-3 text-slate-600">
                        {p.hearingTestResult || 'Routine screening clear. Normal otoscopy.'}
                      </td>
                      <td className="py-1.5 px-3 text-emerald-700 font-medium">
                        ✓ Discharged / Routine 12-Month Recall
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-3 text-center text-slate-500 italic">
                All assessed residents required clinical follow-up or treatment.
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: Patients Not Seen */}
        <div className="mb-4">
          <div className="flex items-center justify-between bg-brand-navy text-white px-3 py-1.5 rounded-t-md">
            <h2 className="font-bold text-xs uppercase tracking-wider">Section 3: Patients Not Seen</h2>
            <span className="text-[10px] font-medium text-brand-soft">{summary.unseenPatients.length} Resident(s)</span>
          </div>
          <div className="border border-t-0 border-slate-200 rounded-b-md overflow-hidden bg-white">
            {summary.unseenPatients.length > 0 ? (
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-amber-50/70 text-amber-900 font-semibold border-b border-amber-200">
                    <th className="py-1.5 px-3 w-8">#</th>
                    <th className="py-1.5 px-3">Resident Name</th>
                    <th className="py-1.5 px-3">DOB</th>
                    <th className="py-1.5 px-3">Reason Not Seen / Action Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {summary.unseenPatients.map((p, idx) => (
                    <tr key={p.id} className="bg-amber-50/20">
                      <td className="py-1.5 px-3 text-amber-700/60 font-mono">{idx + 1}</td>
                      <td className="py-1.5 px-3 font-semibold text-slate-800">{p.residentFullName}</td>
                      <td className="py-1.5 px-3 text-slate-600">{p.dob}</td>
                      <td className="py-1.5 px-3 text-amber-950 font-medium">
                        {p.reasonNotSeen || 'Not seen during scheduled round - reschedule requested'}
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
      </div>

      {/* Report Footer */}
      <div className="border-t border-slate-300 pt-3 mt-4 text-[10px] text-slate-500 flex justify-between items-center">
        <div>
          <span className="font-semibold text-slate-700">{COMPANY_DETAILS.name}</span> | Reg No: {COMPANY_DETAILS.regNo} | {COMPANY_DETAILS.address}
        </div>
        <div className="font-medium text-slate-600">
          Tel: {COMPANY_DETAILS.phone} | {COMPANY_DETAILS.email}
        </div>
      </div>
    </div>
  );
};

