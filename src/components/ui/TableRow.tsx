import React, { ReactNode } from 'react';

export default function TableRow({ children }: { children: ReactNode }) {
  return <tr>{children}</tr>;
}