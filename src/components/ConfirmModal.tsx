import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  warningNote?: string;
  isProcessing?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title = 'মুছে ফেলার নিশ্চিতকরণ',
  message,
  confirmLabel = 'হ্যাঁ, মুছে ফেলুন',
  cancelLabel = 'না, বাতিল',
  warningNote,
  isProcessing = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
        <button
          onClick={onCancel}
          disabled={isProcessing}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
            <Trash2 className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 leading-snug">{title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">এই কাজটি আর ফিরিয়ে আনা যাবে না</p>
          </div>
        </div>

        <p className="text-sm font-semibold text-slate-700 leading-relaxed mb-4">
          {message}
        </p>

        {warningNote && (
          <div className="mb-5 bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs font-semibold flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{warningNote}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 transition min-h-[44px] cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-md flex items-center justify-center gap-2 min-h-[44px] cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <span>মুছে ফেলা হচ্ছে...</span>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>{confirmLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
