import React, { ButtonHTMLAttributes, ReactNode } from 'react';

export default function Button({
  children,
  onClick,
  disabled,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}