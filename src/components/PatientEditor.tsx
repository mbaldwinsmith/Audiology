import React from 'react';
import { PatientRow, InvoiceLineItem } from '../types/audiology';
import { calculateLineItems, calculateTotalAmount } from '../utils/pricing';
import { AudiogramUploader } from './AudiogramUploader';
import { Edit3, CheckCircle, AlertTriangle } from 'lucide-react';

interface PatientEditorProps {
  patient: PatientRow;
  onUpdatePatient: (updatedPatient: PatientRow) => void;
}

export const PatientEditor: React.FC<PatientEditorProps> = ({
  patient,
  onUpdatePatient,
}) => {
  const handleToggleService = (field: 'screening' | 'audiogram' | 'leftEarWax' | 'rightEarWax') => {
    const updated = { ...patient, [field]: !patient[field] };
    updated.hasEarWax = updated.leftEarWax || updated.rightEarWax;
    updated.lineItems = calculateLineItems(
      updated.screening,
      updated.audiogram,
      updated.leftEarWax,
      updated.rightEarWax
    );
    updated.totalAmount = calculateTotalAmount(updated.lineItems);
    onUpdatePatient(updated);
  };

  const handleFieldChange = (field: keyof PatientRow, value: any) => {
    onUpdatePatient({ ...patient, [field]: value });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4 text-xs">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-brand-blue" />
            Edit Clinical &amp; Invoice Record: {patient.residentFullName}
          </h3>
          <p className="text-[11px] text-slate-500">
            Changes update preview documents immediately in-memory.
          </p>
        </div>
        <div className="text-right">
          <span className="font-mono text-brand-blue font-bold">{patient.reportRef}</span>
          <span className="mx-2 text-slate-300">|</span>
          <span className="font-mono text-slate-600">{patient.invoiceNo}</span>
        </div>
      </div>

      {/* Service Toggles & Pricing Quick-Toggles */}
      <div>
        <label className="font-bold text-slate-700 block uppercase tracking-wider text-[10px] mb-2">
          Billable Clinical Services Conducted
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Screening */}
          <button
            type="button"
            onClick={() => handleToggleService('screening')}
            className={`p-2.5 rounded-md border text-left flex items-start justify-between transition ${
              patient.screening
                ? 'bg-brand-soft border-brand-blue text-brand-navy font-semibold'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div>
              <div className="text-xs">Hearing Screening</div>
              <div className="text-[10px] text-slate-500">£0.00 (Free)</div>
            </div>
            <span className={`text-xs ${patient.screening ? 'text-brand-blue' : 'text-slate-300'}`}>
              ●
            </span>
          </button>

          {/* Pure Tone Audiogram */}
          <button
            type="button"
            onClick={() => handleToggleService('audiogram')}
            className={`p-2.5 rounded-md border text-left flex items-start justify-between transition ${
              patient.audiogram
                ? 'bg-brand-soft border-brand-blue text-brand-navy font-semibold'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div>
              <div className="text-xs">Audiogram</div>
              <div className="text-[10px] text-slate-500">£50.00</div>
            </div>
            <span className={`text-xs ${patient.audiogram ? 'text-brand-blue' : 'text-slate-300'}`}>
              ●
            </span>
          </button>

          {/* Left Ear Wax */}
          <button
            type="button"
            onClick={() => handleToggleService('leftEarWax')}
            className={`p-2.5 rounded-md border text-left flex items-start justify-between transition ${
              patient.leftEarWax
                ? 'bg-amber-50 border-amber-400 text-amber-900 font-semibold'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div>
              <div className="text-xs">Left Ear Wax</div>
              <div className="text-[10px] text-slate-500">£80.00 (Flat Fee)</div>
            </div>
            <span className={`text-xs ${patient.leftEarWax ? 'text-amber-600' : 'text-slate-300'}`}>
              ●
            </span>
          </button>

          {/* Right Ear Wax */}
          <button
            type="button"
            onClick={() => handleToggleService('rightEarWax')}
            className={`p-2.5 rounded-md border text-left flex items-start justify-between transition ${
              patient.rightEarWax
                ? 'bg-amber-50 border-amber-400 text-amber-900 font-semibold'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div>
              <div className="text-xs">Right Ear Wax</div>
              <div className="text-[10px] text-slate-500">£80.00 (Flat Fee)</div>
            </div>
            <span className={`text-xs ${patient.rightEarWax ? 'text-amber-600' : 'text-slate-300'}`}>
              ●
            </span>
          </button>
        </div>
      </div>

      {/* Audiogram Image Uploader */}
      <AudiogramUploader
        currentImageUrl={patient.audiogramImageUrl}
        onImageChange={(url) => handleFieldChange('audiogramImageUrl', url)}
        patientName={patient.residentFullName}
      />

      {/* Clinical Notes Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Left Ear Finding */}
        <div>
          <label className="font-semibold text-slate-700 block mb-1">Left Ear Finding (AS)</label>
          <textarea
            rows={2}
            value={patient.leftEarFinding || ''}
            onChange={(e) => handleFieldChange('leftEarFinding', e.target.value)}
            className="w-full border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-brand-blue outline-none"
          />
        </div>

        {/* Right Ear Finding */}
        <div>
          <label className="font-semibold text-slate-700 block mb-1">Right Ear Finding (AD)</label>
          <textarea
            rows={2}
            value={patient.rightEarFinding || ''}
            onChange={(e) => handleFieldChange('rightEarFinding', e.target.value)}
            className="w-full border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-brand-blue outline-none"
          />
        </div>

        {/* Hearing Test Result */}
        <div>
          <label className="font-semibold text-slate-700 block mb-1">Hearing Test Result</label>
          <input
            type="text"
            value={patient.hearingTestResult || ''}
            onChange={(e) => handleFieldChange('hearingTestResult', e.target.value)}
            className="w-full border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-brand-blue outline-none"
          />
        </div>

        {/* Next Step */}
        <div>
          <label className="font-semibold text-slate-700 block mb-1">Next Clinical Step</label>
          <input
            type="text"
            value={patient.nextStep || ''}
            onChange={(e) => handleFieldChange('nextStep', e.target.value)}
            className="w-full border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-brand-blue outline-none"
          />
        </div>

        {/* Recommendations */}
        <div className="sm:col-span-2">
          <label className="font-semibold text-slate-700 block mb-1">Clinical Summary &amp; Recommendations</label>
          <textarea
            rows={2}
            value={patient.recommendations || ''}
            onChange={(e) => handleFieldChange('recommendations', e.target.value)}
            className="w-full border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-brand-blue outline-none"
          />
        </div>
      </div>
    </div>
  );
};
