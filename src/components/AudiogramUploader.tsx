import React, { useRef } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';

interface AudiogramUploaderProps {
  currentImageUrl?: string;
  onImageChange: (imageUrl?: string) => void;
  patientName: string;
}

export const AudiogramUploader: React.FC<AudiogramUploaderProps> = ({
  currentImageUrl,
  onImageChange,
  patientName,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onImageChange(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-brand-blue" />
          Page 2 Full Hearing Test Chart Attachment ({patientName})
        </h4>
        {currentImageUrl && (
          <button
            onClick={() => onImageChange(undefined)}
            className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 font-medium"
          >
            <X className="w-3.5 h-3.5" /> Remove Image
          </button>
        )}
      </div>

      {currentImageUrl ? (
        <div className="flex items-center gap-4 bg-slate-50 p-2.5 rounded-md border border-slate-200">
          <img
            src={currentImageUrl}
            alt="Full Hearing Test Preview"
            className="h-16 w-24 object-cover rounded border border-slate-300"
          />
          <div className="text-xs text-slate-600">
            <span className="font-semibold text-emerald-700 block">✓ Full Hearing Test Chart Attached</span>
            <span className="text-[11px] text-slate-500">
              Page 2 will be automatically included when printing or previewing this patient's report.
            </span>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-brand-blue rounded-lg p-4 text-center cursor-pointer transition bg-slate-50/50 hover:bg-brand-soft/20"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files?.[0]) handleFile(e.target.files[0]);
            }}
            accept="image/*"
            className="hidden"
          />
          <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
          <p className="text-xs font-semibold text-slate-700">
            Click or drag &amp; drop a full hearing test image chart (PNG/JPG)
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Appends an exact A4 Page 2 Diagnostic Chart to this resident's summary
          </p>
        </div>
      )}
    </div>
  );
};
