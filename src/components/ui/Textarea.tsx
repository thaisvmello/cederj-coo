import React, { TextareaHTMLAttributes } from 'react';

export default function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="w-full p-2 border rounded" {...props} />;
}