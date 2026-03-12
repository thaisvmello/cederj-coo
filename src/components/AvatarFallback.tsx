"use client";

import React, { useState } from 'react';
import { User } from 'lucide-react';

interface AvatarFallbackProps {
  avatarUrl?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AvatarFallback({ avatarUrl, name, size = 'md', className = '' }: AvatarFallbackProps) {
  const [imgError, setImgError] = useState(false);
  
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const initials = name ? 
    name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 
    '?';

  const bgColor = React.useMemo(() => getAvatarColor(name || ''), [name]);

  return (
    <div 
      className={`relative rounded-full overflow-hidden flex items-center justify-center shrink-0 ${sizes[size]} ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      {avatarUrl && !imgError ? (
        <img 
          src={avatarUrl} 
          alt={name || 'Usuário'} 
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">
            {initials}
          </span>
          {!name && !initials && <User className="w-4 h-4 text-white/80" />}
        </div>
      )}
    </div>
  );
}

function getAvatarColor(name: string): string {
  const colors = [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
    '#EC4899', '#14B8A6', '#06B6D4', '#0EA5E9', '#7C3AED'
  ];
  const sum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[sum % colors.length];
}