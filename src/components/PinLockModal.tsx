import React, { useState, useEffect, useCallback } from 'react';
import { Lock, ShieldCheck, AlertCircle, Delete, KeyRound, CheckCircle2, X } from 'lucide-react';
import { verifyPin, updatePin, resetFailedAttempts, DEFAULT_PIN } from '../utils/security';

interface PinLockModalProps {
  isOpen: boolean;
  onUnlock: () => void;
  mode?: 'unlock' | 'change-pin';
  onCloseChangePin?: () => void;
  onSessionWipe?: () => void;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({
  isOpen,
  onUnlock,
  mode = 'unlock',
  onCloseChangePin,
  onSessionWipe,
}) => {
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [isLockedOut, setIsLockedOut] = useState<boolean>(false);

  // Change PIN wizard states
  const [changeStep, setChangeStep] = useState<'current' | 'new' | 'confirm'>('current');
  const [currentPin, setCurrentPin] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [changeSuccess, setChangeSuccess] = useState<boolean>(false);

  // Trigger error shake animation
  const triggerError = useCallback((msg: string) => {
    setErrorMsg(msg);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
    setPin('');
  }, []);

  // Handle PIN submission in Unlock mode
  const handleUnlockSubmit = useCallback(async (pinToVerify: string) => {
    const result = await verifyPin(pinToVerify);
    if (result.success) {
      setErrorMsg('');
      setPin('');
      onUnlock();
    } else {
      setRemainingAttempts(result.remainingAttempts);
      if (result.isLockedOut) {
        setIsLockedOut(true);
        triggerError('Max attempts exceeded. In-memory patient records have been wiped for GDPR safety.');
        if (onSessionWipe) onSessionWipe();
      } else {
        triggerError(`Incorrect PIN. ${result.remainingAttempts} attempt(s) remaining.`);
      }
    }
  }, [onUnlock, onSessionWipe, triggerError]);

  // Handle PIN submission in Change-PIN mode
  const handleChangePinStep = useCallback(async (enteredVal: string) => {
    if (changeStep === 'current') {
      const result = await verifyPin(enteredVal);
      if (result.success) {
        setCurrentPin(enteredVal);
        setPin('');
        setErrorMsg('');
        setChangeStep('new');
      } else {
        triggerError('Incorrect current PIN.');
      }
    } else if (changeStep === 'new') {
      setNewPin(enteredVal);
      setPin('');
      setErrorMsg('');
      setChangeStep('confirm');
    } else if (changeStep === 'confirm') {
      if (enteredVal !== newPin) {
        triggerError('New PINs do not match. Please try again.');
        setChangeStep('new');
        setNewPin('');
        setConfirmPin('');
      } else {
        const updateResult = await updatePin(currentPin, enteredVal);
        if (updateResult.success) {
          setChangeSuccess(true);
          setTimeout(() => {
            if (onCloseChangePin) onCloseChangePin();
          }, 1200);
        } else {
          triggerError(updateResult.message);
        }
      }
    }
  }, [changeStep, currentPin, newPin, onCloseChangePin, triggerError]);

  // Handle digit input
  const handleDigit = useCallback((digit: string) => {
    if (pin.length < 4 && !isLockedOut) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMsg('');

      if (nextPin.length === 4) {
        if (mode === 'unlock') {
          setTimeout(() => handleUnlockSubmit(nextPin), 150);
        } else {
          setTimeout(() => handleChangePinStep(nextPin), 150);
        }
      }
    }
  }, [pin, isLockedOut, mode, handleUnlockSubmit, handleChangePinStep]);

