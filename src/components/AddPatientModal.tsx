import React, { useState, useEffect } from 'react';
import { CareHomeSummary, PatientRow } from '../types/audiology';
import { createNewPatient } from '../utils/csvParser';
import { calculateLineItems, calculateTotalAmount } from '../utils/pricing';
import {
  UserPlus,
  X,
  Calendar,
  User,
  Building,
  MapPin,
  Stethoscope,
  FileText,
  Receipt,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPatient: (newPatient: PatientRow) => void;
  summary: CareHomeSummary | null;
  existingCount: number;
}

export const AddPatientModal: React.FC<AddPatientModalProps> = ({
  isOpen,
  onClose,
  onAddPatient,
  summary,
  existingCount,
}) => {
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [dob, setDob] = useState('');
  const [careHome, setCareHome] = useState(summary?.careHome || 'Care Home');
  const [postCode, setPostCode] = useState(summary?.postCode || '');
  const [appointmentDate, setAppointmentDate] = useState(
    summary?.appointmentDate || new Date().toLocaleDateString('en-GB')
  );
  const [audiologist, setAudiologist] = useState(summary?.audiologist || 'Sarah Jenkins');

  const [seen, setSeen] = useState(true);
  const [reasonNotSeen, setReasonNotSeen] = useState('');
  const [screening, setScreening] = useState(true);
  const [audiogram, setAudiogram] = useState(false);
  const [leftEarWax, setLeftEarWax] = useState(false);
  const [rightEarWax, setRightEarWax] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Sync with summary when summary updates
  useEffect(() => {
    if (summary) {
      setCareHome(summary.careHome || 'Care Home');
      setPostCode(summary.postCode || '');
      setAppointmentDate(summary.appointmentDate || new Date().toLocaleDateString('en-GB'));
      setAudiologist(summary.audiologist || 'Sarah Jenkins');
    }
  }, [summary]);

  if (!isOpen) return null;

  // Calculate live estimated total for modal display
  const lineItems = seen ? calculateLineItems(screening, audiogram, leftEarWax, rightEarWax) : [];
  const estimatedTotal = calculateTotalAmount(lineItems);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName.trim()) {
      setError('Resident First Name is required.');
      return;
    }
    if (!surname.trim()) {
      setError('Resident Surname is required.');
      return;
    }
    if (!dob.trim()) {
      setError('Date of Birth (DOB) is required.');
      return;
    }

    try {
      const newPatient = createNewPatient({
        careHome,
        postCode,
        appointmentDate,
        dob,
        audiologist,
        residentFirstName: firstName,
        residentSurname: surname,
        seen,
        reasonNotSeen: seen ? '' : reasonNotSeen || 'Resident unavailable or declined visit',
        screening: seen ? screening : false,
        audiogram: seen ? audiogram : false,
        leftEarWax: seen ? leftEarWax : false,
        rightEarWax: seen ? rightEarWax : false,
        notes,
        indexOffset: existingCount,
      });

      onAddPatient(newPatient);
      // Reset form
      setFirstName('');
      setSurname('');
      setDob('');
      setSeen(true);
      setReasonNotSeen('');
      setScreening(true);
      setAudiogram(false);
      setLeftEarWax(false);
      setRightEarWax(false);
      setNotes('');
      setError(null);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create resident record.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-scaleUp">
        {/* Modal Header */}
        <div className="bg-brand-navy text-white px-4 sm:px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <UserPlus className="w-5 h-5 text-brand-soft" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Add Resident Record</h2>
              <p className="text-xs text-slate-300">
                Register a new resident walk-in or add to the current roster
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Care Home Context Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
            <div>
              <span className="text-slate-400 block font-medium">Care Home:</span>
              <strong className="text-slate-800 font-semibold">{careHome}</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Visit Date:</span>
              <strong className="text-slate-800 font-semibold">{appointmentDate}</strong>
            </div>
          </div>

          {/* Patient Details */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
              Resident Demographics
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Margaret"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Surname <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Thatcher"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">
                  Date of Birth (DOB) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="DD/MM/YYYY (e.g. 14/03/1938)"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Assessment / Seen Status */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
              Consultation Status
            </h3>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSeen(true)}
                className={`flex-1 py-2 px-3 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition ${
                  seen
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <CheckCircle2 className={`w-4 h-4 ${seen ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>Seen / Assessed</span>
              </button>

              <button
                type="button"
                onClick={() => setSeen(false)}
                className={`flex-1 py-2 px-3 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition ${
                  !seen
                    ? 'bg-amber-50 border-amber-500 text-amber-800 ring-1 ring-amber-500'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <AlertCircle className={`w-4 h-4 ${!seen ? 'text-amber-600' : 'text-slate-400'}`} />
                <span>Not Seen / Unwell</span>
              </button>
            </div>

            {!seen && (
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Reason Not Seen
                </label>
                <input
                  type="text"
                  placeholder="e.g. Unwell in bed / Hospitalized / Declined"
                  value={reasonNotSeen}
                  onChange={(e) => setReasonNotSeen(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
            )}
          </div>

          {/* Clinical Services (if seen) */}
          {seen && (
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                  Clinical Services &amp; Invoicing
                </h3>
                <span className="font-bold text-brand-navy text-xs">
                  Est. Total: £{estimatedTotal.toFixed(2)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Screening */}
                <button
                  type="button"
                  onClick={() => setScreening(!screening)}
                  className={`p-2.5 rounded-lg border text-left transition flex items-center justify-between ${
                    screening
                      ? 'bg-brand-soft border-brand-blue text-brand-navy font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold">Routine Screening</div>
                    <div className="text-[10px] text-slate-500">£0.00 (Complimentary)</div>
                  </div>
                  <span className={`text-xs ${screening ? 'text-brand-blue' : 'text-slate-300'}`}>
                    ●
                  </span>
                </button>

                {/* Full Hearing Test */}
                <button
                  type="button"
                  onClick={() => setAudiogram(!audiogram)}
                  className={`p-2.5 rounded-lg border text-left transition flex items-center justify-between ${
                    audiogram
                      ? 'bg-brand-soft border-brand-blue text-brand-navy font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold">Full Hearing Test</div>
                    <div className="text-[10px] text-brand-blue font-bold">£50.00</div>
                  </div>
                  <span className={`text-xs ${audiogram ? 'text-brand-blue' : 'text-slate-300'}`}>
                    ●
                  </span>
                </button>

                {/* Left Ear Wax */}
                <button
                  type="button"
                  onClick={() => setLeftEarWax(!leftEarWax)}
                  className={`p-2.5 rounded-lg border text-left transition flex items-center justify-between ${
                    leftEarWax
                      ? 'bg-amber-50 border-amber-500 text-amber-900 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold">Left Ear Wax</div>
                    <div className="text-[10px] text-amber-700 font-bold">
                      {rightEarWax ? 'Included in £80 Flat' : '£80.00 Removal'}
                    </div>
                  </div>
                  <span className={`text-xs ${leftEarWax ? 'text-amber-600' : 'text-slate-300'}`}>
                    ●
                  </span>
                </button>

                {/* Right Ear Wax */}
                <button
                  type="button"
                  onClick={() => setRightEarWax(!rightEarWax)}
                  className={`p-2.5 rounded-lg border text-left transition flex items-center justify-between ${
                    rightEarWax
                      ? 'bg-amber-50 border-amber-500 text-amber-900 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold">Right Ear Wax</div>
                    <div className="text-[10px] text-amber-700 font-bold">
                      {leftEarWax ? 'Included in £80 Flat' : '£80.00 Removal'}
                    </div>
                  </div>
                  <span className={`text-xs ${rightEarWax ? 'text-amber-600' : 'text-slate-300'}`}>
                    ●
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Clinical Notes */}
          <div className="space-y-1 pt-2 border-t border-slate-200">
            <label className="block text-slate-700 font-semibold">
              Clinical Notes &amp; Consultation Remarks
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Cerumen removed bilaterally via microsuction. Advised 2-week olive oil softening for remaining flakes."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          {/* Actions Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-brand-blue hover:bg-brand-blue-hover rounded-lg shadow-sm transition flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add to Roster</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
