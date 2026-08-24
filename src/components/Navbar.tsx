import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Download,
  Printer,
  Trash2,
  Wifi,
  WifiOff,
  FileSpreadsheet,
  Layers,
  Sparkles,
} from 'lucide-react';
import { generateCsvTemplate } from '../utils/csvParser';

interface NavbarProps {
  onFileUpload: (file: File) => void;
  onLoadSampleData: () => void;
  onResetSession: () => void;
  onPrint: () => void;
  hasData: boolean;
  totalPatientsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onFileUpload,
  onLoadSampleData,
  onResetSession,
  onPrint,
  hasData,
  totalPatientsCount,
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
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
    <header className="no-print bg-brand-navy text-white shadow-md border-b border-brand-navy-dark sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-0.5 rounded-full ring-2 ring-white/20 shadow-sm flex items-center justify-center">
              <img src="./logo.png" alt="EliteSight HomeCare" className="h-9 w-9 object-contain rounded-full bg-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  Audiology Portal
                </span>
                <span className="bg-brand-blue text-xs font-semibold px-2 py-0.5 rounded-full text-brand-soft">
                  PWA
                </span>
              </div>
              <p className="text-[10px] text-slate-300 font-light hidden sm:block">
                Zero-Retention Batch Generator &amp; Clinical Records
              </p>
            </div>
          </div>

          {/* Actions & Offline Status */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Offline/Online Badge */}
            <div
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
                isOnline
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
              }`}
              title={isOnline ? 'Connected (Offline PWA ready)' : 'Working Offline'}
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-amber-400" />}
              <span className="hidden md:inline">{isOnline ? 'PWA Ready' : 'Offline Mode'}</span>
            </div>

            {/* Template Download */}
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 text-xs bg-brand-navy-light hover:bg-brand-navy-dark border border-slate-600 px-3 py-1.5 rounded-md text-slate-200 transition"
              title="Download CSV Schema Template"
            >
              <Download className="w-3.5 h-3.5 text-brand-soft" />
              <span className="hidden md:inline">CSV Template</span>
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
              className="flex items-center gap-1.5 text-xs bg-brand-blue hover:bg-brand-blue-hover text-white font-medium px-3.5 py-1.5 rounded-md shadow-sm transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import CSV</span>
            </button>

            {/* Load Sample Data (When empty or for quick testing) */}
            {!hasData && (
              <button
                onClick={onLoadSampleData}
                className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3 py-1.5 rounded-md shadow-sm transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Load Sample</span>
              </button>
            )}

            {/* Print Trigger */}
            {hasData && (
              <button
                onClick={onPrint}
                className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-1.5 rounded-md shadow-sm transition"
                title="Print or Save as PDF"
              >
                <Printer className="w-4 h-4" />
                <span>Print All ({totalPatientsCount})</span>
              </button>
            )}

            {/* Reset / Clear Session */}
            {hasData && (
              <button
                onClick={onResetSession}
                className="flex items-center gap-1 text-xs bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700 px-2.5 py-1.5 rounded-md transition"
                title="GDPR Zero-Retention Reset (Wipe in-memory state)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