  // Handle backspace
  const handleBackspace = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  }, []);

  // Handle clear
  const handleClear = useCallback(() => {
    setPin('');
    setErrorMsg('');
  }, []);

  // Physical keyboard listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape' && mode === 'change-pin' && onCloseChangePin) {
        onCloseChangePin();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleDigit, handleBackspace, mode, onCloseChangePin]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 sm:p-7 relative overflow-hidden text-center">
        {/* Close button for Change PIN mode */}
        {mode === 'change-pin' && onCloseChangePin && (
          <button
            onClick={onCloseChangePin}
            className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Branding & Shield Icon */}
        <div className="flex flex-col items-center mb-4">
          <div className="relative mb-3">
            <div className="w-16 h-16 rounded-full bg-brand-soft flex items-center justify-center ring-4 ring-brand-soft/50 shadow-inner">
              <img src="./logo.png" alt="EliteSight HomeCare" className="h-11 w-11 object-contain rounded-full" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-brand-navy text-white p-1 rounded-full shadow">
              {mode === 'change-pin' ? <KeyRound className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            </div>
          </div>

          <h2 className="text-lg sm:text-xl font-extrabold text-brand-navy tracking-tight">
            {mode === 'unlock' ? 'Portal Locked' : 'Change Clinical PIN'}
          </h2>

          <p className="text-xs text-slate-500 mt-0.5">
            {mode === 'unlock'
              ? 'Enter 4-digit PIN to access clinical records'
              : changeStep === 'current'
              ? 'Step 1: Enter current 4-digit PIN'
              : changeStep === 'new'
              ? 'Step 2: Enter new 4-digit PIN'
              : 'Step 3: Confirm new 4-digit PIN'}
          </p>
        </div>

        {/* Success message in Change PIN mode */}
        {changeSuccess && (
          <div className="py-6 space-y-2 animate-fadeIn">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
            <p className="text-sm font-bold text-emerald-800">PIN Changed Successfully!</p>
          </div>
        )}

        {!changeSuccess && (
          <>
            {/* 4-Dot PIN Indicator with Shake Animation */}
            <div
              className={`flex items-center justify-center gap-4 my-5 transition-transform ${
                isShaking ? 'animate-shake' : ''
              }`}
            >
              {[0, 1, 2, 3].map((idx) => {
                const isFilled = idx < pin.length;
                return (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full transition-all duration-150 ${
                      isFilled
                        ? 'bg-brand-blue scale-110 ring-4 ring-brand-blue/20'
                        : 'bg-slate-200 border-2 border-slate-300'
                    }`}
                  />
                );
              })}
            </div>

            {/* Error Message */}
            {errorMsg ? (
              <div className="mb-4 bg-rose-50 border border-rose-200 rounded-lg p-2 text-xs text-rose-700 font-medium flex items-center justify-center gap-1.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            ) : (
              <div className="h-6 mb-2" />
            )}

            {/* Lockout Reset Button if locked out */}
            {isLockedOut ? (
              <div className="space-y-3">
                <button
                  onClick={() => {
                    resetFailedAttempts();
                    setIsLockedOut(false);
                    setErrorMsg('');
                    setPin('');
                  }}
                  className="w-full bg-brand-navy hover:bg-brand-navy-dark text-white text-xs font-semibold py-2.5 rounded-lg shadow transition"
                >
                  Reset &amp; Retry PIN
                </button>
              </div>
            ) : (
              /* 3x4 Touch Keypad */
              <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto mb-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleDigit(num.toString())}
                    className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-brand-soft border border-slate-200 text-lg font-bold text-slate-800 shadow-sm transition active:scale-95 flex items-center justify-center"
                  >
                    {num}
                  </button>
                ))}

                {/* Clear button */}
                <button
                  type="button"
                  onClick={handleClear}
                  className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-500 transition active:scale-95 flex items-center justify-center"
                >
                  Clear
                </button>

                {/* Digit 0 */}
                <button
                  type="button"
                  onClick={() => handleDigit('0')}
                  className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-brand-soft border border-slate-200 text-lg font-bold text-slate-800 shadow-sm transition active:scale-95 flex items-center justify-center"
                >
                  0
                </button>

                {/* Backspace button */}
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 text-slate-600 transition active:scale-95 flex items-center justify-center"
                  title="Backspace"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Footer Notice & Default PIN Reminder */}
            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>GDPR Zero-Retention Session Lock</span>
              </div>
              {mode === 'unlock' && (
                <p className="text-[10px] text-slate-400">
                  Default PIN: <strong className="text-slate-600 font-mono">{DEFAULT_PIN}</strong> (Changeable in settings)
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
