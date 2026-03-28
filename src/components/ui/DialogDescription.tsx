import React, { ReactNode } from 'react';

export default function DialogDescription({ children }: { children: ReactNode }) {
  return <p className="mb-4">{children}</p>;
}