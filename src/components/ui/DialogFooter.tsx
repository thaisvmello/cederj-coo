import React, { ReactNode } from 'react';

export default function DialogFooter({ children }: { children: ReactNode }) {
  return <div className="flex justify-end space-x-2 mt-4">{children}</div>;
}