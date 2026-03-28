import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline';
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'default', onClick, disabled, loading, className }) => {
  const baseClasses = 'px-4 py-2 rounded-md text-sm font-medium transition-colors';
  const variantClasses = variant === 'default' 
    ? 'bg-blue-600 text-white hover:bg-blue-700'
    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50';
  
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
  const loadingClasses = loading ? 'opacity-75 cursor-not-allowed' : '';
  
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses} ${disabledClasses} ${loadingClasses} ${className}`}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M12 4v8" />
        </svg>
      )}
      {children}
    </button>
  );
};