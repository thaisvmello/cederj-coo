import React, { ReactNode } from 'react';

export default function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs">
      {children}
    </span>
  );
}