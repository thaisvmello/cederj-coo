import React, { ReactNode } from 'react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function Dialog({ open, onClose, children }: DialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-4 max-w-lg w-full">{children}</div>
      <button onClick={onClose} className="absolute top-2 right-2 text-gray-500">
        ✕
      </button>
    </div>
  );
}