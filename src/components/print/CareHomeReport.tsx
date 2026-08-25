import React from 'react';
import { CareHomeSummary } from '../../types/audiology';
import { COMPANY_DETAILS } from '../../utils/constants';

interface CareHomeReportProps {
  summary: CareHomeSummary;
}

export const CareHomeReport: React.FC<CareHomeReportProps> = ({ summary }) => {
  const dischargedPatients = summary.seenPatients.filter(
    (p) => !p.hasEarWax && !p.audiogram
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

        {/* Top KPI Ribbon */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          <div className="bg-brand-soft border border-brand-soft-dark rounded-md p-2.5 text-center">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-brand-navy">Total Patients</div>
            <div className="text-lg font-bold text-brand-navy mt-0.5">{summary.totalPatients}</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-md p-2.5 text-center">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-emerald-800">Seen / Assessed</div>
            <div className="text-lg font-bold text-emerald-700 mt-0.5">{summary.seenPatientsCount}</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-md p-2.5 text-center">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-amber-800">Exceptions / Unseen</div>
            <div className="text-lg font-bold text-amber-700 mt-0.5">{summary.unseenPatientsCount}</div>
          </div>
          <div className="bg-brand-navy text-white rounded-md p-2.5 text-center">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-brand-soft">Total Visit Value</div>
            <div className="text-lg font-bold text-white mt-0.5">£{summary.totalRevenue.toFixed(2)}</div>
          </div>
        </div>

        {/* SECTION 1: Financial & Billing Summary */}
        <div className="mb-5">
          <div className="flex items-center justify-between bg-brand-navy text-white px-3 py-1.5 rounded-t-md">
            <h2 className="font-bold text-xs uppercase tracking-wider">Section 1: Financial &amp; Billing Summary</h2>
            <span className="text-[10px] font-medium text-brand-soft">Terms: 7 Days from Visit</span>
          </div>
          <div className="border border-t-0 border-slate-200 rounded-b-md overflow-hidden">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-brand-soft text-brand-navy font-semibold border-b border-slate-200">
                  <th className="py-1.5 px-3 w-8">#</th>
                  <th className="py-1.5 px-3">Resident Name</th>
                  <th className="py-1.5 px-3">DOB</th>
                  <th className="py-1.5 px-3">Invoice No</th>
                  <th className="py-1.5 px-3">Services Conducted</th>
                  <th className="py-1.5 px-3 text-center w-24">Status</th>
                  <th className="py-1.5 px-3 text-right">Amount (GBP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.seenPatients.map((p, idx) => {
                  const services: string[] = [];
                  if (p.screening) services.push('Screening (Free)');
                  if (p.hasEarWax) services.push('Wax Removal (£80)');
                  if (p.audiogram) services.push('Audiogram (£50)');
                  const servicesText = services.length > 0 ? services.join(', ') : 'Otoscopy Check';

                  return (
                    <tr key={p.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                      <td className="py-1 px-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-1 px-3 font-semibold text-slate-800">{p.residentFullName}</td>
                      <td className="py-1 px-3 text-slate-600">{p.dob}</td>
                      <td className="py-1 px-3 font-mono font-medium text-brand-blue">{p.invoiceNo}</td>
                      <td className="py-1 px-3 text-slate-700">{servicesText}</td>
                      <td className="py-1 px-3 text-center">
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
                      <td className="py-1 px-3 text-right font-semibold text-slate-900">£{p.totalAmount.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-brand-soft/80 border-t-2 border-brand-navy font-bold text-brand-navy text-xs">
                  <td colSpan={6} className="py-2 px-3 text-right uppercase tracking-wider">
                    Care Home Grand Total Billed:
                  </td>
                  <td className="py-2 px-3 text-right text-brand-navy text-sm font-extrabold">
                    £{summary.totalRevenue.toFixed(2)}
                  </td>
                </tr>
                {(summary.totalPaidRevenue > 0 || summary.totalPendingRevenue > 0) && (
                  <tr className="bg-slate-100 text-[10px] text-slate-600 border-t border-slate-200">
                    <td colSpan={7} className="py-1.5 px-3 text-right">
                      <span className="text-emerald-800 font-semibold">
                        Collected / Paid ({summary.paidInvoicesCount}): £{summary.totalPaidRevenue.toFixed(2)}
                      </span>
                      <span className="mx-2 text-slate-300">|</span>
                      <span className="text-amber-800 font-semibold">
                        Outstanding Balance ({summary.unpaidInvoicesCount}): £{summary.totalPendingRevenue.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                )}
              </tfoot>
            </table>
          </div>
        </div>

        {/* SECTION 2: Clinical Diagnostic Breakdown */}
        <div className="mb-5">
          <div className="bg-brand-navy text-white px-3 py-1.5 rounded-t-md">
            <h2 className="font-bold text-xs uppercase tracking-wider">Section 2: Clinical Diagnostic Breakdown</h2>
          </div>
          <div className="border border-t-0 border-slate-200 rounded-b-md p-3 bg-white grid grid-cols-3 gap-3">
            <div className="border border-slate-200 rounded p-2 bg-slate-50/50">
              <div className="font-semibold text-slate-700">Screenings Conducted</div>
              <div className="text-base font-bold text-brand-blue mt-0.5">{summary.screeningsCount}</div>
              <p className="text-[10px] text-slate-500 mt-1">Initial otoscopy &amp; threshold evaluation</p>
            </div>
            <div className="border border-slate-200 rounded p-2 bg-slate-50/50">
              <div className="font-semibold text-slate-700">Audiograms Performed</div>
              <div className="text-base font-bold text-brand-blue mt-0.5">{summary.audiogramsCount}</div>
              <p className="text-[10px] text-slate-500 mt-1">Pure tone diagnostic assessment</p>
            </div>
            <div className="border border-slate-200 rounded p-2 bg-slate-50/50">
              <div className="font-semibold text-slate-700">Ear Wax Cases Managed</div>
              <div className="text-base font-bold text-brand-blue mt-0.5">{summary.waxRemovalCount}</div>
              <p className="text-[10px] text-slate-500 mt-1">Micro-suction / irrigation candidates</p>
            </div>
          </div>
        </div>

        {/* SECTION 3: Exceptions & Discharges */}
        <div>
          <div className="bg-brand-navy text-white px-3 py-1.5 rounded-t-md">
            <h2 className="font-bold text-xs uppercase tracking-wider">Section 3: Exceptions &amp; Discharges</h2>
          </div>
          <div className="border border-t-0 border-slate-200 rounded-b-md p-3 bg-white space-y-3">
            {/* Unseen Residents */}
            <div>
              <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                Unseen Residents / Reschedule Required ({summary.unseenPatients.length})
              </div>
              {summary.unseenPatients.length > 0 ? (
                <table className="w-full text-left text-[11px] border border-amber-200 rounded overflow-hidden">
                  <thead className="bg-amber-50 text-amber-900 font-semibold border-b border-amber-200">
                    <tr>
                      <th className="py-1 px-2.5">Resident</th>
                      <th className="py-1 px-2.5">DOB</th>
                      <th className="py-1 px-2.5">Reason Not Seen / Action Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100">
                    {summary.unseenPatients.map((p) => (
                      <tr key={p.id} className="bg-amber-50/30">
                        <td className="py-1 px-2.5 font-semibold text-slate-800">{p.residentFullName}</td>
                        <td className="py-1 px-2.5 text-slate-600">{p.dob}</td>
                        <td className="py-1 px-2.5 text-amber-950">{p.reasonNotSeen || 'Not seen during scheduled round'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-[10px] text-slate-500 italic">All scheduled residents were successfully assessed.</p>
              )}
            </div>

            {/* Discharged Residents */}
            <div>
              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                Discharged / Routine 12-Month Review ({dischargedPatients.length})
              </div>
              <p className="text-[11px] text-slate-600">
                {dischargedPatients.length > 0
                  ? dischargedPatients.map((p) => p.residentFullName).join(', ')
                  : 'None'}
              </p>
            </div>
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
