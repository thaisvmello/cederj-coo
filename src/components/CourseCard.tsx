import { Star, Folder, Hash, Calendar, Bookmark } from 'lucide-react';
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

  const isMandatory = course.subject_type?.toLowerCase().includes('obrigatória') || course.is_mandatory;

  return (
    <div 
      onClick={onClick}
      className="group bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer relative flex flex-col h-full"
    >
      <button 
        onClick={onToggleFavorite}
        className={`absolute top-4 right-4 p-2 rounded-full transition-all z-10 ${
          isFavorite 
            ? 'text-amber-400 bg-amber-50' 
            : 'text-gray-300 hover:text-amber-400 hover:bg-amber-50'
        }`}
      >
        <Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
      </button>

      <div className="flex items-start gap-4 mb-4">
        <div className={`p-3 rounded-xl shrink-0 ${colorClass}`}>
          <Folder className="w-6 h-6" />
        </div>
        
        <div className="flex-1 min-w-0 pr-8">
          <h3 className="font-bold text-gray-900 text-base leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
            {course.name}
          </h3>
        </div>
      </div>

      <div className="mt-auto space-y-3">
        <div className="flex flex-wrap gap-2">
          {course.code && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-md uppercase tracking-wider">
              <Hash className="w-3 h-3" />
              {course.code}
            </span>
          )}
          
          {course.period && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md uppercase tracking-wider">
              <Calendar className="w-3 h-3" />
              {course.period}º Período
            </span>
          )}

          <span className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider ${
            isMandatory 
              ? 'bg-emerald-50 text-emerald-600' 
              : 'bg-purple-50 text-purple-600'
          }`}>
            <Bookmark className="w-3 h-3" />
            {course.subject_type || (course.is_mandatory ? 'Obrigatória' : 'Optativa')}
          </span>
        </div>
        
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-widest">
            {fileCount} {fileCount === 1 ? 'arquivo' : 'arquivos'}
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
      </div>
    </div>
  );
}