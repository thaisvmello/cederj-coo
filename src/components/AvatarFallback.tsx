import { User } from 'lucide-react';

interface AvatarFallbackProps {
  avatarUrl?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AvatarFallback({ avatarUrl, name, size = 'md', className = '' }: AvatarFallbackProps) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const initials = name ? 
    name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 
    '?';

  return (
    <div 
      className={`relative rounded-full overflow-hidden ${sizes[size]} ${className}`}
      style={{ backgroundColor: getAvatarColor(name || '') }}
    >
      {avatarUrl ? (
        <img 
          src={avatarUrl} 
          alt={name || 'Usuário'} 
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextSibling.style.display = 'flex';
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
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