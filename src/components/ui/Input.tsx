import React from 'react';

interface InputProps {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  disabled?: boolean;
}

export const Input: React.FC<InputProps> = ({ id, value, onChange, placeholder, type = 'text', className, disabled }) => {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      disabled={disabled}
    />
  );
};