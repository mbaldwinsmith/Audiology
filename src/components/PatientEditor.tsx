import React, { useState } from 'react';
import { PatientRow, EarWaxLevel, EAR_WAX_LABELS } from '../types/audiology';
import { calculateLineItems, calculateTotalAmount, calculateGrossSubtotal, calculateDiscountAmount } from '../utils/pricing';
import { AudiogramUploader } from './AudiogramUploader';
import { Edit3, FileText, Receipt, Trash2, CreditCard, CheckCircle2, Clock, Percent, Sparkles } from 'lucide-react';
import { exportPatientReportPdf, exportPatientInvoicePdf } from '../utils/pdfGenerator';

interface PatientEditorProps {
  patient: PatientRow;
  onUpdatePatient: (updatedPatient: PatientRow) => void;
  onDeletePatient?: (patientId: string) => void;
}

const WAX_LEVELS: { level: EarWaxLevel; label: string; activeClass: string; dotClass: string }[] = [
  {
    level: 0,
    label: 'Clear',
    activeClass: 'bg-emerald-500 text-white border-emerald-600 shadow-xs',
    dotClass: 'bg-emerald-500',
  },
  {
    level: 1,
    label: 'Minor',
    activeClass: 'bg-amber-500 text-white border-amber-600 shadow-xs',
    dotClass: 'bg-amber-500',
  },
  {
    level: 2,
    label: 'Moderate',
    activeClass: 'bg-orange-500 text-white border-orange-600 shadow-xs',
    dotClass: 'bg-orange-500',
  },
  {
    level: 3,
    label: 'Severe',
    activeClass: 'bg-rose-600 text-white border-rose-700 shadow-xs',
    dotClass: 'bg-rose-600',
  },
];

