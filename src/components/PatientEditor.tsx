import React, { useState } from 'react';
import { PatientRow } from '../types/audiology';
import { calculateLineItems, calculateTotalAmount } from '../utils/pricing';
import { AudiogramUploader } from './AudiogramUploader';
import { Edit3, FileText, Receipt, Trash2 } from 'lucide-react';
import { exportPatientReportPdf, exportPatientInvoicePdf } from '../utils/pdfGenerator';

interface PatientEditorProps {
  patient: PatientRow;
  onUpdatePatient: (updatedPatient: PatientRow) => void;
  onDeletePatient?: (patientId: string) => void;
}

export const PatientEditor: React.FC<PatientEditorProps> = ({
  patient,
  onUpdatePatient,
  onDeletePatient,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const handleDelete = () => {
    if (onDeletePatient) {
      onDeletePatient(patient.id);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3.5 sm:p-5 shadow-sm space-y-4 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-brand-blue flex-shrink-0" />
            <span>Edit Record: {patient.residentFullName}</span>
          </h3>
          <p className="text-[10px] sm:text-[11px] text-slate-500">
            Changes update preview documents immediately in-memory.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="font-mono text-brand-blue font-bold">{patient.reportRef}</span>
          <span className="text-slate-300">|</span>
          <span className="font-mono text-slate-600">{patient.invoiceNo}</span>
          {onDeletePatient && (
            <>
              <span className="text-slate-300">|</span>
              {showDeleteConfirm ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-2 py-0.5 bg-rose-600 text-white rounded font-bold text-[10px] hover:bg-rose-700 transition"
                  >
                    Confirm Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] hover:bg-slate-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 p-1 rounded transition"
                  title="Delete this resident record"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              )}
            </>
          )}
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
            className={`p-2 sm:p-2.5 rounded-md border text-left flex items-start justify-between transition min-h-[44px] ${
              patient.screening
                ? 'bg-brand-soft border-brand-blue text-brand-navy font-semibold'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div>
              <div className="text-[11px] sm:text-xs">Screening</div>
              <div className="text-[9px] sm:text-[10px] text-slate-500">£0.00 (Free)</div>
            </div>
            <span className={`text-xs ${patient.screening ? 'text-brand-blue' : 'text-slate-300'}`}>
              ●
            </span>
          </button>

          {/* Pure Tone Audiogram */}
          <button
            type="button"
            onClick={() => handleToggleService('audiogram')}
            className={`p-2 sm:p-2.5 rounded-md border text-left flex items-start justify-between transition min-h-[44px] ${
              patient.audiogram
                ? 'bg-brand-soft border-brand-blue text-brand-navy font-semibold'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div>
              <div className="text-[11px] sm:text-xs">Audiogram</div>
              <div className="text-[9px] sm:text-[10px] text-slate-500">£50.00</div>
            </div>
            <span className={`text-xs ${patient.audiogram ? 'text-brand-blue' : 'text-slate-300'}`}>
              ●
            </span>
          </button>

          {/* Left Ear Wax */}
          <button
            type="button"
            onClick={() => handleToggleService('leftEarWax')}
            className={`p-2 sm:p-2.5 rounded-md border text-left flex items-start justify-between transition min-h-[44px] ${
              patient.leftEarWax
                ? 'bg-amber-50 border-amber-400 text-amber-900 font-semibold'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div>
              <div className="text-[11px] sm:text-xs">Left Ear Wax</div>
              <div className="text-[9px] sm:text-[10px] text-slate-500">£80 (Flat Fee)</div>
            </div>
            <span className={`text-xs ${patient.leftEarWax ? 'text-amber-600' : 'text-slate-300'}`}>
              ●
            </span>
          </button>

          {/* Right Ear Wax */}
          <button
            type="button"
            onClick={() => handleToggleService('rightEarWax')}
            className={`p-2 sm:p-2.5 rounded-md border text-left flex items-start justify-between transition min-h-[44px] ${
              patient.rightEarWax
                ? 'bg-amber-50 border-amber-400 text-amber-900 font-semibold'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div>
              <div className="text-[11px] sm:text-xs">Right Ear Wax</div>
              <div className="text-[9px] sm:text-[10px] text-slate-500">£80 (Flat Fee)</div>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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

      {/* PDF Export Shortcuts */}
      <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <span className="text-[10px] sm:text-[11px] text-slate-500 italic">
          Export individual files named with patient name &amp; ref:
        </span>
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
          <button
            type="button"
            onClick={() => exportPatientReportPdf(patient)}
            className="flex items-center justify-center gap-1.5 bg-brand-soft hover:bg-brand-soft-hover text-brand-navy border border-brand-soft-dark px-2.5 py-1.5 rounded text-[11px] sm:text-xs font-semibold transition shadow-sm min-h-[36px]"
            title="Download this resident's Ear & Hearing Summary as PDF"
          >
            <FileText className="w-3.5 h-3.5 text-brand-blue flex-shrink-0" />
            <span>Download Report</span>
          </button>
          <button
            type="button"
            onClick={() => exportPatientInvoicePdf(patient)}
            className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-2.5 py-1.5 rounded text-[11px] sm:text-xs font-semibold transition shadow-sm min-h-[36px]"
            title="Download this resident's Itemized Invoice as PDF"
          >
            <Receipt className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
            <span>Download Invoice</span>
          </button>
        </div>
      </div>
    </div>
  );
};
