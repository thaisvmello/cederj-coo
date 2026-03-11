import { Star, Folder } from 'lucide-react';
import type { Course } from '../lib/types';

interface CourseCardProps {
  course: Course;
  fileCount: number;
  isFavorite: boolean;
  onClick: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
}

export function CourseCard({ course, fileCount, isFavorite, onClick, onToggleFavorite }: CourseCardProps) {
  const colors = [
    'text-blue-500 bg-blue-50',
    'text-purple-500 bg-purple-50',
    'text-emerald-500 bg-emerald-50',
    'text-amber-500 bg-amber-50',
    'text-rose-500 bg-rose-50',
    'text-indigo-500 bg-indigo-50',
  ];
  
  const colorIndex = course.name.length % colors.length;
  const colorClass = colors[colorIndex];

  return (
    <div 
      onClick={onClick}
      className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all cursor-pointer relative"
    >
      <button 
        onClick={onToggleFavorite}
        className={`absolute top-4 right-4 p-1 rounded-full transition ${
          isFavorite ? 'text-amber-400' : 'text-gray-300 hover:text-amber-400'
        }`}
      >
        <Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
      </button>

      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl ${colorClass}`}>
          <Folder className="w-6 h-6" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
            {course.name}
          </h3>
          <p className="text-xs text-gray-500 font-medium mb-3">
            {course.code || 'SEM CÓDIGO'}
          </p>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {course.period && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded uppercase">
                {course.period}
              </span>
            )}
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
              course.is_mandatory ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'
            }`}>
              {course.is_mandatory ? 'Obrigatória' : 'Optativa'}
            </span>
          </div>
          
          <p className="text-[10px] text-gray-400 font-medium">
            {fileCount} {fileCount === 1 ? 'arquivo' : 'arquivos'}
          </p>
        </div>
      </div>
    </div>
  );
}