export const PatientEditor: React.FC<PatientEditorProps> = ({
  patient,
  onUpdatePatient,
  onDeletePatient,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleToggleService = (field: 'screening' | 'audiogram') => {
    const updated = { ...patient, [field]: !patient[field] };
    updated.lineItems = calculateLineItems(
      updated.screening,
      updated.audiogram,
      updated.leftEarWax,
      updated.rightEarWax,
      updated.isHalfPrice
    );
    updated.totalAmount = calculateTotalAmount(updated.lineItems);
    updated.discountAmount = updated.isHalfPrice ? calculateDiscountAmount(updated.lineItems) : 0;
    onUpdatePatient(updated);
  };

  const handleEarWaxChange = (side: 'leftEarWax' | 'rightEarWax', level: EarWaxLevel) => {
    const updated = { ...patient, [side]: level };
    updated.hasEarWax = updated.leftEarWax >= 2 || updated.rightEarWax >= 2;
    updated.lineItems = calculateLineItems(
      updated.screening,
      updated.audiogram,
      updated.leftEarWax,
      updated.rightEarWax,
      updated.isHalfPrice
    );
    updated.totalAmount = calculateTotalAmount(updated.lineItems);
    updated.discountAmount = updated.isHalfPrice ? calculateDiscountAmount(updated.lineItems) : 0;
    onUpdatePatient(updated);
  };

  const handleToggleHalfPrice = () => {
    const nextHalfPrice = !patient.isHalfPrice;
    const updated = { ...patient, isHalfPrice: nextHalfPrice };
    updated.lineItems = calculateLineItems(
      updated.screening,
      updated.audiogram,
      updated.leftEarWax,
      updated.rightEarWax,
      nextHalfPrice
    );
    updated.totalAmount = calculateTotalAmount(updated.lineItems);
    updated.discountAmount = nextHalfPrice ? calculateDiscountAmount(updated.lineItems) : 0;
    onUpdatePatient(updated);
  };

  const handleFieldChange = (field: keyof PatientRow, value: any) => {
    onUpdatePatient({ ...patient, [field]: value });
  };

  const handleTogglePaid = (isPaid: boolean) => {
    onUpdatePatient({
      ...patient,
      isPaid,
      paymentMethod: isPaid ? (patient.paymentMethod || 'SumUp Card Reader') : '',
      paymentDate: isPaid ? (patient.paymentDate || patient.appointmentDate) : '',
      paymentRef: isPaid ? (patient.paymentRef || '') : '',
    });
  };

  const handleDelete = () => {
    if (onDeletePatient) {
      onDeletePatient(patient.id);
      setShowDeleteConfirm(false);
    }
  };

  const grossSubtotal = calculateGrossSubtotal(patient.lineItems);
  const potentialSavings = Number((grossSubtotal * 0.5).toFixed(2));

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

      {/* Service Toggles & Hearing Tests */}
      <div>
        <label className="font-bold text-slate-700 block uppercase tracking-wider text-[10px] mb-2">
          Hearing Tests &amp; Checks
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Screening */}
          <button
            type="button"
            onClick={() => handleToggleService('screening')}
            className={`p-2.5 rounded-md border text-left flex items-start justify-between transition min-h-[44px] ${
              patient.screening
                ? 'bg-brand-soft border-brand-blue text-brand-navy font-semibold'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div>
              <div className="text-[11px] sm:text-xs">Routine Screening</div>
              <div className="text-[9px] sm:text-[10px] text-slate-500">£0.00 (Complimentary)</div>
            </div>
            <span className={`text-xs ${patient.screening ? 'text-brand-blue font-bold' : 'text-slate-300'}`}>
              ●
            </span>
          </button>

          {/* Full Hearing Test */}
          <button
            type="button"
            onClick={() => handleToggleService('audiogram')}
            className={`p-2.5 rounded-md border text-left flex items-start justify-between transition min-h-[44px] ${
              patient.audiogram
                ? 'bg-brand-soft border-brand-blue text-brand-navy font-semibold'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div>
              <div className="text-[11px] sm:text-xs">Full Hearing Test</div>
              <div className="text-[9px] sm:text-[10px] text-slate-500">£50.00 Invoiced</div>
            </div>
            <span className={`text-xs ${patient.audiogram ? 'text-brand-blue font-bold' : 'text-slate-300'}`}>
              ●
            </span>
          </button>
        </div>
      </div>

      {/* Ear Wax Findings (0 to 3 Integer Scale) */}
      <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-3 sm:p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <label className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
            Ear Check &amp; Ear Wax Level (0–3 Scale)
          </label>
          <span className="text-[10px] text-slate-500">
            {patient.hasEarWax ? (
              <span className="font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                £80.00 Flat Fee Removal Active
              </span>
            ) : (
              <span className="text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                No Removal Required (£0)
              </span>
            )}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Left Ear Wax */}
          <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-[11px]">LEFT EAR</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                patient.leftEarWax === 0
                  ? 'bg-emerald-100 text-emerald-800'
                  : patient.leftEarWax === 1
                  ? 'bg-amber-100 text-amber-800'
                  : patient.leftEarWax === 2
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {patient.leftEarWax} – {EAR_WAX_LABELS[patient.leftEarWax]}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1">
              {WAX_LEVELS.map(({ level, label, activeClass }) => {
                const isActive = patient.leftEarWax === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => handleEarWaxChange('leftEarWax', level)}
                    className={`py-1.5 px-1 rounded text-center transition border font-semibold text-[10px] ${
                      isActive
                        ? activeClass
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold">{level}</div>
                    <div className="text-[9px] font-normal leading-tight">{label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Ear Wax */}
          <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-[11px]">RIGHT EAR</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                patient.rightEarWax === 0
                  ? 'bg-emerald-100 text-emerald-800'
                  : patient.rightEarWax === 1
                  ? 'bg-amber-100 text-amber-800'
                  : patient.rightEarWax === 2
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {patient.rightEarWax} – {EAR_WAX_LABELS[patient.rightEarWax]}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1">
              {WAX_LEVELS.map(({ level, label, activeClass }) => {
                const isActive = patient.rightEarWax === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => handleEarWaxChange('rightEarWax', level)}
                    className={`py-1.5 px-1 rounded text-center transition border font-semibold text-[10px] ${
                      isActive
                        ? activeClass
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold">{level}</div>
                    <div className="text-[9px] font-normal leading-tight">{label}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 50% Half-Price Discount Control Card */}
      <div className={`border rounded-lg p-3 sm:p-3.5 space-y-2.5 transition ${
        patient.isHalfPrice
          ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-400/40'
          : 'bg-slate-50/80 border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <label className="font-bold text-slate-800 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <Percent className={`w-3.5 h-3.5 ${patient.isHalfPrice ? 'text-emerald-600' : 'text-brand-blue'}`} />
                <span>Half Price Discount (50% Off)</span>
              </label>
              {patient.isHalfPrice && (
                <span className="bg-emerald-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>50% Active</span>
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">
              Apply a 50% half-priced discount on billable services (Wax Removal &amp; Full Hearing Test).
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleHalfPrice}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 shadow-xs ${
              patient.isHalfPrice
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>{patient.isHalfPrice ? 'Remove 50% Discount' : 'Apply 50% Half Price'}</span>
          </button>
        </div>

        {/* Financial Breakdown Ribbon */}
        <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-3 text-slate-600">
            <span>
              Service Subtotal: <strong className="text-slate-800">£{grossSubtotal.toFixed(2)}</strong>
            </span>
            {patient.isHalfPrice && (
              <span className="text-emerald-700 font-semibold">
                Discount: <strong>-£{(patient.discountAmount || 0).toFixed(2)}</strong>
              </span>
            )}
          </div>
          <div className="font-bold text-brand-navy text-xs">
            Net Invoiced: <span className="text-sm font-extrabold text-brand-blue">£{patient.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Payment & Receipt Status Section */}
      <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-3 sm:p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
            <CreditCard className="w-3.5 h-3.5 text-brand-blue" />
            <span>Invoice Payment Status &amp; Receipt</span>
          </label>

          {/* Paid / Unpaid Segmented Control */}
          <div className="flex items-center bg-white border border-slate-300 rounded-lg p-0.5 shadow-xs w-fit">
            <button
              type="button"
              onClick={() => handleTogglePaid(false)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                !patient.isPaid
                  ? 'bg-amber-100 text-amber-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3 h-3 text-amber-700" />
              <span>Due (Unpaid)</span>
            </button>
            <button
              type="button"
              onClick={() => handleTogglePaid(true)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                patient.isPaid
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-200" />
              <span>Paid in Full</span>
            </button>
          </div>
        </div>

        {/* Payment Details (Shown when Paid is active) */}
        {patient.isPaid && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-200/80">
            <div>
              <label className="font-semibold text-slate-700 block text-[11px] mb-1">Payment Method</label>
              <select
                value={patient.paymentMethod || 'SumUp Card Reader'}
                onChange={(e) => handleFieldChange('paymentMethod', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-medium text-slate-800 focus:ring-1 focus:ring-brand-blue outline-none"
              >
                <option value="SumUp Card Reader">SumUp Card Reader</option>
                <option value="BACS Bank Transfer">BACS Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="Care Home Account">Care Home Account</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block text-[11px] mb-1">Payment Date</label>
              <input
                type="text"
                placeholder="DD/MM/YYYY"
                value={patient.paymentDate || patient.appointmentDate}
                onChange={(e) => handleFieldChange('paymentDate', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-brand-blue outline-none"
              >
              </input>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block text-[11px] mb-1">Auth / Transaction Ref</label>
              <input
                type="text"
                placeholder="e.g. SUMUP-839120"
                value={patient.paymentRef || ''}
                onChange={(e) => handleFieldChange('paymentRef', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-brand-blue outline-none"
              />
            </div>
          </div>
        )}
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
          <label className="font-semibold text-slate-700 block mb-1">Left Ear Notes</label>
          <textarea
            rows={2}
            value={patient.leftEarFinding || ''}
            onChange={(e) => handleFieldChange('leftEarFinding', e.target.value)}
            className="w-full border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-brand-blue outline-none"
          />
        </div>

        {/* Right Ear Finding */}
        <div>
          <label className="font-semibold text-slate-700 block mb-1">Right Ear Notes</label>
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
          <label className="font-semibold text-slate-700 block mb-1">Next Step</label>
          <input
            type="text"
            value={patient.nextStep || ''}
            onChange={(e) => handleFieldChange('nextStep', e.target.value)}
            className="w-full border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-brand-blue outline-none"
          />
        </div>

        {/* Recommendations */}
        <div className="sm:col-span-2">
          <label className="font-semibold text-slate-700 block mb-1">Summary &amp; Advice for Care Staff</label>
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
