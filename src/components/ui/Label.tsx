import React, { ReactNode } from 'react';

export default function Label({ children }: { children: ReactNode }) {
  return <label className="block mb-1 font-medium">{children}</label>;
}