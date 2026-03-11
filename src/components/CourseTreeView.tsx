import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, Star, BookOpen } from 'lucide-react';
import type { Course } from '../lib/types';

interface CourseTreeViewProps {
  courses: Course[];
  favorites: string[];
  fileCounts: { [key: string]: number };
  onSelectCourse: (course: Course) => void;
  onToggleFavorite: (e: React.MouseEvent, courseId: string) => void;
}

export function CourseTreeView({ 
  courses, 
  favorites, 
  fileCounts, 
  onSelectCourse, 
  onToggleFavorite 
}: CourseTreeViewProps) {
  const [expandedPeriods, setExpandedPeriods] = useState<string[]>([]);

  // Agrupar cursos por período
  const groupedCourses = courses.reduce((acc, course) => {
    const period = course.period || 'Sem Período';
    if (!acc[period]) acc[period] = [];
    acc[period].push(course);
    return acc;
  }, {} as { [key: string]: Course[] });

  // Ordenar períodos
  const sortedPeriods = Object.keys(groupedCourses).sort((a, b) => {
    if (a === 'Sem Período') return 1;
    if (b === 'Sem Período') return -1;
    return a.localeCompare(b, undefined, { numeric: true });
  });

  const togglePeriod = (period: string) => {
    setExpandedPeriods(prev => 
      prev.includes(period) ? prev.filter(p => p !== period) : [...prev, period]
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {sortedPeriods.map((period) => (
        <div key={period} className="border-b border-gray-100 last:border-0">
          <button
            onClick={() => togglePeriod(period)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              {expandedPeriods.includes(period) ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded uppercase">
                  {period === 'Sem Período' ? period : `${period}º Período`}
                </span>
                <span className="text-xs text-gray-400 font-medium">
                  ({groupedCourses[period].length} disciplinas)
                </span>
              </div>
            </div>
          </button>

          {expandedPeriods.includes(period) && (
            <div className="bg-gray-50/50 divide-y divide-gray-100">
              {groupedCourses[period].map((course) => {
                const isFav = favorites.includes(course.id);
                const count = fileCounts[course.id] || 0;

                return (
                  <div
                    key={course.id}
                    onClick={() => onSelectCourse(course)}
                    className="flex items-center justify-between p-4 pl-12 hover:bg-white transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Folder className={`w-4 h-4 flex-shrink-0 ${isFav ? 'text-amber-400' : 'text-blue-400'}`} />
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                          {course.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-gray-400 font-medium uppercase">{course.code || 'S/ COD'}</span>
                          <span className="text-[10px] text-gray-300">•</span>
                          <span className="text-[10px] text-gray-400">{count} arquivos</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => onToggleFavorite(e, course.id)}
                      className={`p-2 rounded-full transition-colors ${
                        isFav ? 'text-amber-400' : 'text-gray-300 hover:text-amber-400 hover:bg-amber-50'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}