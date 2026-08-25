import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  CareHomeSummary,
  PatientRow,
  ValidationError,
} from '../types/audiology';
import { CareHomeReport } from './print/CareHomeReport';
import { AudiologyReport } from './print/AudiologyReport';
import { AudiologyInvoice } from './print/AudiologyInvoice';
import { BatchPrintContainer } from './print/BatchPrintContainer';
import { PatientEditor } from './PatientEditor';
import {
  Building,
  FileText,
  Receipt,
  Printer,
  Search,
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  Settings2,
  Users,
  Eye,
  Archive,
  FileDown,
  Loader2,
  ArrowLeft,
  MoveHorizontal,
  UserPlus,
  FileSpreadsheet,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Keyboard,
} from 'lucide-react';
import {
  exportCareHomeReportPdf,
  exportPatientReportPdf,
  exportPatientInvoicePdf,
} from '../utils/pdfGenerator';

interface BatchManagerProps {
  summary: CareHomeSummary;
  patients: PatientRow[];
  errors: ValidationError[];
  warnings: ValidationError[];
  onUpdatePatient: (updatedPatient: PatientRow) => void;
  onDeletePatient: (patientId: string) => void;
  onAddPatientClick: () => void;
  onPrintSingle: () => void;
  onPrintBatch: () => void;
  onExportBatchZip: () => void;
  onExportCleanedCsv: () => void;
  onOpenShortcuts?: () => void;
}

type ViewMode = 'care-home' | 'patient-report' | 'patient-invoice' | 'batch-print';
type MobilePane = 'patients' | 'preview';

