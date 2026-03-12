import { useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ChevronRight, ChevronDown, Folder, Star, Filter, Loader, X, FileText, MessageSquare } from 'lucide-react';
import type { Course, Folder as FolderType } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';
import { FileList } from './FileList';
import { FolderComments } from './FolderComments';

type GroupingCriteria = 'period' | 'type' | 'none';

export function CourseTreeView({ 
  courses, 
  favorites, 
  fileCounts, 
  onSelectFolder, 
  onToggleFavorite 
}: {
  courses: Course[];
  favorites: string[];
  fileCounts: { [key: string]: number };
  onSelectFolder: (course: Course | null, folder: FolderType) => void;
  onToggleFavorite: (e: React.MouseEvent, courseId: string) => void;
}) {
  const { user } = useAuth();
  const [grouping, setGrouping] = useState<GroupingCriteria>('period');
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [expandedCourses, setExpandedCourses] = useState<string[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [foldersByCourse, setFoldersByCourse] = useState<Record<string, FolderType[]>>({});
  const [loadingFolders, setLoadingFolders] = useState<string[]>([]);
  const [favoriteFolders, setFavoriteFolders] = useState<FolderType[]>([]);

  // Fetch favorite folders
  useEffect(() => {
    if (!user) return;
    
    const fetchFavoriteFolders = async () => {
      const { data: favoriteFolderIds } = await supabase
        .from('folder_favorites')
        .select('folder_id')
        .eq('user_id', user.id);
      
      const favoriteFoldersData = await supabase        .from('folders')
        .select('*')
        .in('id', favoriteFolderIds || []);
      
      setFavoriteFolders(favoriteFoldersData || []);
    };
    
    fetchFavoriteFolders();
  }, [user]);

  const groupedData = useMemo(() => {
    if (grouping === 'none') return { 'Todas as Disciplinas': courses };
    return courses.reduce((acc, course) => {
      let key = '';
      if (grouping === 'period') {
        key = (course.period && course.period !== '-' ? `${course.period}º Período` : 'Sem Período');
      } else {
        key = course.subject_type || (course.is_mandatory ? 'Obrigatórias' : 'Optativas / Outras');
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
    setExpandedGroups(prev => prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]);
  };

  const toggleCourse = async (courseId: string) => {
    const isExpanded = expandedCourses.includes(courseId);
    if (isExpanded) {
      setExpandedCourses(prev => prev.filter(id => id !== courseId));
    } else {
      setExpandedCourses(prev => [...prev, courseId]);
      if (!foldersByCourse[courseId]) {
        setLoadingFolders(prev => [...prev, courseId]);
        const { data } = await supabase.from('folders').select('*').eq('course_id', courseId).order('name');
        if (data) setFoldersByCourse(prev => ({ ...prev, [courseId]: data }));
        setLoadingFolders(prev => prev.filter(id => id !== courseId));
      }
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => prev.includes(folderId) ? prev.filter(id => id !== folderId) : [...prev, folderId]);
  };

  const renderFolders = (course: Course, parentId: string | null = null, level: number = 0) => {
    const courseFolders = foldersByCourse[course.id] || [];
    const levelFolders = courseFolders.filter(f => f.parent_folder_id === parentId);

    if (levelFolders.length === 0 && level === 0 && !loadingFolders.includes(course.id)) {
      return <div className="pl-10 py-2 text-[10px] text-gray-400 italic">Nenhuma pasta encontrada</div>;
    }

    return levelFolders.map(folder => {
      const hasSubfolders = courseFolders.some(f => f.parent_folder_id === folder.id);
      const isExpanded = expandedFolders.includes(folder.id);

      return (
        <div key={folder.id}>
          <div             className={`flex items-center justify-between py-2 pr-4 hover:bg-blue-50/50 cursor-pointer group transition-colors ${level === 0 ? 'pl-10' : `pl-${10 + (level * 4)}`}`}
            onClick={(e) => {
              e.stopPropagation();
              if (hasSubfolders) toggleFolder(folder.id);
              onSelectFolder(course, folder);
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              {hasSubfolders ? (
                isExpanded ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />
              ) : (
                <div className="w-3" />
              )}
              <Folder className={`w-3.5 h-3.5 flex-shrink-0 ${isExpanded ? 'text-blue-500' : 'text-gray-400'}`} />
              <span className="text-xs font-medium text-gray-600 truncate group-hover:text-blue-600">{folder.name}</span>
            </div>
          </div>
          {isExpanded && renderFolders(course, folder.id, level + 1)}
        </div>
      );
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" /> Agrupar por:
          </span>
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            {(['period', 'type', 'none'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => { setGrouping(mode); setExpandedGroups([]); }}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${grouping === mode ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {mode === 'period' ? 'Período' : mode === 'type' ? 'Tipo' : 'Sem Agrupamento'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {sortedGroupKeys.map((group) => (
          <div key={group} className="border-b border-gray-100 last:border-0">
            {grouping !== 'none' && (
              <button
                onClick={() => toggleGroup(group)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  {expandedGroups.includes(group) ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                      group.includes('Período') ? 'bg-blue-50 text-blue-700' : 
                      group.toLowerCase().includes('obrigatória') ? 'bg-emerald-50 text-emerald-700' : 
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {group}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">({groupedData[group].length})</span>
                  </div>
                </div>
              </button>
            )}

            {(expandedGroups.includes(group) || grouping === 'none') && (
              <div className="divide-y divide-gray-50">
                {groupedData[group].map((course) => {
                  const isFav = favorites.includes(course.id);
                  const isExpanded = expandedCourses.includes(course.id);
                  return (
                    <div key={course.id} className="bg-white">
                      <div 
                        className={`flex items-center justify-between p-4 pl-6 hover:bg-gray-50 cursor-pointer group transition-all`}
                        onClick={() => toggleCourse(course.id)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                          <Folder className={`w-4 h-4 flex-shrink-0 ${isFav ? 'text-amber-400' : 'text-blue-400'}`} />
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600">{course.name}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-gray-400 font-medium uppercase">{course.code || 'S/ COD'}</span>
                              <span className="text-[10px] text-gray-300">•</span>
                              <span className="text-[10px] text-gray-400">{fileCounts[course.id] || 0} arquivos</span>
                            </div>
                          </div>
                        </div>
                        <button onClick={(e) => onToggleFavorite(e, course.id)} className={`p-2 rounded-full ${isFav ? 'text-amber-400' : 'text-gray-300 hover:text-amber-400'}`}>
                          <Star className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                      {isExpanded && (
                        <div className="bg-gray-50/30 pb-2">
                          {loadingFolders.includes(course.id) ? (
                            <div className="pl-10 py-3 flex items-center gap-2 text-xs text-gray-400">
                              <Loader className="w-3 h-3 animate-spin" /> Carregando pastas...
                            </div>
                          ) : renderFolders(course)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Favorites Group */}
      {favoriteFolders.length > 0 && (
        <div className="border-l border-blue-500 pl-4 pt-4 pb-2">
          <h3 className="text-sm font-bold text-blue-600">Favoritos</h3>
          {favoriteFolders.map((folder: FolderType) => (
            <div key={folder.id} className="p-2 border border-gray-200 rounded-lg cursor-pointer" onClick={() => onSelectFolder(null, folder)}>
              <Folder className="w-4 h-4 text-blue-500" />
              <span>{folder.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}