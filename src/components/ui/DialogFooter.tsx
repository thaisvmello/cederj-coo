import React from 'react';

interface DialogFooterProps {
  children: React.ReactNode;
}

export const DialogFooter: React.FC<DialogFooterProps> = ({ children }) => {
  return (
    <div className="flex justify-end gap-2 pt-4">
      {children}
    </div>
  );
};