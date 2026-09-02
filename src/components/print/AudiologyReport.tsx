import React from 'react';
import { PatientRow } from '../../types/audiology';
import { COMPANY_DETAILS } from '../../utils/constants';
import { formatDobDisplay } from '../../utils/cleaners';

interface AudiologyReportProps {
  patient: PatientRow;
}

export const AudiologyReport: React.FC<AudiologyReportProps> = ({ patient }) => {
  // Clean recommendations string if it duplicated notes
  const displayRec = patient.recommendations
    ? patient.recommendations.replace(/\s*Note:\s*.*$/i, '').trim()
    : 'Resident comfortable. Care plan discussed with staff.';

  return (
    <div className="font-sans text-slate-800 text-xs">
      {/* PAGE 1: Resident Ear & Hearing Summary */}
      <div className="a4-page p-8 flex flex-col justify-between leading-relaxed">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-brand-navy pb-3.5 mb-4.5">
            <div className="flex items-center gap-3">
              <img src="./logo.png" alt="EliteSight HomeCare" className="h-11 w-11 object-contain" />
              <div>
                <h1 className="text-lg font-extrabold text-brand-navy uppercase tracking-tight leading-tight">
                  Ear &amp; Hearing Care Summary
                </h1>
                <p className="text-[10px] text-slate-500 font-semibold tracking-wider">
                  RESIDENT EAR &amp; HEARING RECORD
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block bg-brand-soft text-brand-navy border border-brand-soft-dark px-3 py-1 rounded font-mono font-bold text-xs shadow-xs">
                Ref: {patient.reportRef}
              </span>
            </div>
          </div>

          {/* Metadata Ribbon */}
          <div className="bg-brand-soft border border-brand-soft-dark rounded-md px-4 py-2.5 mb-4.5 grid grid-cols-3 gap-2 text-[11px]">
            <div className="text-left">
              <span className="text-slate-500">Care Home: </span>
              <strong className="text-brand-navy font-semibold">{patient.careHome}</strong>
            </div>
            <div className="text-center">
              <span className="text-slate-500">Visit Date: </span>
              <strong className="text-brand-navy font-semibold">{patient.appointmentDate}</strong>
            </div>
            <div className="text-right">
              <span className="text-slate-500">Audiologist: </span>
              <strong className="text-brand-navy font-semibold">{patient.audiologist}</strong>
            </div>
          </div>

          {/* Patient Info Grid */}
          <div className="border border-slate-200 rounded-md p-3.5 bg-white mb-4.5 grid grid-cols-3 gap-y-3 gap-x-4 text-[11px]">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Resident Name</span>
              <span className="font-bold text-slate-900 text-sm block">{patient.residentFullName}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Date of Birth</span>
              <span className="font-semibold text-slate-700 block">{formatDobDisplay(patient.dob)}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Visit Date</span>
              <span className="font-semibold text-slate-700 block">{patient.appointmentDate}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Report Reference</span>
              <span className="font-mono text-brand-blue font-semibold block">{patient.reportRef}</span>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Next Step</span>
              <div className="flex items-center gap-1.5 font-semibold text-brand-navy">
                <span className="w-2 h-2 rounded-full bg-brand-blue flex-shrink-0"></span>
                <span>{patient.nextStep || 'Routine review in 12 months'}</span>
              </div>
            </div>
          </div>

          {/* Ear Check Findings (Left vs Right) */}
          <div className="mb-4.5">
            <div className="bg-brand-navy text-white px-3.5 py-1.5 rounded-t-md font-bold text-xs uppercase tracking-wider flex items-center justify-between">
              <span>Ear Check Results</span>
              <span className="text-[10px] font-normal text-brand-soft">Visual Check</span>
            </div>
            <div className="border border-t-0 border-slate-200 rounded-b-md p-3.5 bg-white grid grid-cols-2 gap-3.5">
              {/* Left Ear */}
              {(() => {
                const isLeftClear = patient.leftEarWax === 0;
                const isLeftMinor = patient.leftEarWax === 1;
                const isLeftModerate = patient.leftEarWax === 2;
                const cardBg = isLeftClear
                  ? 'bg-slate-50/70 border-slate-200'
                  : isLeftMinor
                  ? 'bg-amber-50/50 border-amber-200'
                  : isLeftModerate
                  ? 'bg-orange-50/60 border-orange-200'
                  : 'bg-rose-50/60 border-rose-200';
                const dotBg = isLeftClear
                  ? 'bg-emerald-500'
                  : isLeftMinor
                  ? 'bg-amber-500'
                  : isLeftModerate
                  ? 'bg-orange-500'
                  : 'bg-rose-600';
                const badgeClass = isLeftClear
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : isLeftMinor
                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                  : isLeftModerate
                  ? 'bg-orange-100 text-orange-800 border-orange-200'
                  : 'bg-rose-100 text-rose-800 border-rose-200';
                const label = isLeftClear
                  ? 'Canal Clear'
                  : isLeftMinor
                  ? 'Minor Ear Wax'
                  : isLeftModerate
                  ? 'Moderate Ear Wax'
                  : 'Severe Ear Wax';

                return (
                  <div className={`p-3 rounded-md border flex flex-col justify-between min-h-[90px] ${cardBg}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${dotBg}`}></span>
                        LEFT EAR
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${badgeClass}`}>
                        {label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-700 leading-snug flex-1">
                      {patient.leftEarFinding || 'Ear canal and eardrum checked.'}
                    </p>
                  </div>
                );
              })()}

              {/* Right Ear */}
              {(() => {
                const isRightClear = patient.rightEarWax === 0;
                const isRightMinor = patient.rightEarWax === 1;
                const isRightModerate = patient.rightEarWax === 2;
                const cardBg = isRightClear
                  ? 'bg-slate-50/70 border-slate-200'
                  : isRightMinor
                  ? 'bg-amber-50/50 border-amber-200'
                  : isRightModerate
                  ? 'bg-orange-50/60 border-orange-200'
                  : 'bg-rose-50/60 border-rose-200';
                const dotBg = isRightClear
                  ? 'bg-emerald-500'
                  : isRightMinor
                  ? 'bg-amber-500'
                  : isRightModerate
                  ? 'bg-orange-500'
                  : 'bg-rose-600';
                const badgeClass = isRightClear
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : isRightMinor
                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                  : isRightModerate
                  ? 'bg-orange-100 text-orange-800 border-orange-200'
                  : 'bg-rose-100 text-rose-800 border-rose-200';
                const label = isRightClear
                  ? 'Canal Clear'
                  : isRightMinor
                  ? 'Minor Ear Wax'
                  : isRightModerate
                  ? 'Moderate Ear Wax'
                  : 'Severe Ear Wax';

                return (
                  <div className={`p-3 rounded-md border flex flex-col justify-between min-h-[90px] ${cardBg}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${dotBg}`}></span>
                        RIGHT EAR
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${badgeClass}`}>
                        {label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-700 leading-snug flex-1">
                      {patient.rightEarFinding || 'Ear canal and eardrum checked.'}
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Hearing Test Box */}
          <div className="mb-4.5">
            <div className="bg-brand-navy text-white px-3.5 py-1.5 rounded-t-md font-bold text-xs uppercase tracking-wider flex items-center justify-between">
              <span>Hearing Assessment</span>
              <span className="text-[10px] font-normal text-brand-soft">
                {patient.audiogram ? 'Full Hearing Test Completed' : patient.screening ? 'Routine Hearing Screening' : 'Ear Check Only'}
              </span>
            </div>
            <div className="border border-t-0 border-slate-200 rounded-b-md p-3.5 bg-white">
              <p className="text-[11px] text-slate-800 font-medium mb-2.5">
                {patient.hearingTestResult || 'Hearing and sound responses checked during visit.'}
              </p>
              <div className="flex items-center gap-5 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${patient.screening ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {patient.screening ? (
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      '–'
                    )}
                  </span>
                  <span className="text-slate-700 font-medium">Hearing Screening</span>
                </div>
                {patient.audiogram && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold bg-emerald-600 text-white">
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="text-slate-700 font-medium">Full Hearing Test</span>
                  </div>
                )}
                {patient.audiogramImageUrl && (
                  <span className="text-brand-blue font-semibold text-[10px] ml-auto">
                    * Hearing Chart Attached on Page 2
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Summary & Recommendations */}
          <div className="mb-4.5">
            <div className="bg-brand-navy text-white px-3.5 py-1.5 rounded-t-md font-bold text-xs uppercase tracking-wider">
              <span>Summary &amp; Advice for Care Staff</span>
            </div>
            <div className="border border-t-0 border-slate-200 rounded-b-md p-3.5 bg-white space-y-2.5">
              <p className="text-[11px] text-slate-700 leading-relaxed">
                {displayRec}
              </p>
              {patient.notes && (
                <div className="bg-slate-50 border-l-3 border-brand-blue p-2.5 rounded-r text-[10.5px] text-slate-600">
                  <strong className="text-slate-700 font-semibold not-italic">Clinical Note:</strong>{' '}
                  <span className="italic">{patient.notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Conditional Earwax Preparation Block */}
          {patient.hasEarWax && (
            <div className="mb-4.5 border-2 border-amber-300 bg-amber-50/80 rounded-md p-3.5">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-amber-800 font-extrabold text-xs uppercase tracking-wide">
                  ⚠️ 2-Week Olive Oil Ear Drops Routine
                </span>
                <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-bold">
                  Care Staff Action
                </span>
              </div>
              <p className="text-[11px] text-amber-950 leading-relaxed">
                To gently soften the ear wax before removal, please put <strong>2 to 3 drops of medicinal olive oil (or Earol spray)</strong> into the affected ear(s) <strong>twice a day for 14 days</strong>. Please do not use cotton buds in the ears.
              </p>
            </div>
          )}
        </div>

        {/* Structured 2-Line Footer */}
        <div className="border-t border-slate-200 pt-3 mt-auto text-[10px] text-slate-500 flex justify-between items-end">
          <div className="space-y-0.5">
            <div>
              <span className="font-semibold text-slate-700">{COMPANY_DETAILS.name}</span>
              <span className="text-slate-400 mx-1.5">•</span>
              <span>Co. Reg: {COMPANY_DETAILS.regNo}</span>
            </div>
            <div className="text-slate-500">{COMPANY_DETAILS.address}</div>
          </div>
          <div className="text-right space-y-0.5 font-medium text-slate-600">
            <div>Tel: <span className="text-slate-700 font-semibold">{COMPANY_DETAILS.phone}</span></div>
            <div className="text-slate-500">{COMPANY_DETAILS.email}</div>
          </div>
        </div>
      </div>

      {/* PAGE 2: Optional Full Hearing Test Chart Container */}
      {patient.audiogramImageUrl && (
        <div className="a4-page p-8 flex flex-col justify-between page-break leading-relaxed">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-brand-navy pb-3.5 mb-4.5">
              <div className="flex items-center gap-3">
                <img src="./logo.png" alt="EliteSight HomeCare" className="h-10 w-10 object-contain" />
                <div>
                  <h1 className="text-base font-extrabold text-brand-navy uppercase tracking-tight">
                    Hearing Test Chart
                  </h1>
                  <p className="text-[10px] text-slate-500 font-semibold">
                    HEARING ASSESSMENT ATTACHMENT
                  </p>
                </div>
              </div>
              <div className="text-right text-[11px]">
                <div className="font-bold text-slate-900">{patient.residentFullName}</div>
                <div className="text-brand-blue font-mono">{patient.reportRef}</div>
              </div>
            </div>

            {/* Full Hearing Test Image Display */}
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 bg-white flex flex-col items-center justify-center min-h-[480px]">
              <img
                src={patient.audiogramImageUrl}
                alt="Full Hearing Test Chart"
                className="max-h-[440px] max-w-full object-contain rounded shadow-sm"
              />
              <p className="text-[10px] text-slate-400 mt-3 italic">
                Hearing chart showing hearing levels across sound frequencies
              </p>
            </div>
          </div>

          {/* Structured 2-Line Footer */}
          <div className="border-t border-slate-200 pt-3 mt-auto text-[10px] text-slate-500 flex justify-between items-end">
            <div className="space-y-0.5">
              <div>
                <span className="font-semibold text-slate-700">{COMPANY_DETAILS.name}</span>
                <span className="text-slate-400 mx-1.5">•</span>
                <span>Co. Reg: {COMPANY_DETAILS.regNo}</span>
              </div>
              <div className="text-slate-500">{COMPANY_DETAILS.address}</div>
            </div>
            <div className="text-right space-y-0.5 font-medium text-slate-600">
              <div>Tel: <span className="text-slate-700 font-semibold">{COMPANY_DETAILS.phone}</span></div>
              <div className="text-slate-500">Page 2 of 2 (Hearing Chart Attachment)</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

