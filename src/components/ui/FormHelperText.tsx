import React, { ReactNode } from 'react';

export default function FormHelperText({ children }: { children: ReactNode }) {
  return <p className="text-sm text-gray-500 mt-1">{children}</p>;
}