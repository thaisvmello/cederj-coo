import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Folder, Star, Filter, ChevronFirst, ChevronLast } from 'lucide-react';
import type { Course } from '../lib/types';

interface CourseTreeViewProps {
  courses: Course[];
  favorites: string[];
  fileCounts: { [key: string]: number };
  onSelectCourse: (course: Course) => void;
  onToggleFavorite: (e: React.MouseEvent, courseId: string) => void;
}

type GroupingCriteria = 'period' | 'type' | 'none';

export function CourseTreeView({ 
  courses, 
  favorites, 
  fileCounts, 
  onSelectCourse, 
  onToggleFavorite 
}: CourseTreeViewProps) {
  const [grouping, setGrouping] = useState<GroupingCriteria>('period');
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  // Lógica de agrupamento
  const groupedData = useMemo(() => {
    if (grouping === 'none') {
      return { 'Todas as Disciplinas': courses };
    }

    return courses.reduce((acc, course) => {
      let key = '';
      if (grouping === 'period') {
        key = course.period && course.period !== '-' ? `${course.period}º Período` : 'Sem Período';
      } else if (grouping === 'type') {
        key = course.is_mandatory ? 'Obrigatórias' : 'Optativas / Outras';
      }
      
      if (!acc[key]) acc[key] = [];
      acc[key].push(course);
      return acc;
    }, {} as { [key: string]: Course[] });
  }, [courses, grouping]);

  const sortedGroupKeys = useMemo(() => {
    return Object.keys(groupedData).sort((a, b) => {
      if (grouping === 'period') {
        if (a === 'Sem Período') return 1;
        if (b === 'Sem Período') return -1;
        return a.localeCompare(b, undefined, { numeric: true });
      }
      return a.localeCompare(b);
    });
  }, [groupedData, grouping]);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => 
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
  };

  const expandAll = () => setExpandedGroups(sortedGroupKeys);
  const collapseAll = () => setExpandedGroups([]);

  return (
    <div className="space-y-4">
      {/* Controles da Árvore */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" />
            Agrupar por:
          </span>
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => { setGrouping('period'); collapseAll(); }}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${grouping === 'period' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Período
            </button>
            <button
              onClick={() => { setGrouping('type'); collapseAll(); }}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${grouping === 'type' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Tipo
            </button>
            <button
              onClick={() => { setGrouping('none'); expandAll(); }}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${grouping === 'none' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Sem Agrupamento
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
          >
            <ChevronLast className="w-3.5 h-3.5 rotate-90" />
            Expandir Tudo
          </button>
          <div className="w-px h-4 bg-gray-200"></div>
          <button
            onClick={collapseAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
          >
            <ChevronFirst className="w-3.5 h-3.5 rotate-90" />
            Recolher Tudo
          </button>
        </div>
      </div>

      {/* Lista da Árvore */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {sortedGroupKeys.map((group) => (
          <div key={group} className="border-b border-gray-100 last:border-0">
            {grouping !== 'none' && (
              <button
                onClick={() => toggleGroup(group)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  {expandedGroups.includes(group) ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                      group.includes('Período') ? 'bg-blue-50 text-blue-700' : 
                      group.includes('Obrigatórias') ? 'bg-emerald-50 text-emerald-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {group}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                      ({groupedData[group].length} disciplinas)
                    </span>
                  </div>
                </div>
              </button>
            )}

            {(expandedGroups.includes(group) || grouping === 'none') && (
              <div className={`${grouping !== 'none' ? 'bg-gray-50/50' : ''} divide-y divide-gray-100`}>
                {groupedData[group].map((course) => {
                  const isFav = favorites.includes(course.id);
                  const count = fileCounts[course.id] || 0;

                  return (
                    <div
                      key={course.id}
                      onClick={() => onSelectCourse(course)}
                      className={`flex items-center justify-between p-4 ${grouping !== 'none' ? 'pl-12' : 'pl-6'} hover:bg-white transition-all cursor-pointer group`}
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
                            {grouping !== 'period' && course.period && course.period !== '-' && (
                              <>
                                <span className="text-[10px] text-gray-300">•</span>
                                <span className="text-[10px] text-blue-500 font-bold">{course.period}º Per.</span>
                              </>
                            )}
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
    </div>
  );
}