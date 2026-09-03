import React, { useState, useCallback, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { EmptyState } from './components/EmptyState';
import { BatchManager } from './components/BatchManager';
import { AddPatientModal } from './components/AddPatientModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { BatchPrintContainer } from './components/print/BatchPrintContainer';
import { BatchExportModal, BatchExportProgressState } from './components/BatchExportModal';
import { PinLockModal } from './components/PinLockModal';
import { CareHomeSummary, PatientRow, ValidationError } from './types/audiology';
import { parseAudiologyCsv, generateCleanedCsv } from './utils/csvParser';
import { SAMPLE_CSV_DATA } from './utils/sampleData';
import { exportBatchZipArchive, sanitizeFileName, triggerBlobDownload } from './utils/pdfGenerator';
import { toTitleCase } from './utils/cleaners';
import {
  INACTIVITY_TIMEOUT_MS,
  initializePinStorage,
  encryptSessionData,
  decryptSessionData,
  clearEncryptedSession,
} from './utils/security';
import { recalculateSummary } from './utils/sessionHelper';
import { ShieldCheck, X } from 'lucide-react';

export function App() {
  const [summary, setSummary] = useState<CareHomeSummary | null>(null);
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [warnings, setWarnings] = useState<ValidationError[]>([]);
  const [isPrintAllMode, setIsPrintAllMode] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [isChangePinOpen, setIsChangePinOpen] = useState<boolean>(false);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [activePin, setActivePin] = useState<string | null>(null);
  const [restoredToast, setRestoredToast] = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState<BatchExportProgressState>({
    isOpen: false,
    isCompleted: false,
    percent: 0,
    current: 0,
    total: 0,
    status: '',
    itemTitle: '',
  });

  // Initialize PIN storage on mount
  useEffect(() => {
    initializePinStorage();
  }, []);

  // Continuous background encrypted session auto-save
  useEffect(() => {
    if (activePin && summary && patients.length > 0) {
      encryptSessionData(
        {
          summary,
          patients,
          errors,
          warnings,
          savedAt: Date.now(),
        },
        activePin
      );
    }
  }, [summary, patients, errors, warnings, activePin]);

  // Inactivity auto-lock listener (locks after 5 minutes of no user interaction)
  useEffect(() => {
    if (isLocked) return;

    let timer: number;

    const resetTimer = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        setIsLocked(true);
      }, INACTIVITY_TIMEOUT_MS);
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      window.clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [isLocked]);

  const handleUnlock = useCallback(async (enteredPin: string) => {
    setActivePin(enteredPin);
    setIsLocked(false);

    // If memory is empty on unlock (e.g. after refresh), attempt decryption
    if (!summary || patients.length === 0) {
      const recovered = await decryptSessionData(enteredPin);
      if (recovered && recovered.patients && recovered.patients.length > 0) {
        setSummary(recovered.summary);
        setPatients(recovered.patients);
        setErrors(recovered.errors || []);
        setWarnings(recovered.warnings || []);
        setRestoredToast(
          `Restored active session from encrypted cache (${recovered.patients.length} resident records).`
        );
        setTimeout(() => setRestoredToast(null), 6000);
      }
    }
  }, [summary, patients.length]);

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
      clearEncryptedSession();
      setSummary(null);
      setPatients([]);
      setErrors([]);
      setWarnings([]);
      setRestoredToast(null);
    }
  }, []);

  const handleWipePatientData = useCallback(() => {
    clearEncryptedSession();
    setSummary(null);
    setPatients([]);
    setErrors([]);
    setWarnings([]);
    setRestoredToast(null);
  }, []);

  const handleUpdatePatient = useCallback((updatedPatient: PatientRow) => {
    setPatients((prevPatients) => {
      const nextPatients = prevPatients.map((p) =>
        p.id === updatedPatient.id ? updatedPatient : p
      );
      setSummary((prevSummary) => recalculateSummary(nextPatients, prevSummary));
      return nextPatients;
    });
  }, []);

  const handleAddPatient = useCallback((newPatient: PatientRow) => {
    setPatients((prevPatients) => {
      const nextPatients = [...prevPatients, newPatient];
      setSummary((prevSummary) => recalculateSummary(nextPatients, prevSummary));
      return nextPatients;
    });
  }, []);

  const handleDeletePatient = useCallback((patientId: string) => {
    setPatients((prevPatients) => {
      const nextPatients = prevPatients.filter((p) => p.id !== patientId);
      setSummary((prevSummary) => recalculateSummary(nextPatients, prevSummary));
      return nextPatients;
    });
  }, []);

  const handleExportCleanedCsv = useCallback(() => {
    if (patients.length === 0) return;

    const csvContent = generateCleanedCsv(patients, true);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const careHomeName = toTitleCase(summary?.careHome || 'Care Home');
    const filename = sanitizeFileName(`${careHomeName} - Resident Roster.csv`);

    triggerBlobDownload(blob, filename);
  }, [patients, summary]);

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
    <div className="min-h-screen flex flex-col bg-slate-100 w-full overflow-x-hidden relative">
      <Navbar
        onFileUpload={handleFileUpload}
        onLoadSampleData={handleLoadSampleData}
        onResetSession={handleResetSession}
        onPrint={handlePrintBatch}
        onExportBatchZip={handleExportBatchZip}
        onExportCleanedCsv={handleExportCleanedCsv}
        onLock={() => setIsLocked(true)}
        onChangePin={() => setIsChangePinOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
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
                onDeletePatient={handleDeletePatient}
                onAddPatientClick={() => setIsAddPatientOpen(true)}
                onPrintSingle={handlePrintSingle}
                onPrintBatch={handlePrintBatch}
                onExportBatchZip={handleExportBatchZip}
                onExportCleanedCsv={handleExportCleanedCsv}
                onOpenShortcuts={() => setIsShortcutsOpen(true)}
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

      {/* Crash Recovery Toast Notification */}
      {restoredToast && (
        <div className="no-print fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 animate-slideUp">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="font-medium">{restoredToast}</span>
          <button
            onClick={() => setRestoredToast(null)}
            className="ml-2 p-1 text-slate-400 hover:text-white rounded transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Add Walk-in Resident Modal */}
      <AddPatientModal
        isOpen={isAddPatientOpen}
        onClose={() => setIsAddPatientOpen(false)}
        onAddPatient={handleAddPatient}
        summary={summary}
        existingCount={patients.length}
      />

      {/* Keyboard Shortcuts Guide Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Batch ZIP Export Modal with Live Progress Tracker */}
      <BatchExportModal
        progress={batchProgress}
        onClose={() => setBatchProgress((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Main Lock Screen Modal */}
      <PinLockModal
        isOpen={isLocked}
        onUnlock={handleUnlock}
        mode="unlock"
        onSessionWipe={handleWipePatientData}
      />

      {/* Change PIN Wizard Modal */}
      <PinLockModal
        isOpen={isChangePinOpen}
        onUnlock={() => {}}
        mode="change-pin"
        onCloseChangePin={() => setIsChangePinOpen(false)}
      />
    </div>
  );
}

export default App;
