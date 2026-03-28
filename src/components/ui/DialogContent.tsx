import React from 'react';
import { DialogContent as HeadlessDialogContent } from '@headlessui/react';

interface DialogContentProps {
  children: React.ReactNode;
}

export const DialogContent: React.FC<DialogContentProps> = ({ children }) => {
  return (
    <HeadlessDialogContent className="p-6">
      {children}
    </HeadlessDialogContent>
  );
};