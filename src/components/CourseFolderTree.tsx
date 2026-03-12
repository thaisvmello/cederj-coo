import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ChevronRight, ChevronDown, Folder, BookOpen, Loader } from 'lucide-react';
import type { Course, Folder as FolderType } from '../lib/types';

interface CourseFolderTreeProps {
  courses: Course[];
  selectedFolderId: string | null;
  onSelectFolder: (course: Course, folder: FolderType) => void;
}

export function CourseFolderTree({ courses, selectedFolderId, onSelectFolder }: CourseFolderTreeProps) {
  const [expandedCourses, setExpandedCourses] = useState<string[]>([]);
  const [foldersByCourse, setFoldersByCourse] = useState<Record<string, FolderType[]>>({});
  const [loadingCourses, setLoadingCourses] = useState<string[]>([]);

  const toggleCourse = async (course: Course) => {
    const isExpanded = expandedCourses.includes(course.id);
    
    if (isExpanded) {
      setExpandedCourses(prev => prev.filter(id => id !== course.id));
    } else {
      setExpandedCourses(prev => [...prev, course.id]);
      
      // Carregar pastas se ainda não foram carregadas
      if (!foldersByCourse[course.id]) {
        setLoadingCourses(prev => [...prev, course.id]);
        const { data } = await supabase
          .from('folders')
          .select('*')
          .eq('course_id', course.id)
          .order('name');
        
        if (data) {
          setFoldersByCourse(prev => ({ ...prev, [course.id]: data }));
        }
        setLoadingCourses(prev => prev.filter(id => id !== course.id));
      }
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-[600px] flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50/50">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-600" />
          Disciplinas
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        {courses.map((course) => (
          <div key={course.id} className="mb-1">
            <button
              onClick={() => toggleCourse(course)}
              className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors text-left group"
            >
              {expandedCourses.includes(course.id) ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
              <Folder className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-700 truncate group-hover:text-blue-600">
                {course.name}
              </span>
            </button>

            {expandedCourses.includes(course.id) && (
              <div className="ml-6 mt-1 space-y-1 border-l-2 border-gray-100 pl-2">
                {loadingCourses.includes(course.id) ? (
                  <div className="p-2 flex items-center gap-2 text-xs text-gray-400">
                    <Loader className="w-3 h-3 animate-spin" />
                    Carregando pastas...
                  </div>
                ) : (
                  foldersByCourse[course.id]?.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => onSelectFolder(course, folder)}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                        selectedFolderId === folder.id
                          ? 'bg-blue-50 text-blue-700 shadow-sm'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Folder className={`w-3.5 h-3.5 ${selectedFolderId === folder.id ? 'text-blue-600' : 'text-gray-300'}`} />
                      <span className="truncate">{folder.name}</span>
                    </button>
                  ))
                )}
                {!loadingCourses.includes(course.id) && (!foldersByCourse[course.id] || foldersByCourse[course.id].length === 0) && (
                  <div className="p-2 text-[10px] text-gray-400 italic">Nenhuma pasta</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}