import React, { ReactNode } from 'react';

export default function TableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}