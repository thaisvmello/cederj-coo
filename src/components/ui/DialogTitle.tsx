import React, { ReactNode } from 'react';

export default function DialogTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-xl font-bold mb-2">{children}</h2>;
}