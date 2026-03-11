import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ChevronRight, Folder, ChevronDown, Star, Plus } from 'lucide-react';
import type { Course, Folder as FolderType } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';
import { FileList } from './FileList';
import { FileUpload } from './FileUpload';

interface ExpandedFolders {
  [key: string]: boolean;
}

interface CourseBrowserProps {
  initialSelectedFolder?: FolderType | null;
  onFolderSelect?: (folder: FolderType) => void;
}

export function CourseBrowser({ initialSelectedFolder, onFolderSelect }: CourseBrowserProps) {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [expandedCourses, setExpandedCourses] = useState<ExpandedFolders>({});
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<FolderType | null>(initialSelectedFolder || null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [newFolderName, setNewFolderName] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [createFolderParentId, setCreateFolderParentId] = useState<string | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showCreateCourse, setShowCreateCourse] = useState(false);

  // Extract code and name from course name
  const parseCourseName = (fullName: string): { code: string; name: string } => {
    const match = fullName.match(/^(EAD\d{5}|EAD\d{2})\s*-\s*(.+)$/);
    if (match) {
      return { code: match[1], name: match[2] };
    }
    return { code: '', name: fullName };
  };

  useEffect(() => {
    loadCourses();
    if (initialSelectedFolder) {
      setSelectedFolder(initialSelectedFolder);
    }
  }, [initialSelectedFolder]);

  useEffect(() => {
    if (user) {
      loadFavorites();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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

  const loadFavorites = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('folder_favorites')
      .select('folder_id')
      .eq('user_id', user.id);

    if (data) {
      setFavorites(new Set(data.map((f) => f.folder_id)));
    }
  };

  const toggleFavorite = async (e: React.MouseEvent, folderId: string) => {
    e.stopPropagation();
    if (!user) return;

    const isFavorite = favorites.has(folderId);

    if (isFavorite) {
      await supabase
        .from('folder_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('folder_id', folderId);

      const newFavorites = new Set(favorites);
      newFavorites.delete(folderId);
      setFavorites(newFavorites);
    } else {
      await supabase.from('folder_favorites').insert({
        user_id: user.id,
        folder_id: folderId,
      });

      const newFavorites = new Set(favorites);
      newFavorites.add(folderId);
      setFavorites(newFavorites);
    }
  };

  const createFolder = async (parentId: string | null) => {
    if (!newFolderName.trim()) return;

    // Check if folder with same name already exists in parent
    const existingFolders = folders.filter(
      (f) => f.parent_folder_id === parentId && f.name.toLowerCase() === newFolderName.toLowerCase()
    );

    if (existingFolders.length > 0) {
      alert('Uma pasta com este nome já existe neste local. Por favor, escolha outro nome.');
      return;
    }

    const { data, error } = await supabase
      .from('folders')
      .insert({
        course_id: parentId ? folders.find((f) => f.id === parentId)?.course_id : courses[0]?.id,
        parent_folder_id: parentId,
        name: newFolderName,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating folder:', error);
    } else if (data) {
      setFolders([...folders, data]);
      setNewFolderName('');
      setShowCreateFolder(false);
      setCreateFolderParentId(null);
    }
  };

  const createCourse = async () => {
    if (!newCourseCode.trim() || !newCourseName.trim()) {
      alert('Código e nome da disciplina são obrigatórios');
      return;
    }

    const fullName = `${newCourseCode} - ${newCourseName}`;

    // Check if course already exists
    const existingCourse = courses.find((c) => c.name.toLowerCase() === fullName.toLowerCase());
    if (existingCourse) {
      alert('Esta disciplina já existe');
      return;
    }

    // Create course
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .insert({ name: fullName })
      .select()
      .single();

    if (courseError) {
      console.error('Error creating course:', courseError);
      alert('Erro ao criar disciplina');
      return;
    }

    if (!courseData) return;

    // Create default subfolders (AD1, AD2, AP1, AP2, AP3)
    const subfolderNames = ['AD1', 'AD2', 'AP1', 'AP2', 'AP3'];
    const folderInserts = subfolderNames.map((folderName) => ({
      course_id: courseData.id,
      parent_folder_id: null,
      name: folderName,
    }));

    const { error: foldersError } = await supabase.from('folders').insert(folderInserts);

    if (!foldersError) {
      setCourses([...courses, courseData]);
      setNewCourseCode('');
      setNewCourseName('');
      setShowCreateCourse(false);
      loadCourses(); // Reload to get the new folders
    }
  };

  const toggleCourse = (courseId: string) => {
    setExpandedCourses((prev) => ({
      ...prev,
      [courseId]: !prev[courseId],
    }));
  };

  const handleSelectFolder = (folder: FolderType) => {
    setSelectedFolder(folder);
    if (onFolderSelect) {
      onFolderSelect(folder);
    }
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
          const isFavorite = favorites.has(folder.id);

          return (
            <div key={folder.id}>
              <div className="flex items-center group">
                <button
                  onClick={() => handleSelectFolder(folder)}
                  className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg transition ${
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

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition pr-2">
                  <button
                    onClick={(e) => toggleFavorite(e, folder.id)}
                    className={`p-1 rounded transition ${
                      isFavorite
                        ? 'text-yellow-500 hover:text-yellow-600'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                    title={isFavorite ? 'Remover de favoritos' : 'Adicionar aos favoritos'}
                  >
                    <Star className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCreateFolderParentId(folder.id);
                      setShowCreateFolder(true);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded transition"
                    title="Criar subpasta"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {hasSubfolders && expandedCourses[folder.id] && (
                <div className="ml-4">
                  {renderFolderTree(folder.id, level + 1)}
                </div>
              )}
            </div>
          );
        })}

        {showCreateFolder && createFolderParentId === parentId && (
          <div className="flex gap-2 px-3 py-2 ml-4">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  createFolder(parentId);
                }
              }}
              placeholder="Nome da pasta..."
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              autoFocus
            />
            <button
              onClick={() => createFolder(parentId)}
              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition"
            >
              Criar
            </button>
            <button
              onClick={() => {
                setShowCreateFolder(false);
                setNewFolderName('');
                setCreateFolderParentId(null);
              }}
              className="px-2 py-1 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded text-sm transition"
            >
              Cancelar
            </button>
          </div>
        )}
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
      <div className="lg:col-span-1 bg-white rounded-lg shadow p-4 overflow-y-auto max-h-[calc(100vh-250px)]">
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
                  {getCourseFolders(course.id).map((folder) => {
                    const subfoldersCount = getSubfolders(folder.id).length;
                    const hasSubfolders = subfoldersCount > 0;
                    const isFavorite = favorites.has(folder.id);

                    return (
                      <div key={`course-${folder.id}`}>
                        <div className="flex items-center group ml-6">
                          <button
                            onClick={() => handleSelectFolder(folder)}
                            className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg transition ${
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
                            <span className="text-sm">{folder.name}</span>
                          </button>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition pr-2">
                            <button
                              onClick={(e) => toggleFavorite(e, folder.id)}
                              className={`p-1 rounded transition ${
                                isFavorite
                                  ? 'text-yellow-500 hover:text-yellow-600'
                                  : 'text-gray-400 hover:text-gray-600'
                              }`}
                              title={isFavorite ? 'Remover de favoritos' : 'Adicionar aos favoritos'}
                            >
                              <Star className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCreateFolderParentId(folder.id);
                                setShowCreateFolder(true);
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded transition"
                              title="Criar subpasta"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {expandedCourses[folder.id] && (
                          <div className="mt-1">
                            {renderFolderTree(folder.id, 1)}
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
      </div>

      <div className="lg:col-span-2 space-y-4 overflow-y-auto max-h-[calc(100vh-250px)]">
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
