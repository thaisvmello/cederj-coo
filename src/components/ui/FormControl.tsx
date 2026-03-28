import React, { ReactNode } from 'react';

export default function FormControl({ children }: { children: ReactNode }) {
  return <div className="mb-4">{children}</div>;
}