export const BatchManager: React.FC<BatchManagerProps> = ({
  summary,
  patients,
  errors,
  warnings,
  onUpdatePatient,
  onDeletePatient,
  onAddPatientClick,
  onPrintSingle,
  onPrintBatch,
  onExportBatchZip,
  onExportCleanedCsv,
  onOpenShortcuts,
}) => {
  const [activeTab, setActiveTab] = useState<ViewMode>('care-home');
  const [mobilePane, setMobilePane] = useState<MobilePane>('preview');
  const [isDownloadingCurrent, setIsDownloadingCurrent] = useState<boolean>(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    summary.seenPatients[0]?.id || patients[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'seen' | 'unseen' | 'wax' | 'audiogram'>('all');
  const [showEditor, setShowEditor] = useState<boolean>(false);

  // Zoom & Viewport Scaling State
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [isFitToWidth, setIsFitToWidth] = useState<boolean>(true);
  const [containerWidth, setContainerWidth] = useState<number>(850);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || patients[0];

  // Measure preview container accurately using ResizeObserver
  useEffect(() => {
    if (!previewContainerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(Math.floor(entry.contentRect.width));
        }
      }
    });
    ro.observe(previewContainerRef.current);
    return () => ro.disconnect();
  }, []);

  // Filtered patients for sidebar list
  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.residentFullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.reportRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'seen') return p.seen;
    if (filterType === 'unseen') return !p.seen;
    if (filterType === 'wax') return p.hasEarWax;
    if (filterType === 'audiogram') return p.audiogram;
    return true;
  });

  const handlePatientSelect = useCallback((p: PatientRow) => {
    setSelectedPatientId(p.id);
    if (activeTab === 'care-home') {
      setActiveTab(p.seen ? 'patient-report' : 'care-home');
    }
    // On mobile, switch to preview when a patient is tapped
    setMobilePane('preview');
  }, [activeTab]);

  // Compute effective zoom scale (A4 width at 96dpi is ~794px)
  const a4BaseWidth = 794;
  const padding = containerWidth > 640 ? 32 : 16;
  const availableWidth = Math.max(280, containerWidth - padding);
  const fitScale = Math.min(1.2, Math.max(0.35, availableWidth / a4BaseWidth));
  const effectiveZoom = isFitToWidth ? fitScale : zoomPercent / 100;
  const scaledWidth = Math.round(a4BaseWidth * effectiveZoom);

  const handleZoomIn = () => {
    setIsFitToWidth(false);
    setZoomPercent((prev) => Math.min(150, Math.round((prev + 10) / 10) * 10));
  };

  const handleZoomOut = () => {
    setIsFitToWidth(false);
    setZoomPercent((prev) => Math.max(40, Math.round((prev - 10) / 10) * 10));
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName;
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || targetTag === 'SELECT') {
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        const currentIdx = filteredPatients.findIndex((p) => p.id === selectedPatientId);
        if (currentIdx < filteredPatients.length - 1) {
          handlePatientSelect(filteredPatients[currentIdx + 1]);
        }
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        const currentIdx = filteredPatients.findIndex((p) => p.id === selectedPatientId);
        if (currentIdx > 0) {
          handlePatientSelect(filteredPatients[currentIdx - 1]);
        }
      } else if (e.key === '1') {
        setActiveTab('care-home');
      } else if (e.key === '2') {
        if (selectedPatient?.seen) setActiveTab('patient-report');
      } else if (e.key === '3') {
        if (selectedPatient?.seen) setActiveTab('patient-invoice');
      } else if (e.key === '4') {
        setActiveTab('batch-print');
      } else if (e.key.toLowerCase() === 'e') {
        if (selectedPatient?.seen) {
          e.preventDefault();
          setShowEditor((prev) => !prev);
        }
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        setIsFitToWidth((prev) => !prev);
      } else if (e.key === '?') {
        e.preventDefault();
        onOpenShortcuts?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredPatients, selectedPatientId, selectedPatient, onOpenShortcuts, handlePatientSelect]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 w-full min-w-0">
      {/* Top Validation Alerts if any */}
      {errors.length > 0 && (
        <div className="no-print mb-3 sm:mb-4 bg-rose-50 border border-rose-300 rounded-lg p-3 sm:p-3.5 text-xs text-rose-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">CSV Import Errors:</span>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              {errors.map((e, idx) => (
                <li key={idx}>
                  {e.field ? `[${e.field}] ` : ''}Row {e.row}: {e.message}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="no-print mb-3 sm:mb-4 bg-amber-50 border border-amber-300 rounded-lg p-3 sm:p-3.5 text-xs text-amber-800 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Notice &amp; Warnings:</span>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              {warnings.map((w, idx) => (
                <li key={idx}>
                  {w.field ? `[${w.field}] ` : ''}Row {w.row}: {w.message}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Mobile-Only Segmented View Switcher (Patients vs Preview) */}
      <div className="no-print lg:hidden mb-3 bg-slate-200/80 p-1 rounded-xl flex items-center shadow-inner">
        <button
          onClick={() => setMobilePane('patients')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition ${
            mobilePane === 'patients'
              ? 'bg-white text-brand-navy shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-brand-blue" />
          <span>Residents ({patients.length})</span>
        </button>

        <button
          onClick={() => setMobilePane('preview')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition ${
            mobilePane === 'preview'
              ? 'bg-white text-brand-navy shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Eye className="w-3.5 h-3.5 text-brand-blue" />
          <span>Documents &amp; Preview</span>
        </button>
      </div>

      {/* Main App Layout: Controls + Previews */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start w-full min-w-0">
        {/* Left Column: Patient List & KPI Navigator (4 cols on lg) */}
        <div
          className={`no-print lg:col-span-4 space-y-3 sm:space-y-4 w-full min-w-0 ${
            mobilePane === 'patients' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Care Home Quick Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="font-extrabold text-sm sm:text-base text-brand-navy truncate">
                  {summary.careHome}
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                  {summary.postCode} • Date: {summary.appointmentDate}
                </p>
                <p className="text-[11px] sm:text-xs text-slate-500">
                  Audiologist: <strong className="text-slate-700">{summary.audiologist}</strong>
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveTab('care-home');
                  setMobilePane('preview');
                }}
                className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1 flex-shrink-0 transition ${
                  activeTab === 'care-home'
                    ? 'bg-brand-soft border-brand-blue text-brand-navy shadow-inner'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
                title="View Care Home Summary Report"
              >
                <Building className="w-3.5 h-3.5 text-brand-blue" />
                <span>Overview</span>
              </button>
            </div>

            {/* Visit KPI Stats */}
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-center">
              <div className="bg-slate-50 p-2 rounded-lg">
                <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold block uppercase">
                  Patients
                </span>
                <span className="text-sm sm:text-base font-bold text-slate-800">
                  {summary.totalPatients}
                </span>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg">
                <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold block uppercase">
                  Assessed
                </span>
                <span className="text-sm sm:text-base font-bold text-emerald-700">
                  {summary.seenPatientsCount}
                </span>
              </div>
              <div className="bg-brand-soft p-2 rounded-lg">
                <span className="text-[9px] sm:text-[10px] text-brand-navy font-bold block uppercase">
                  Total GBP
                </span>
                <span className="text-sm sm:text-base font-extrabold text-brand-navy">
                  £{summary.totalRevenue.toFixed(0)}
                </span>
              </div>
            </div>
          </div>

            {/* Patient Selector List */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-brand-blue" />
                  Residents ({filteredPatients.length})
                </span>
                <button
                  type="button"
                  onClick={onAddPatientClick}
                  className="flex items-center gap-1 text-[11px] font-bold text-brand-blue hover:text-brand-navy hover:bg-brand-soft px-2 py-1 rounded-md border border-brand-blue/30 transition shadow-2xs"
                  title="Add a new walk-in resident to this batch"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Resident</span>
                </button>
              </div>

            {/* Search Input */}
            <div className="p-2.5 border-b border-slate-100">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search name, ref, or invoice..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
                />
              </div>
            </div>

            {/* Filter Chips */}
            <div className="px-2.5 py-1.5 bg-slate-50/70 border-b border-slate-100 flex flex-wrap gap-1 text-[10px]">
              {(['all', 'seen', 'unseen', 'wax', 'audiogram'] as const).map((ft) => (
                <button
                  key={ft}
                  onClick={() => setFilterType(ft)}
                  className={`px-2 py-0.5 rounded capitalize font-medium transition ${
                    filterType === ft
                      ? 'bg-brand-navy text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {ft === 'audiogram' ? 'Full Hearing Test' : ft}
                </button>
              ))}
            </div>

            {/* Patient Rows */}
            <div className="max-h-[380px] sm:max-h-[480px] overflow-y-auto divide-y divide-slate-100">
              {filteredPatients.map((p) => {
                const isSelected = p.id === selectedPatient?.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => handlePatientSelect(p)}
                    className={`p-3 text-xs cursor-pointer transition flex items-center justify-between min-h-[52px] ${
                      isSelected
                        ? 'bg-brand-soft/80 border-l-4 border-l-brand-blue font-medium'
                        : 'hover:bg-slate-50 active:bg-slate-100'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900 truncate text-xs sm:text-sm">
                          {p.residentFullName}
                        </span>
                        {!p.seen && (
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2 rounded">
                            Unseen
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {p.reportRef} • DOB: {p.dob}
                      </div>
                      {p.seen && (
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          {p.hasEarWax && <span className="text-amber-700 font-medium">Wax Removal</span>}
                          {p.hasEarWax && p.audiogram && <span>•</span>}
                          {p.audiogram && <span className="text-brand-blue font-medium">Full Hearing Test</span>}
                          {!p.hasEarWax && !p.audiogram && <span>Screening (Free)</span>}
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      {p.seen ? (
                        <span className="font-bold text-slate-800 text-xs">£{p.totalAmount.toFixed(2)}</span>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Excluded</span>
                      )}
                      <ChevronRight
                        className={`w-3.5 h-3.5 ml-auto mt-1 ${
                          isSelected ? 'text-brand-blue' : 'text-slate-300'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
              {filteredPatients.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400">
                  No residents match the selected filter.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Viewport & Document Switcher (8 cols on lg) */}
        <div
          className={`lg:col-span-8 space-y-3 sm:space-y-4 w-full min-w-0 ${
            mobilePane === 'preview' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Mobile Back Button (when on preview pane) */}
          <div className="no-print lg:hidden flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
            <button
              onClick={() => setMobilePane('patients')}
              className="flex items-center gap-1.5 text-xs font-bold text-brand-navy hover:text-brand-blue px-2 py-1 rounded"
            >
              <ArrowLeft className="w-4 h-4 text-brand-blue" />
              <span>Residents List ({patients.length})</span>
            </button>
            <div className="text-[11px] text-slate-500 font-medium truncate max-w-[180px]">
              {activeTab === 'care-home' ? summary.careHome : selectedPatient?.residentFullName}
            </div>
          </div>

          {/* Mode Switcher Tabs & Print Triggers */}
          <div className="no-print bg-white border border-slate-200 rounded-xl p-2 sm:p-2.5 shadow-sm space-y-2">
            {/* Scrollable document tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 preview-scroll-area">
              <button
                onClick={() => setActiveTab('care-home')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex-shrink-0 ${
                  activeTab === 'care-home'
                    ? 'bg-brand-navy text-white shadow-sm'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>Care Home Report</span>
              </button>

              <button
                onClick={() => setActiveTab('patient-report')}
                disabled={!selectedPatient?.seen}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex-shrink-0 ${
                  activeTab === 'patient-report'
                    ? 'bg-brand-navy text-white shadow-sm'
                    : selectedPatient?.seen
                    ? 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
                title={!selectedPatient?.seen ? 'Resident not seen' : ''}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Patient Summary</span>
              </button>

              <button
                onClick={() => setActiveTab('patient-invoice')}
                disabled={!selectedPatient?.seen}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex-shrink-0 ${
                  activeTab === 'patient-invoice'
                    ? 'bg-brand-navy text-white shadow-sm'
                    : selectedPatient?.seen
                    ? 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
                title={!selectedPatient?.seen ? 'Resident not seen' : ''}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Invoice</span>
              </button>

              <button
                onClick={() => setActiveTab('batch-print')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex-shrink-0 ${
                  activeTab === 'batch-print'
                    ? 'bg-brand-navy text-white shadow-sm'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Multi-Print</span>
              </button>
            </div>

            {/* Quick Actions Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 pt-1 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                {selectedPatient?.seen && (activeTab === 'patient-report' || activeTab === 'patient-invoice') && (
                  <button
                    onClick={() => setShowEditor(!showEditor)}
                    className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border font-medium transition ${
                      showEditor
                        ? 'bg-brand-soft border-brand-blue text-brand-navy font-semibold'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Settings2 className="w-3.5 h-3.5 text-brand-blue" />
                    <span>{showEditor ? 'Hide Editor' : 'Edit Record (E)'}</span>
                  </button>
                )}

                {/* Single PDF download */}
                {activeTab !== 'batch-print' && (
                  <button
                    onClick={async () => {
                      setIsDownloadingCurrent(true);
                      try {
                        if (activeTab === 'care-home') {
                          await exportCareHomeReportPdf(summary);
                        } else if (activeTab === 'patient-report' && selectedPatient?.seen) {
                          await exportPatientReportPdf(selectedPatient);
                        } else if (activeTab === 'patient-invoice' && selectedPatient?.seen) {
                          await exportPatientInvoicePdf(selectedPatient);
                        }
                      } finally {
                        setIsDownloadingCurrent(false);
                      }
                    }}
                    disabled={isDownloadingCurrent || (activeTab !== 'care-home' && !selectedPatient?.seen)}
                    className="flex items-center gap-1 text-xs bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium px-2.5 py-1.5 rounded-lg shadow-sm transition disabled:opacity-50"
                    title="Download this document as PDF"
                  >
                    {isDownloadingCurrent ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-blue" />
                    ) : (
                      <FileDown className="w-3.5 h-3.5 text-brand-blue" />
                    )}
                    <span className="hidden sm:inline">{isDownloadingCurrent ? 'Exporting...' : 'Download PDF'}</span>
                    <span className="sm:hidden">{isDownloadingCurrent ? '...' : 'PDF'}</span>
                  </button>
                )}
              </div>

              {/* Right side actions: Export CSV, ZIP & Print */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onExportCleanedCsv}
                  className="flex items-center gap-1 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg shadow-sm transition"
                  title="Download normalized, cleaned CSV with all references and live changes"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Export CSV</span>
                  <span className="sm:hidden">CSV</span>
                </button>

                <button
                  onClick={onExportBatchZip}
                  className="flex items-center gap-1 text-xs bg-brand-navy hover:bg-brand-navy-dark text-white font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg shadow-sm transition"
                  title="Export all separate patient PDFs in a ZIP archive"
                >
                  <Archive className="w-3.5 h-3.5 text-brand-soft" />
                  <span className="hidden sm:inline">Export ZIP</span>
                  <span className="sm:hidden">ZIP</span>
                </button>

                <button
                  onClick={onPrintSingle}
                  className="flex items-center gap-1 text-xs bg-brand-blue hover:bg-brand-blue-hover text-white font-medium px-2.5 sm:px-3 py-1.5 rounded-lg shadow-sm transition"
                  title="Print Current Preview"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Live Editor Drawer (if opened) */}
          {showEditor && selectedPatient && selectedPatient.seen && (
            <div className="no-print">
              <PatientEditor
                patient={selectedPatient}
                onUpdatePatient={onUpdatePatient}
                onDeletePatient={onDeletePatient}
              />
            </div>
          )}

          {/* Document Zoom & Fit Toolbar */}
          <div className="no-print flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm text-xs gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-semibold text-[11px] hidden sm:inline">Document Zoom:</span>
              
              <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition"
                  title="Zoom Out (-)"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[11px] font-bold text-brand-navy w-12 text-center select-none">
                  {Math.round(effectiveZoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition"
                  title="Zoom In (+)"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsFitToWidth(true)}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition flex items-center gap-1 ${
                  isFitToWidth
                    ? 'bg-brand-navy text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                title="Fit document to screen width (0)"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Fit Width</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsFitToWidth(false);
                  setZoomPercent(100);
                }}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition ${
                  !isFitToWidth && zoomPercent === 100
                    ? 'bg-brand-navy text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                title="Reset to 100% standard size"
              >
                100%
              </button>
            </div>

            {/* Keyboard Shortcuts Trigger */}
            {onOpenShortcuts && (
              <button
                type="button"
                onClick={onOpenShortcuts}
                className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-brand-navy bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg font-medium transition"
                title="View Keyboard Shortcuts (?)"
              >
                <Keyboard className="w-3.5 h-3.5 text-brand-blue" />
                <span className="hidden sm:inline">Shortcuts</span>
                <kbd className="px-1 bg-white border border-slate-300 rounded text-[9px] font-mono font-bold text-slate-500">?</kbd>
              </button>
            )}
          </div>

          {/* Document Preview Stage (Exact A4 Container with Scaled Wrapper) */}
          <div
            ref={previewContainerRef}
            className="document-preview-stage w-full max-w-full overflow-x-auto overflow-y-visible p-2 sm:p-4 bg-slate-300/60 rounded-xl flex justify-center"
            style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehaviorX: 'contain',
              touchAction: 'pan-x pan-y',
            }}
          >
            <div
              style={{
                width: `${scaledWidth}px`,
                minWidth: `${Math.min(scaledWidth, 794)}px`,
                maxWidth: '100%',
                display: 'flex',
                justifyContent: 'center',
                overflow: 'visible',
              }}
            >
              <div
                className="transition-transform duration-150"
                style={{
                  width: `${a4BaseWidth}px`,
                  minWidth: `${a4BaseWidth}px`,
                  transform: `scale(${effectiveZoom})`,
                  transformOrigin: 'top center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  marginBottom: effectiveZoom < 1 ? `calc((1 - ${effectiveZoom}) * -950px)` : undefined,
                }}
              >
                {activeTab === 'care-home' && <CareHomeReport summary={summary} />}

                {activeTab === 'patient-report' && selectedPatient && (
                  selectedPatient.seen ? (
                    <AudiologyReport patient={selectedPatient} />
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-10 text-center max-w-md my-8 w-full shadow-sm">
                      <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                      <h3 className="text-sm font-bold text-slate-800 mb-1">Patient Not Seen</h3>
                      <p className="text-xs text-slate-600 mb-2">
                        {selectedPatient.residentFullName} was not seen ({selectedPatient.reasonNotSeen}).
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Per clinical rules, individual summaries and invoices are not generated for unseen residents.
                      </p>
                    </div>
                  )
                )}

                {activeTab === 'patient-invoice' && selectedPatient && (
                  selectedPatient.seen ? (
                    <AudiologyInvoice patient={selectedPatient} />
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-10 text-center max-w-md my-8 w-full shadow-sm">
                      <Receipt className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                      <h3 className="text-sm font-bold text-slate-800 mb-1">No Invoice Generated</h3>
                      <p className="text-xs text-slate-600">
                        {selectedPatient.residentFullName} was not seen. Invoices are generated exclusively for attended consultations.
                      </p>
                    </div>
                  )
                )}

                {activeTab === 'batch-print' && (
                  <BatchPrintContainer summary={summary} patients={patients} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
