import React from 'react';

interface DialogDescriptionProps {
  children: React.ReactNode;
}

export const DialogDescription: React.FC<DialogDescriptionProps> = ({ children }) => {
  return (
    <div className="text-sm text-gray-600 mb-4">
      {children}
    </div>
  );
};