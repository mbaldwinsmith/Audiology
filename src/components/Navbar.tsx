import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Download,
  Printer,
  Trash2,
  Wifi,
  WifiOff,
  Sparkles,
  Archive,
  Menu,
  X,
  Lock,
  KeyRound,
  FileSpreadsheet,
  HelpCircle,
} from 'lucide-react';
import { generateCsvTemplate } from '../utils/csvParser';

interface NavbarProps {
  onFileUpload: (file: File) => void;
  onLoadSampleData: () => void;
  onResetSession: () => void;
  onPrint: () => void;
  onExportBatchZip: () => void;
  onExportCleanedCsv?: () => void;
  onLock: () => void;
  onChangePin: () => void;
  onOpenShortcuts?: () => void;
  hasData: boolean;
  totalPatientsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onFileUpload,
  onLoadSampleData,
  onResetSession,
  onPrint,
  onExportBatchZip,
  onExportCleanedCsv,
  onLock,
  onChangePin,
  onOpenShortcuts,
  hasData,
  totalPatientsCount,
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setIsMobileMenuOpen(false);
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
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="no-print bg-brand-navy text-white shadow-md border-b border-brand-navy-dark sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo & Branding */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="bg-white/10 p-0.5 rounded-full ring-2 ring-white/20 shadow-sm flex items-center justify-center">
              <img
                src="./logo.png"
                alt="EliteSight HomeCare"
                className="h-7 w-7 sm:h-9 sm:w-9 object-contain rounded-full bg-white"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                  Audiology Portal
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-slate-300 font-light hidden md:block">
                Zero-Retention Batch Generator &amp; Clinical Records
              </p>
            </div>
          </div>

