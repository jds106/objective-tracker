import { Modal } from './Modal.js';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  isLoading?: boolean;
}

/**
 * Replacement for native `window.confirm()` that matches the app design system.
 * Renders within the existing `Modal` focus trap for accessibility compliance.
 */
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  isLoading = false,
}: ConfirmModalProps) {
  const confirmClasses = variant === 'danger'
    ? 'bg-red-600 hover:bg-red-500 text-white focus:ring-red-500/50'
    : 'bg-indigo-600 hover:bg-indigo-500 text-white focus:ring-indigo-500/50';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-sm">
      <p className="text-sm text-slate-300">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500/50"
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 ${confirmClasses}`}
        >
          {isLoading ? 'Processing…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
