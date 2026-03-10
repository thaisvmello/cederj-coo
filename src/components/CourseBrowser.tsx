import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ChevronRight, Folder, ChevronDown } from 'lucide-react';
import type { Course, Folder as FolderType } from '../lib/types';
import { FileList } from './FileList';
import { FileUpload } from './FileUpload';

interface ExpandedFolders {
  [key: string]: boolean;
}

export function CourseBrowser() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [expandedCourses, setExpandedCourses] = useState<ExpandedFolders>({});
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<FolderType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error loading courses:', error);
    } else {
      setCourses(data || []);
      const { data: foldersData } = await supabase
        .from('folders')
        .select('*')
        .order('name');
      setFolders(foldersData || []);
    }
    setLoading(false);
  };

  const toggleCourse = (courseId: string) => {
    setExpandedCourses((prev) => ({
      ...prev,
      [courseId]: !prev[courseId],
    }));
  };

  const getCourseFolders = (courseId: string) => {
    return folders.filter((f) => f.course_id === courseId && f.parent_folder_id === null);
  };

  const getSubfolders = (parentId: string) => {
    return folders.filter((f) => f.parent_folder_id === parentId);
  };

  const renderFolderTree = (parentId: string | null, level: number = 0) => {
    const subfolders = folders.filter((f) => f.parent_folder_id === parentId);

    return (
      <div className={`space-y-1 ${level > 0 ? 'ml-4' : ''}`}>
        {subfolders.map((folder) => {
          const subfoldersCount = getSubfolders(folder.id).length;
          const hasSubfolders = subfoldersCount > 0;

          return (
            <div key={folder.id}>
              <button
                onClick={() => setSelectedFolder(folder)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                  selectedFolder?.id === folder.id
                    ? 'bg-blue-100 text-blue-900'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                {hasSubfolders && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCourse(folder.id);
                    }}
                  >
                    {expandedCourses[folder.id] ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                )}
                {!hasSubfolders && <div className="w-4" />}
                <Folder className="w-4 h-4" />
                <span className="text-sm font-medium">{folder.name}</span>
              </button>

              {hasSubfolders && expandedCourses[folder.id] && (
                <div className="ml-4">
                  {renderFolderTree(folder.id, level + 1)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-gray-500">Carregando cursos...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      <div className="lg:col-span-1 bg-white rounded-lg shadow p-4 overflow-y-auto max-h-[calc(100vh-200px)]">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Disciplinas</h2>
        <div className="space-y-2">
          {courses.map((course) => (
            <div key={course.id}>
              <button
                onClick={() => toggleCourse(course.id)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 transition"
              >
                {expandedCourses[course.id] ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                <Folder className="w-4 h-4" />
                <span className="text-sm font-semibold">{course.name}</span>
              </button>

              {expandedCourses[course.id] && (
                <div className="mt-1">
                  {renderFolderTree(
                    getCourseFolders(course.id)[0]?.id || null
                  )}
                  {getCourseFolders(course.id).map((folder) => (
                    <div key={`course-${folder.id}`}>
                      <button
                        onClick={() => setSelectedFolder(folder)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition ml-6 ${
                          selectedFolder?.id === folder.id
                            ? 'bg-blue-100 text-blue-900'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <Folder className="w-4 h-4" />
                        <span className="text-sm">{folder.name}</span>
                      </button>

                      {expandedCourses[folder.id] && (
                        <div className="mt-1">
                          {renderFolderTree(folder.id, 1)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
        {selectedFolder ? (
          <>
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {selectedFolder.name}
              </h2>
              <p className="text-sm text-gray-600">
                Pasta de {courses.find((c) => c.id === selectedFolder.course_id)?.name}
              </p>
            </div>

            <FileUpload
              folderId={selectedFolder.id}
              disciplineName={selectedFolder.name}
              onUploadSuccess={loadCourses}
            />
            <FileList folderId={selectedFolder.id} />
          </>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">Selecione uma pasta para começar</p>
          </div>
        )}
      </div>
    </div>
  );
}
