import React from 'react';

interface TextareaProps {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({ id, value, onChange, placeholder, className, disabled }) => {
  return (
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${className}`}
      disabled={disabled}
    />
  );
};