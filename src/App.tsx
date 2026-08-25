import React, { useState, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { EmptyState } from './components/EmptyState';
import { BatchManager } from './components/BatchManager';
import { BatchPrintContainer } from './components/print/BatchPrintContainer';
import { BatchExportModal, BatchExportProgressState } from './components/BatchExportModal';
import { CareHomeSummary, PatientRow, ValidationError } from './types/audiology';
import { parseAudiologyCsv } from './utils/csvParser';
import { SAMPLE_CSV_DATA } from './utils/sampleData';
import { exportBatchZipArchive } from './utils/pdfGenerator';

export function App() {
  const [summary, setSummary] = useState<CareHomeSummary | null>(null);
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [warnings, setWarnings] = useState<ValidationError[]>([]);
  const [isPrintAllMode, setIsPrintAllMode] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<BatchExportProgressState>({
    isOpen: false,
    isCompleted: false,
    percent: 0,
    current: 0,
    total: 0,
    status: '',
    itemTitle: '',
  });

  const handleProcessCsvString = useCallback(async (csvText: string) => {
    const result = await parseAudiologyCsv(csvText);
    setSummary(result.careHomeSummary);
    setPatients(result.patients);
    setErrors(result.errors);
    setWarnings(result.warnings);
  }, []);

  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        handleProcessCsvString(text);
      }
    };
    reader.readAsText(file);
  }, [handleProcessCsvString]);

  const handleLoadSampleData = useCallback(() => {
    handleProcessCsvString(SAMPLE_CSV_DATA);
  }, [handleProcessCsvString]);

  const handleResetSession = useCallback(() => {
    if (window.confirm('Are you sure you want to flush all patient records from memory? This action cannot be undone (GDPR Zero-Retention).')) {
      setSummary(null);
      setPatients([]);
      setErrors([]);
      setWarnings([]);
    }
  }, []);

  const handleUpdatePatient = useCallback((updatedPatient: PatientRow) => {
    setPatients((prevPatients) => {
      const nextPatients = prevPatients.map((p) =>
        p.id === updatedPatient.id ? updatedPatient : p
      );

      // Recalculate summary stats
      const seen = nextPatients.filter((p) => p.seen);
      const unseen = nextPatients.filter((p) => !p.seen);
      const totalRevenue = seen.reduce((sum, p) => sum + p.totalAmount, 0);
      const screeningsCount = seen.filter((p) => p.screening).length;
      const audiogramsCount = seen.filter((p) => p.audiogram).length;
      const waxRemovalCount = seen.filter((p) => p.hasEarWax).length;

      setSummary((prevSummary) =>
        prevSummary
          ? {
              ...prevSummary,
              totalPatients: nextPatients.length,
              seenPatientsCount: seen.length,
              unseenPatientsCount: unseen.length,
              totalRevenue,
              screeningsCount,
              audiogramsCount,
              waxRemovalCount,
              seenPatients: seen,
              unseenPatients: unseen,
            }
          : null
      );

      return nextPatients;
    });
  }, []);

  const handlePrintSingle = useCallback(() => {
    setIsPrintAllMode(false);
    setTimeout(() => {
      window.print();
    }, 50);
  }, []);

  const handlePrintBatch = useCallback(() => {
    setIsPrintAllMode(true);
    setTimeout(() => {
      window.print();
    }, 100);
  }, []);

  const handleExportBatchZip = useCallback(async () => {
    if (!summary || patients.length === 0) return;

    const seenCount = patients.filter((p) => p.seen).length;
    const totalDocs = 1 + seenCount * 2;

    setBatchProgress({
      isOpen: true,
      isCompleted: false,
      percent: 0,
      current: 0,
      total: totalDocs,
      status: 'Preparing PDF generator...',
      itemTitle: 'Care Home Batch Export',
    });

    try {
      await exportBatchZipArchive(summary, patients, (progress) => {
        setBatchProgress((prev) => ({
          ...prev,
          ...progress,
          isOpen: true,
        }));
      });

      setBatchProgress((prev) => ({
        ...prev,
        isCompleted: true,
        percent: 100,
        status: 'All individual PDFs successfully bundled into ZIP!',
      }));
    } catch (error) {
      console.error('Batch export failed:', error);
      alert('An error occurred during batch PDF generation.');
      setBatchProgress((prev) => ({ ...prev, isOpen: false }));
    }
  }, [summary, patients]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 w-full overflow-x-hidden">
      <Navbar
        onFileUpload={handleFileUpload}
        onLoadSampleData={handleLoadSampleData}
        onResetSession={handleResetSession}
        onPrint={handlePrintBatch}
        onExportBatchZip={handleExportBatchZip}
        hasData={!!summary && patients.length > 0}
        totalPatientsCount={patients.length}
      />

      <main className="flex-1 w-full min-w-0">
        {summary && patients.length > 0 ? (
          <>
            {/* Standard Screen & Single Document View */}
            <div className={isPrintAllMode ? 'hidden print:block' : 'block'}>
              {isPrintAllMode && (
                <div className="print-only">
                  <BatchPrintContainer summary={summary} patients={patients} />
                </div>
              )}
            </div>

            <div className={isPrintAllMode ? 'print:hidden' : 'block w-full min-w-0'}>
              <BatchManager
                summary={summary}
                patients={patients}
                errors={errors}
                warnings={warnings}
                onUpdatePatient={handleUpdatePatient}
                onPrintSingle={handlePrintSingle}
                onPrintBatch={handlePrintBatch}
                onExportBatchZip={handleExportBatchZip}
              />
            </div>
          </>
        ) : (
          <EmptyState
            onFileUpload={handleFileUpload}
            onLoadSample={handleLoadSampleData}
          />
        )}
      </main>

      {/* Batch ZIP Export Modal with Live Progress Tracker */}
      <BatchExportModal
        progress={batchProgress}
        onClose={() => setBatchProgress((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

export default App;
