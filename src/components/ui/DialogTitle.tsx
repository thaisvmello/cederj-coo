import React from 'react';

interface DialogTitleProps {
  children: React.ReactNode;
}

export const DialogTitle: React.FC<DialogTitleProps> = ({ children }) => {
  return (
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      {children}
    </h3>
  );
};