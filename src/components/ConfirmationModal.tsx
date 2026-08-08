import { AlertTriangle, Check, HelpCircle, Trash2, X } from 'lucide-react';
import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'warning',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <Trash2 className="h-6 w-6 text-rose-500" />,
          bgIcon: 'bg-rose-500/10 border-rose-500/20',
          btn: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
        };
      case 'info':
        return {
          icon: <Check className="h-6 w-6 text-blue-500" />,
          bgIcon: 'bg-blue-500/10 border-blue-500/20',
          btn: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/30'
        };
      case 'warning':
      default:
        return {
          icon: <AlertTriangle className="h-6 w-6 text-amber-500" />,
          bgIcon: 'bg-amber-500/10 border-amber-500/20',
          btn: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30'
        };
    }
  };

  const style = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 text-center flex flex-col items-center">
        <div className={`p-3 rounded-2xl border ${style.bgIcon} mb-4 flex items-center justify-center`}>
          {style.icon}
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          {title}
        </h3>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
          {message}
        </p>

        <div className="flex items-center justify-center gap-3 w-full">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-xl ${style.btn} text-xs font-semibold shadow-md transition-all active:scale-95`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
