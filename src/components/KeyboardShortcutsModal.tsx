import React from 'react';
import { X, Keyboard, ArrowUpDown, FileText, Settings2, ZoomIn, Printer } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcutGroups = [
    {
      title: 'Roster & Patient Navigation',
      icon: <ArrowUpDown className="w-4 h-4 text-brand-blue" />,
      shortcuts: [
        { keys: ['↓', 'or', 'J'], description: 'Select Next Resident' },
        { keys: ['↑', 'or', 'K'], description: 'Select Previous Resident' },
      ],
    },
    {
      title: 'Document Switcher',
      icon: <FileText className="w-4 h-4 text-brand-blue" />,
      shortcuts: [
        { keys: ['1'], description: 'Switch to Care Home Overview' },
        { keys: ['2'], description: 'Switch to Patient Clinical Summary' },
        { keys: ['3'], description: 'Switch to Itemized Invoice' },
        { keys: ['4'], description: 'Switch to Multi-Print View' },
      ],
    },
    {
      title: 'Document Zoom & Viewport',
      icon: <ZoomIn className="w-4 h-4 text-brand-blue" />,
      shortcuts: [
        { keys: ['+'], description: 'Zoom In (+10%)' },
        { keys: ['-'], description: 'Zoom Out (-10%)' },
        { keys: ['0'], description: 'Fit Document to Screen Width / Reset' },
      ],
    },
    {
      title: 'Editor & Actions',
      icon: <Settings2 className="w-4 h-4 text-brand-blue" />,
      shortcuts: [
        { keys: ['E'], description: 'Toggle Live Patient Editor Drawer' },
        { keys: ['Ctrl', 'P'], description: 'Print Current Document' },
        { keys: ['?'], description: 'Open this Keyboard Shortcuts Guide' },
        { keys: ['Esc'], description: 'Close Modal / Active Drawer' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-scaleUp flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-brand-navy text-white px-4 sm:px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Keyboard className="w-5 h-5 text-brand-soft" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Keyboard Shortcuts</h2>
              <p className="text-xs text-slate-300">
                Speed up your clinical review and document workflow
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

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {shortcutGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                {group.icon}
                <span>{group.title}</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl divide-y divide-slate-200/70 overflow-hidden">
                {group.shortcuts.map((sc, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-2.5 sm:px-3 flex items-center justify-between gap-2"
                  >
                    <span className="text-slate-700 font-medium">{sc.description}</span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {sc.keys.map((k, kIdx) =>
                        k === 'or' ? (
                          <span key={kIdx} className="text-[10px] text-slate-400 font-medium px-0.5">
                            or
                          </span>
                        ) : (
                          <kbd
                            key={kIdx}
                            className="min-w-[24px] text-center px-2 py-1 bg-white border border-slate-300 rounded shadow-2xs font-mono font-bold text-[11px] text-brand-navy"
                          >
                            {k}
                          </kbd>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 flex-shrink-0">
          <span>Shortcuts are active whenever not typing in text fields.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-brand-navy hover:bg-brand-navy-dark text-white rounded-lg font-semibold text-xs transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
