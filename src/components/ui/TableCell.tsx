import React, { ReactNode } from 'react';

export default function TableCell({ children }: { children: ReactNode }) {
  return <td className="p-2 border">{children}</td>;
}