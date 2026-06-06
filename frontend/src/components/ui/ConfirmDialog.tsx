'use client';

import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  title:       string;
  message:     string;
  confirmText?: string;
  cancelText?:  string;
  danger?:     boolean;
  loading?:    boolean;
  onConfirm:   () => void;
  onCancel:    () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmText = 'Confirm',
  cancelText  = 'Cancel',
  danger      = true,
  loading     = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="relative w-full max-w-sm rounded-2xl border border-[#27272A] bg-[#0D1117] p-6 shadow-2xl"
        style={{ boxShadow: danger ? '0 0 40px rgba(239,68,68,0.15)' : '0 0 40px rgba(124,58,237,0.15)' }}
      >
        <div className={`flex items-center justify-center w-12 h-12 rounded-full mx-auto mb-4 ${danger ? 'bg-red-500/10' : 'bg-violet-500/10'}`}>
          <AlertTriangle className={`w-6 h-6 ${danger ? 'text-red-400' : 'text-violet-400'}`} />
        </div>
        <h3 className="text-center text-base font-semibold text-white mb-2">{title}</h3>
        <p className="text-center text-sm text-[#71717a] mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1" disabled={loading}>
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              danger
                ? 'bg-red-600 hover:bg-red-500 text-white focus:ring-2 focus:ring-red-500/50'
                : 'btn-primary'
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing…
              </span>
            ) : confirmText}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
