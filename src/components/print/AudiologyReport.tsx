import React from 'react';
import { PatientRow } from '../../types/audiology';
import { COMPANY_DETAILS } from '../../utils/constants';

interface AudiologyReportProps {
  patient: PatientRow;
}

export const AudiologyReport: React.FC<AudiologyReportProps> = ({ patient }) => {
  return (
    <div className="font-sans text-slate-800 text-xs">
      {/* PAGE 1: Clinical Ear & Hearing Summary */}
      <div className="a4-page p-8 md:p-10 flex flex-col justify-between leading-relaxed">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-brand-navy pb-3 mb-4">
            <div className="flex items-center gap-3">
              <img src="./logo.png" alt="EliteSight HomeCare" className="h-11 w-11 object-contain" />
              <div>
                <h1 className="text-lg font-extrabold text-brand-navy uppercase tracking-tight">
                  Ear &amp; Hearing Care Summary
                </h1>
                <p className="text-[10px] text-slate-500 font-semibold tracking-wider">
                  CLINICAL AUDIOLOGICAL ASSESSMENT
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block bg-brand-soft text-brand-navy border border-brand-soft-dark px-2.5 py-1 rounded font-mono font-bold text-xs">
                Ref: {patient.reportRef}
              </span>
            </div>
          </div>

          {/* Metadata Ribbon */}
          <div className="bg-brand-soft border border-brand-soft-dark rounded-md px-3.5 py-2 mb-4 grid grid-cols-3 gap-2 text-[11px]">
            <div>
              <span className="text-slate-500">Care Home: </span>
              <strong className="text-brand-navy font-semibold">{patient.careHome}</strong>
            </div>
            <div>
              <span className="text-slate-500">Completed Date: </span>
              <strong className="text-brand-navy font-semibold">{patient.appointmentDate}</strong>
            </div>
            <div>
              <span className="text-slate-500">Audiologist: </span>
              <strong className="text-brand-navy font-semibold">{patient.audiologist}</strong>
            </div>
          </div>

          {/* Patient Info Grid */}
          <div className="border border-slate-200 rounded-md p-3 bg-white mb-4 grid grid-cols-3 gap-y-2 gap-x-4 text-[11px]">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Resident Name</span>
              <span className="font-bold text-slate-900 text-sm">{patient.residentFullName}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Date of Birth</span>
              <span className="font-semibold text-slate-700">{patient.dob}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Visit Date</span>
              <span className="font-semibold text-slate-700">{patient.appointmentDate}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Report Reference</span>
              <span className="font-mono text-brand-blue font-semibold">{patient.reportRef}</span>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Next Clinical Step</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-brand-navy">
                <span className="w-2 h-2 rounded-full bg-brand-blue"></span>
                {patient.nextStep || 'Routine review in 12 months'}
              </span>
            </div>
          </div>

          {/* Ear Check Findings (Left vs Right) */}
          <div className="mb-4">
            <div className="bg-brand-navy text-white px-3 py-1.5 rounded-t-md font-bold text-xs uppercase tracking-wider flex items-center justify-between">
              <span>Otoscopic Ear Examination Findings</span>
              <span className="text-[10px] font-normal text-brand-soft">Direct Visualization</span>
            </div>
            <div className="border border-t-0 border-slate-200 rounded-b-md p-3 bg-white grid grid-cols-2 gap-3">
              {/* Left Ear */}
              <div className={`p-3 rounded-md border ${patient.leftEarWax ? 'bg-amber-50/60 border-amber-200' : 'bg-slate-50/70 border-slate-200'}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${patient.leftEarWax ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                    LEFT EAR (AS)
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${patient.leftEarWax ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                    {patient.leftEarWax ? 'Cerumen Present' : 'Canal Clear'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 leading-snug">
                  {patient.leftEarFinding || 'External canal and tympanic membrane inspected.'}
                </p>
              </div>

              {/* Right Ear */}
              <div className={`p-3 rounded-md border ${patient.rightEarWax ? 'bg-amber-50/60 border-amber-200' : 'bg-slate-50/70 border-slate-200'}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${patient.rightEarWax ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                    RIGHT EAR (AD)
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${patient.rightEarWax ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                    {patient.rightEarWax ? 'Cerumen Present' : 'Canal Clear'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 leading-snug">
                  {patient.rightEarFinding || 'External canal and tympanic membrane inspected.'}
                </p>
              </div>
            </div>
          </div>

          {/* Hearing Test Box */}
          <div className="mb-4">
            <div className="bg-brand-navy text-white px-3 py-1.5 rounded-t-md font-bold text-xs uppercase tracking-wider flex items-center justify-between">
              <span>Hearing Assessment &amp; Audiometry</span>
              <span className="text-[10px] font-normal text-brand-soft">
                {patient.audiogram ? 'Diagnostic Full Hearing Test Completed' : patient.screening ? 'Routine Screening' : 'Otoscopy Only'}
              </span>
            </div>
            <div className="border border-t-0 border-slate-200 rounded-b-md p-3 bg-white">
              <p className="text-[11px] text-slate-800 font-medium mb-2">
                {patient.hearingTestResult || 'Hearing functionality and response evaluated during consultation.'}
              </p>
              <div className="flex items-center gap-4 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className={`w-3 h-3 rounded-full flex items-center justify-center text-[9px] font-bold ${patient.screening ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {patient.screening ? '✓' : '–'}
                  </span>
                  <span className="text-slate-700">Hearing Screening</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-3 h-3 rounded-full flex items-center justify-center text-[9px] font-bold ${patient.audiogram ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {patient.audiogram ? '✓' : '–'}
                  </span>
                  <span className="text-slate-700">Pure-Tone Diagnostic Full Hearing Test</span>
                </div>
                {patient.audiogramImageUrl && (
                  <span className="text-brand-blue font-semibold text-[10px] ml-auto">
                    * Attached Full Hearing Test Chart on Page 2
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Summary & Recommendations */}
          <div className="mb-4">
            <div className="bg-brand-navy text-white px-3 py-1.5 rounded-t-md font-bold text-xs uppercase tracking-wider">
              <span>Clinical Summary &amp; Recommendations</span>
            </div>
            <div className="border border-t-0 border-slate-200 rounded-b-md p-3 bg-white">
              <p className="text-[11px] text-slate-700 leading-relaxed mb-2">
                {patient.recommendations || 'Patient comfortable. Follow-up plan established with care staff.'}
              </p>
              {patient.notes && (
                <div className="bg-slate-50 border-l-2 border-brand-blue p-2 text-[10px] text-slate-600 italic">
                  <strong>Clinical Note:</strong> {patient.notes}
                </div>
              )}
            </div>
          </div>

          {/* Conditional Earwax Preparation Block */}
          {patient.hasEarWax && (
            <div className="mb-4 border-2 border-amber-300 bg-amber-50/80 rounded-md p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-amber-800 font-extrabold text-xs uppercase tracking-wide">
                  ⚠️ 2-Week Olive Oil Earwax Softening Regimen
                </span>
                <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-bold">
                  Care Staff Action Required
                </span>
              </div>
              <p className="text-[11px] text-amber-950 leading-snug">
                For optimal, safe cerumen removal, administer <strong>2 to 3 drops of medical-grade olive oil (Earol or pipette drops)</strong> into the affected ear(s) <strong>twice daily for 14 consecutive days</strong> prior to secondary instrumentation / irrigation. Do not insert cotton buds into ear canals.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-300 pt-3 mt-4 text-[10px] text-slate-500 flex justify-between items-center">
          <div>
            <span className="font-semibold text-slate-700">{COMPANY_DETAILS.name}</span> | Reg No: {COMPANY_DETAILS.regNo} | {COMPANY_DETAILS.address}
          </div>
          <div className="font-medium text-slate-600">
            Tel: {COMPANY_DETAILS.phone} | {COMPANY_DETAILS.email}
          </div>
        </div>
      </div>

      {/* PAGE 2: Optional Full Hearing Test Chart Container */}
      {patient.audiogramImageUrl && (
        <div className="a4-page p-8 md:p-10 flex flex-col justify-between page-break leading-relaxed">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-brand-navy pb-3 mb-4">
              <div className="flex items-center gap-3">
                <img src="./logo.png" alt="EliteSight HomeCare" className="h-10 w-10 object-contain" />
                <div>
                  <h1 className="text-base font-extrabold text-brand-navy uppercase tracking-tight">
                    Pure-Tone Full Hearing Test Chart
                  </h1>
                  <p className="text-[10px] text-slate-500 font-semibold">
                    CLINICAL DIAGNOSTIC ATTACHMENT
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
                Diagnostic full hearing test recording hearing thresholds (dB HL vs Frequency Hz)
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-300 pt-3 mt-4 text-[10px] text-slate-500 flex justify-between items-center">
            <div>
              <span className="font-semibold text-slate-700">{COMPANY_DETAILS.name}</span> | Reg No: {COMPANY_DETAILS.regNo}
            </div>
            <div className="font-medium text-slate-600">
              Page 2 of 2 (Diagnostic Attachment)
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
