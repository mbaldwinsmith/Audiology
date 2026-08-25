import React, { useRef } from 'react';
import {
  Upload,
  Sparkles,
  Download,
  ShieldCheck,
  Building,
  FileText,
  Receipt,
} from 'lucide-react';
import { generateCsvTemplate } from '../utils/csvParser';

interface EmptyStateProps {
  onFileUpload: (file: File) => void;
  onLoadSample: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onFileUpload,
  onLoadSample,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDownloadTemplate = () => {
    const templateContent = generateCsvTemplate();
    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'EliteSight_Audiology_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12">
      {/* Hero Card */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex p-1 sm:p-1.5 bg-white rounded-full border border-slate-200 shadow-md mb-3 sm:mb-4 ring-4 ring-brand-soft">
          <img
            src="./logo.png"
            alt="EliteSight HomeCare"
            className="h-12 w-12 sm:h-16 sm:w-16 object-contain rounded-full"
          />
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-brand-navy tracking-tight">
          Care Home Audiology Portal &amp; Batch Generator
        </h1>
        <p className="mt-2.5 sm:mt-3 max-w-2xl mx-auto text-xs sm:text-sm text-slate-600 px-2 leading-relaxed">
          Upload care home patient spreadsheets to instantly validate clinical data, auto-calculate billings, and generate pixel-perfect A4 reports and invoices.
        </p>
      </div>

      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-brand-blue/40 hover:border-brand-blue bg-white hover:bg-brand-soft/20 rounded-xl sm:rounded-2xl p-6 sm:p-10 text-center cursor-pointer transition shadow-sm group"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            if (e.target.files?.[0]) onFileUpload(e.target.files[0]);
          }}
          accept=".csv,text/csv"
          className="hidden"
        />
        <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-full bg-brand-soft group-hover:bg-brand-soft-hover flex items-center justify-center text-brand-navy mb-3 sm:mb-4 transition">
          <Upload className="w-6 h-6 sm:w-7 sm:h-7 text-brand-navy" />
        </div>
        <h3 className="text-sm sm:text-base font-bold text-slate-800">
          Drop your Care Home CSV here, or <span className="text-brand-blue underline">browse files</span>
        </h3>
        <p className="text-[11px] sm:text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Requires standard 14-column care home audiology spreadsheet.
        </p>

        {/* Quick Action Buttons */}
        <div
          className="mt-5 sm:mt-6 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2.5 sm:gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onLoadSample}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-navy hover:bg-brand-navy-dark text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow transition min-h-[40px]"
          >
            <Sparkles className="w-4 h-4 text-brand-soft" />
            <span>Load Sample 10-Patient Care Home</span>
          </button>
          <button
            onClick={handleDownloadTemplate}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium px-4 py-2.5 rounded-lg transition min-h-[40px]"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Download CSV Template</span>
          </button>
        </div>
      </div>

      {/* Feature Highlights / 3 Document Types */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 mt-6 sm:mt-8">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-brand-soft text-brand-navy flex items-center justify-center mb-2.5 sm:mb-3">
            <Building className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h4 className="font-bold text-xs text-brand-navy uppercase tracking-wider">
            1. Care Home Summary Report
          </h4>
          <p className="text-[11px] sm:text-xs text-slate-600 mt-1 leading-relaxed">
            Complete executive visit breakdown, financial totals, clinical stats, and non-seen exceptions.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-brand-soft text-brand-navy flex items-center justify-center mb-2.5 sm:mb-3">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h4 className="font-bold text-xs text-brand-navy uppercase tracking-wider">
            2. Patient Ear &amp; Hearing Summary
          </h4>
          <p className="text-[11px] sm:text-xs text-slate-600 mt-1 leading-relaxed">
            Otoscopy findings per ear, recommendations, 2-week olive oil regimen block, and optional Page 2 full hearing test.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm sm:col-span-2 lg:col-span-1">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-brand-soft text-brand-navy flex items-center justify-center mb-2.5 sm:mb-3">
            <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h4 className="font-bold text-xs text-brand-navy uppercase tracking-wider">
            3. Itemized Audiology Invoice
          </h4>
          <p className="text-[11px] sm:text-xs text-slate-600 mt-1 leading-relaxed">
            0% VAT medical billing with automated pricing (£0 Screening, £50 Full Hearing Test, £80 Wax) &amp; SumUp details.
          </p>
        </div>
      </div>

      {/* GDPR Privacy Notice */}
      <div className="mt-6 sm:mt-8 bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4 flex items-center gap-3 text-[11px] sm:text-xs text-slate-600">
        <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 flex-shrink-0" />
        <div className="leading-relaxed">
          <strong className="text-slate-800">GDPR Zero-Retention Compliance: </strong>
          All patient data is processed strictly in your local browser memory. No clinical records or patient identifiers are ever uploaded, saved to server storage, or retained across sessions.
        </div>
      </div>
    </div>
  );
};
