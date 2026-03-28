import React from 'react';
import { Dialog as HeadlessDialog } from '@headlessui/react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ open, onClose, children }) => {
  return (
    <HeadlessDialog open={open} onClose={onClose}>
      {children}
    </HeadlessDialog>
  );
};