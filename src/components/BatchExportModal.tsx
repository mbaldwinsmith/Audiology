import React from 'react';
import { Archive, CheckCircle2, Loader2, X, FileText, Receipt, Building } from 'lucide-react';

export interface BatchExportProgressState {
  isOpen: boolean;
  isCompleted: boolean;
  percent: number;
  current: number;
  total: number;
  status: string;
  itemTitle: string;
}

interface BatchExportModalProps {
  progress: BatchExportProgressState;
  onClose: () => void;
}

export const BatchExportModal: React.FC<BatchExportModalProps> = ({
  progress,
  onClose,
}) => {
  if (!progress.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 overflow-hidden relative">
        {/* Close button if completed */}
        {progress.isCompleted && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            progress.isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-brand-soft text-brand-navy'
          }`}>
            {progress.isCompleted ? (
              <CheckCircle2 className="w-6 h-6 animate-bounce" />
            ) : (
              <Archive className="w-6 h-6 animate-pulse text-brand-blue" />
            )}
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900">
              {progress.isCompleted ? 'Batch Export Complete!' : 'Exporting Batch PDFs (ZIP)...'}
            </h3>
            <p className="text-xs text-slate-500">
              {progress.isCompleted
                ? 'Your ZIP package with all individually named PDFs is downloaded.'
                : 'Rendering high-resolution A4 PDFs in browser memory...'}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2 my-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span className="truncate pr-2">{progress.status}</span>
            <span className="font-mono text-brand-blue font-bold">{progress.percent}%</span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                progress.isCompleted
                  ? 'bg-emerald-500'
                  : 'bg-gradient-to-r from-brand-navy via-brand-blue to-cyan-500'
              }`}
              style={{ width: `${progress.percent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>
              Document {progress.current} of {progress.total}
            </span>
            <span className="font-medium text-slate-600 truncate max-w-[200px]">
              {progress.itemTitle}
            </span>
          </div>
        </div>

        {/* ZIP Structure Visual Info */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 space-y-1.5 mb-5 font-mono text-[11px]">
          <div className="font-bold text-slate-800 flex items-center gap-1.5 font-sans text-xs">
            <span>📁 Package Structure:</span>
          </div>
          <div className="text-slate-700 flex items-center gap-1.5 pl-2">
            <Building className="w-3.5 h-3.5 text-brand-blue" />
            <span>[Care Home] - Care Home Summary.pdf</span>
          </div>
          <div className="text-slate-700 flex items-center gap-1.5 pl-2">
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            <span>Reports/[Resident Name] - Ear &amp; Hearing Summary.pdf</span>
          </div>
          <div className="text-slate-700 flex items-center gap-1.5 pl-2">
            <Receipt className="w-3.5 h-3.5 text-amber-600" />
            <span>Invoices/[Resident Name] - Invoice.pdf</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end">
          {progress.isCompleted ? (
            <button
              onClick={onClose}
              className="bg-brand-navy hover:bg-brand-navy-dark text-white text-xs font-semibold px-5 py-2 rounded-lg shadow transition"
            >
              Done
            </button>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-500 italic">
              <Loader2 className="w-4 h-4 animate-spin text-brand-blue" />
              <span>Processing client-side (GDPR Zero-Retention)...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
