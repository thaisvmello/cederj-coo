import React, { ReactNode } from 'react';

export default function Table({ children }: { children: ReactNode }) {
  return <table className="w-full border-collapse">{children}</table>;
}