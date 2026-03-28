import React, { ReactNode } from 'react';

export default function DialogContent({ children }: { children: ReactNode }) {
  return <div className="p-4">{children}</div>;
}