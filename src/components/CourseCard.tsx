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
  // Cores suaves para o ícone da pasta, como no exemplo
  const colors = [
    'bg-indigo-50 text-indigo-400',
    'bg-rose-50 text-rose-400',
    'bg-blue-50 text-blue-400',
    'bg-emerald-50 text-emerald-400',
  ];
  
  const colorIndex = course.name.length % colors.length;
  const colorClass = colors[colorIndex];

  return (
    <div 
      onClick={onClick}
      className="group bg-white rounded-[24px] border border-gray-100 p-6 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 cursor-pointer relative flex flex-col h-full"
    >
      {/* Botão de Favorito no topo direito */}
      <button 
        onClick={onToggleFavorite}
        className={`absolute top-6 right-6 p-1 rounded-full transition-all z-10 ${
          isFavorite 
            ? 'text-amber-400' 
            : 'text-gray-300 hover:text-amber-400'
        }`}
      >
        <Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
      </button>

      <div className="flex items-start gap-5">
        {/* Ícone da Pasta */}
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${colorClass}`}>
          <Folder className="w-7 h-7" />
        </div>
        
        <div className="flex-1 min-w-0 pr-6">
          {/* Nome da Disciplina */}
          <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
            {course.name}
          </h3>
          
          {/* Código da Disciplina */}
          <p className="text-sm font-medium text-gray-400 mb-3">
            {course.code || 'SEM CÓDIGO'}
          </p>

          {/* Tags de Período e Tipo */}
          <div className="flex flex-wrap gap-2 mb-4">
            {course.period && (
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-[11px] font-bold rounded-full">
                {course.period}º período
              </span>
            )}
            <span className={`px-3 py-1 text-[11px] font-bold rounded-full ${
              course.is_mandatory 
                ? 'bg-blue-50 text-blue-500' 
                : 'bg-gray-100 text-gray-500'
            }`}>
              {course.is_mandatory ? 'Obrigatória' : 'Optativa'}
            </span>
          </div>

          {/* Contagem de Arquivos */}
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
            {fileCount} {fileCount === 1 ? 'arquivo' : 'arquivos'}
          </div>
        </div>
      </div>
    </div>
  );
}