          {/* Desktop & Tablet Actions */}
          <div className="hidden md:flex items-center gap-1.5 lg:gap-2">
            {/* Offline/Online Badge */}
            <div
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
                isOnline
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
              }`}
              title={isOnline ? 'Connected' : 'Working Offline'}
            >
              {isOnline ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span className="hidden lg:inline">{isOnline ? 'Connected' : 'Offline Mode'}</span>
            </div>

            {/* Template Download */}
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 text-xs bg-brand-navy-light hover:bg-brand-navy-dark border border-slate-600 px-2.5 py-1.5 rounded-md text-slate-200 transition"
              title="Download CSV Schema Template"
            >
              <Download className="w-3.5 h-3.5 text-brand-soft" />
              <span className="hidden xl:inline">CSV Template</span>
            </button>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,text/csv"
              className="hidden"
            />

            {/* Upload CSV Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs bg-brand-blue hover:bg-brand-blue-hover text-white font-medium px-3 py-1.5 rounded-md shadow-sm transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import CSV</span>
            </button>

            {/* Load Sample Data (When empty) */}
            {!hasData && (
              <button
                onClick={onLoadSampleData}
                className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3 py-1.5 rounded-md shadow-sm transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Sample</span>
              </button>
            )}

            {/* Export Cleaned CSV */}
            {hasData && onExportCleanedCsv && (
              <button
                onClick={onExportCleanedCsv}
                className="flex items-center gap-1.5 text-xs bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 font-semibold px-2.5 py-1.5 rounded-md shadow-sm transition"
                title="Export cleansed CSV roster with reference IDs and billing totals"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden xl:inline">Export CSV</span>
              </button>
            )}

            {/* Batch PDF ZIP Export */}
            {hasData && (
              <button
                onClick={onExportBatchZip}
                className="flex items-center gap-1.5 text-xs bg-brand-navy-light hover:bg-slate-700 text-brand-soft border border-brand-blue/50 font-semibold px-3 py-1.5 rounded-md shadow-sm transition"
                title="Export all individual PDFs in a ZIP archive"
              >
                <Archive className="w-3.5 h-3.5 text-brand-soft" />
                <span className="hidden lg:inline">Export ZIP</span>
              </button>
            )}

            {/* Print Trigger */}
            {hasData && (
              <button
                onClick={onPrint}
                className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-md shadow-sm transition"
                title="Print or Save as single multi-page PDF"
              >
                <Printer className="w-4 h-4" />
                <span>Print All ({totalPatientsCount})</span>
              </button>
            )}

            {/* Reset / Clear Session */}
            {hasData && (
              <button
                onClick={onResetSession}
                className="flex items-center gap-1 text-xs bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700 px-2 py-1.5 rounded-md transition"
                title="GDPR Zero-Retention Reset"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Reset</span>
              </button>
            )}

            {/* Keyboard Shortcuts Help */}
            {onOpenShortcuts && (
              <button
                onClick={onOpenShortcuts}
                className="flex items-center gap-1 text-xs bg-brand-navy-light hover:bg-slate-700 text-slate-200 border border-slate-600 px-2 py-1.5 rounded-md transition"
                title="Keyboard Shortcuts (?)"
              >
                <HelpCircle className="w-3.5 h-3.5 text-brand-soft" />
              </button>
            )}

            {/* Change PIN Button */}
            <button
              onClick={onChangePin}
              className="flex items-center gap-1 text-xs bg-brand-navy-light hover:bg-slate-700 text-slate-200 border border-slate-600 px-2 py-1.5 rounded-md transition"
              title="Change Clinical PIN"
            >
              <KeyRound className="w-3.5 h-3.5 text-brand-soft" />
            </button>

            {/* Lock Screen Button */}
            <button
              onClick={onLock}
              className="flex items-center gap-1.5 text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold px-2.5 py-1.5 rounded-md shadow-sm transition"
              title="Lock Portal Screen (Requires PIN to unlock)"
            >
              <Lock className="w-3.5 h-3.5 text-amber-300" />
              <span>Lock</span>
            </button>
          </div>

          {/* Mobile Right Controls: Online pill + Lock button + Hamburger */}
          <div className="flex md:hidden items-center gap-1.5">
            {/* Quick Lock Button */}
            <button
              onClick={onLock}
              className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition"
              title="Lock Screen"
            >
              <Lock className="w-4 h-4 text-amber-300" />
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 rounded-lg bg-brand-navy-light hover:bg-brand-navy-dark text-slate-200 border border-slate-700 transition"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-brand-navy-dark bg-brand-navy/95 backdrop-blur-md px-4 py-3 space-y-2 animate-fadeIn shadow-xl">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                fileInputRef.current?.click();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-2 text-xs bg-brand-blue hover:bg-brand-blue-hover text-white font-medium p-2.5 rounded-lg shadow-sm transition"
            >
              <Upload className="w-4 h-4" />
              <span>Import CSV</span>
            </button>

            <button
              onClick={handleDownloadTemplate}
              className="flex items-center justify-center gap-2 text-xs bg-brand-navy-light hover:bg-slate-700 text-slate-200 border border-slate-600 p-2.5 rounded-lg transition"
            >
              <Download className="w-4 h-4 text-brand-soft" />
              <span>CSV Template</span>
            </button>
          </div>

          {!hasData && (
            <button
              onClick={() => {
                onLoadSampleData();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium p-2.5 rounded-lg shadow-sm transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Load Sample 10-Patient Care Home</span>
            </button>
          )}

          {hasData && (
            <div className="space-y-2 pt-1">
              {onExportCleanedCsv && (
                <button
                  onClick={() => {
                    onExportCleanedCsv();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 text-xs bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 font-semibold p-2.5 rounded-lg shadow-sm transition"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Export Cleaned CSV Roster</span>
                </button>
              )}

              <button
                onClick={() => {
                  onExportBatchZip();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 text-xs bg-brand-navy-light hover:bg-slate-700 text-brand-soft border border-brand-blue/50 font-semibold p-2.5 rounded-lg shadow-sm transition"
              >
                <Archive className="w-4 h-4 text-brand-soft" />
                <span>Export Batch ZIP (All PDFs)</span>
              </button>

              <button
                onClick={() => {
                  onPrint();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold p-2.5 rounded-lg shadow-sm transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print All Documents ({totalPatientsCount})</span>
              </button>

              <button
                onClick={() => {
                  onResetSession();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 text-xs bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700 p-2 rounded-lg transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>GDPR Zero-Retention Reset</span>
              </button>
            </div>
          )}

          {/* Security PIN & Shortcuts in mobile menu */}
          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between gap-2">
            {onOpenShortcuts && (
              <button
                onClick={() => {
                  onOpenShortcuts();
                  setIsMobileMenuOpen(false);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-lg transition"
              >
                <HelpCircle className="w-3.5 h-3.5 text-brand-soft" />
                <span>Shortcuts (?)</span>
              </button>
            )}

            <button
              onClick={() => {
                onChangePin();
                setIsMobileMenuOpen(false);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-lg transition"
            >
              <KeyRound className="w-3.5 h-3.5 text-brand-soft" />
              <span>Change PIN</span>
            </button>

            <button
              onClick={() => {
                onLock();
                setIsMobileMenuOpen(false);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 p-2 rounded-lg transition"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Screen</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
