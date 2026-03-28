import React, { InputHTMLAttributes } from 'react';

export default function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="w-full p-2 border rounded" {...props} />;
}