import React, { useState } from 'react';
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
  UserCheck,
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
  DownloadCloud,
  FileDown,
  Loader2,
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
  onPrintSingle: () => void;
  onPrintBatch: () => void;
  onExportBatchZip: () => void;
}

type ViewMode = 'care-home' | 'patient-report' | 'patient-invoice' | 'batch-print';

export const BatchManager: React.FC<BatchManagerProps> = ({
  summary,
  patients,
  errors,
  warnings,
  onUpdatePatient,
  onPrintSingle,
  onPrintBatch,
  onExportBatchZip,
}) => {
  const [activeTab, setActiveTab] = useState<ViewMode>('care-home');
  const [isDownloadingCurrent, setIsDownloadingCurrent] = useState<boolean>(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    summary.seenPatients[0]?.id || patients[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'seen' | 'unseen' | 'wax' | 'audiogram'>('all');
  const [showEditor, setShowEditor] = useState<boolean>(false);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || patients[0];

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Validation Alerts if any */}
      {errors.length > 0 && (
        <div className="no-print mb-4 bg-rose-50 border border-rose-300 rounded-lg p-3.5 text-xs text-rose-800 flex items-start gap-2.5">
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
        <div className="no-print mb-4 bg-amber-50 border border-amber-300 rounded-lg p-3.5 text-xs text-amber-800 flex items-start gap-2.5">
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

      {/* Main App Layout: Controls + Previews */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Patient List & KPI Navigator (4 cols on lg) */}
        <div className="no-print lg:col-span-4 space-y-4">
          {/* Care Home Quick Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-extrabold text-sm text-brand-navy">{summary.careHome}</h2>
                <p className="text-xs text-slate-500">{summary.postCode} | Date: {summary.appointmentDate}</p>
                <p className="text-xs text-slate-500">Audiologist: <strong className="text-slate-700">{summary.audiologist}</strong></p>
              </div>
              <button
                onClick={() => setActiveTab('care-home')}
                className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1 transition ${
                  activeTab === 'care-home'
                    ? 'bg-brand-soft border-brand-blue text-brand-navy shadow-inner'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
                title="View Care Home Summary Report"
              >
                <Building className="w-4 h-4 text-brand-blue" />
                <span>Overview</span>
              </button>
            </div>

            {/* Visit KPI Stats */}
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-center">
              <div className="bg-slate-50 p-1.5 rounded">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Patients</span>
                <span className="text-sm font-bold text-slate-800">{summary.totalPatients}</span>
              </div>
              <div className="bg-slate-50 p-1.5 rounded">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Assessed</span>
                <span className="text-sm font-bold text-emerald-700">{summary.seenPatientsCount}</span>
              </div>
              <div className="bg-brand-soft p-1.5 rounded">
                <span className="text-[10px] text-brand-navy font-bold block uppercase">Total GBP</span>
                <span className="text-sm font-extrabold text-brand-navy">£{summary.totalRevenue.toFixed(0)}</span>
              </div>
            </div>
          </div>

          {/* Patient Selector List */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-brand-blue" />
                Patients ({filteredPatients.length})
              </span>
              <div className="text-[10px] text-slate-500 font-medium">
                Click to preview &amp; edit
              </div>
            </div>

            {/* Search Input */}
            <div className="p-2 border-b border-slate-100">
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
            <div className="px-2 py-1.5 bg-slate-50/70 border-b border-slate-100 flex flex-wrap gap-1 text-[10px]">
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
                  {ft}
                </button>
              ))}
            </div>

            {/* Patient Rows */}
            <div className="max-h-[480px] overflow-y-auto divide-y divide-slate-100">
              {filteredPatients.map((p) => {
                const isSelected = p.id === selectedPatient?.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedPatientId(p.id);
                      if (activeTab === 'care-home') {
                        setActiveTab(p.seen ? 'patient-report' : 'care-home');
                      }
                    }}
                    className={`p-3 text-xs cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-brand-soft/80 border-l-4 border-l-brand-blue font-medium'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900 truncate">
                          {p.residentFullName}
                        </span>
                        {!p.seen && (
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2 rounded">
                            Unseen
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {p.reportRef} | DOB: {p.dob}
                      </div>
                      {p.seen && (
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          {p.hasEarWax && <span className="text-amber-700 font-medium">Wax Removal</span>}
                          {p.hasEarWax && p.audiogram && <span>•</span>}
                          {p.audiogram && <span className="text-brand-blue font-medium">Audiogram</span>}
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
                      <ChevronRight className={`w-3.5 h-3.5 ml-auto mt-1 ${isSelected ? 'text-brand-blue' : 'text-slate-300'}`} />
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
        <div className="lg:col-span-8 space-y-4">
          {/* Mode Switcher Tabs & Print Triggers */}
          <div className="no-print bg-white border border-slate-200 rounded-lg p-2.5 shadow-sm flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveTab('care-home')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  activeTab === 'patient-report'
                    ? 'bg-brand-navy text-white shadow-sm'
                    : selectedPatient?.seen
                    ? 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
                title={!selectedPatient?.seen ? 'Patient was not seen; summary not generated' : ''}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Patient Summary</span>
              </button>

              <button
                onClick={() => setActiveTab('patient-invoice')}
                disabled={!selectedPatient?.seen}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  activeTab === 'patient-invoice'
                    ? 'bg-brand-navy text-white shadow-sm'
                    : selectedPatient?.seen
                    ? 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
                title={!selectedPatient?.seen ? 'Patient was not seen; invoice not generated' : ''}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Invoice</span>
              </button>

              <button
                onClick={() => setActiveTab('batch-print')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  activeTab === 'batch-print'
                    ? 'bg-brand-navy text-white shadow-sm'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Multi-Print Preview</span>
              </button>
            </div>

            {/* Quick Actions for Current Document & Batch Export */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {selectedPatient?.seen && (activeTab === 'patient-report' || activeTab === 'patient-invoice') && (
                <button
                  onClick={() => setShowEditor(!showEditor)}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border font-medium transition ${
                    showEditor
                      ? 'bg-brand-soft border-brand-blue text-brand-navy font-semibold'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Settings2 className="w-3.5 h-3.5 text-brand-blue" />
                  <span>{showEditor ? 'Hide Editor' : 'Edit'}</span>
                </button>
              )}

              {/* Single PDF download for active view */}
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
                  className="flex items-center gap-1 text-xs bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium px-2.5 py-1.5 rounded-md shadow-sm transition disabled:opacity-50"
                  title="Download this document as an individual PDF named by patient & ref"
                >
                  {isDownloadingCurrent ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-blue" />
                  ) : (
                    <FileDown className="w-3.5 h-3.5 text-brand-blue" />
                  )}
                  <span>{isDownloadingCurrent ? 'Generating...' : 'Download PDF'}</span>
                </button>
              )}

              {/* Batch ZIP Export */}
              <button
                onClick={onExportBatchZip}
                className="flex items-center gap-1 text-xs bg-brand-navy hover:bg-brand-navy-dark text-white font-semibold px-3 py-1.5 rounded-md shadow-sm transition"
                title="Export all separate patient PDFs in a ZIP archive"
              >
                <Archive className="w-3.5 h-3.5 text-brand-soft" />
                <span>Export ZIP</span>
              </button>

              {/* Print View */}
              <button
                onClick={onPrintSingle}
                className="flex items-center gap-1 text-xs bg-brand-blue hover:bg-brand-blue-hover text-white font-medium px-3 py-1.5 rounded-md shadow-sm transition"
                title="Print Current Preview"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
            </div>
          </div>

          {/* Interactive Live Editor Drawer (if opened) */}
          {showEditor && selectedPatient && selectedPatient.seen && (
            <div className="no-print">
              <PatientEditor patient={selectedPatient} onUpdatePatient={onUpdatePatient} />
            </div>
          )}

          {/* Document Preview Stage (Exact A4 Container) */}
          <div className="document-preview-stage overflow-x-auto p-2 bg-slate-200/60 rounded-xl flex flex-col items-center">
            {activeTab === 'care-home' && <CareHomeReport summary={summary} />}

            {activeTab === 'patient-report' && selectedPatient && (
              selectedPatient.seen ? (
                <AudiologyReport patient={selectedPatient} />
              ) : (
                <div className="bg-white border border-slate-200 rounded-lg p-10 text-center max-w-md my-8">
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
                <div className="bg-white border border-slate-200 rounded-lg p-10 text-center max-w-md my-8">
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
  );
};
