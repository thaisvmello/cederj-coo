import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Plus, BookOpen, Star, LayoutGrid, List, Info, Upload, Folder } from 'lucide-react';
import type { Course, Folder as FolderType } from '../lib/types';
import { CourseCard } from './CourseCard';
import { CourseFolderTree } from './CourseFolderTree';
import { CourseTreeView } from './CourseTreeView';
import { FolderView } from './FolderView';
import { FileList } from './FileList';
import { FileUpload } from './FileUpload';
import { FolderComments } from './FolderComments';
import { useAuth } from '../contexts/AuthContext';
import { NewCourseModal } from './NewCourseModal';
import toast from 'react-hot-toast';

export function CourseBrowser() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [fileCounts, setFileCounts] = useState<{[key: string]: number}>({});
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<FolderType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'tree'>('grid');

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const { data: coursesData } = await supabase.from('courses').select('*').order('name');
    if (coursesData) setCourses(coursesData);

    if (user) {
      const { data: favData } = await supabase.from('course_favorites').select('course_id').eq('user_id', user.id);
      setFavorites(favData?.map(f => f.course_id) || []);
    }

    // Carregar contagem de arquivos
    const { data: filesData } = await supabase.from('files').select('folder_id');
    const { data: foldersData } = await supabase.from('folders').select('id, course_id');
    if (filesData && foldersData) {
      const counts: {[key: string]: number} = {};
      foldersData.forEach(folder => {
        const count = filesData.filter(f => f.folder_id === folder.id).length;
        counts[folder.course_id] = (counts[folder.course_id] || 0) + count;
      });
      setFileCounts(counts);
    }
    setLoading(false);
  };

  const filteredCourses = courses.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.code && c.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const favoriteCourses = filteredCourses.filter(c => favorites.includes(c.id));
  const otherCourses = filteredCourses.filter(c => !favorites.includes(c.id));

  const handleToggleFavorite = async (e: React.MouseEvent, courseId: string) => {
    e.stopPropagation();
    if (!user) return;

    const isFav = favorites.includes(courseId);
    if (isFav) {
      await supabase.from('course_favorites').delete().eq('user_id', user.id).eq('course_id', courseId);
    } else {
      await supabase.from('course_favorites').insert({ user_id: user.id, course_id: courseId });
    }
    loadData();
  };

  // Se estiver no modo Grid e uma disciplina for selecionada, mostra a FolderView antiga
  if (viewMode === 'grid' && selectedCourse) {
    return <FolderView course={selectedCourse} onBack={() => setSelectedCourse(null)} />;
  }

  return (
    <div className="space-y-8">
      {/* Header e Busca */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Acervo de Materiais</h2>
          </div>
          <p className="text-sm text-gray-500 font-medium">CEDERJ — Ciências Contábeis</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar disciplina..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition shadow-sm"
          />
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1 border border-gray-200 rounded-xl shadow-sm">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('tree')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'tree' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>

        <button onClick={() => setShowNewModal(true)} className="flex items-center justify-center gap-2 px-6 py-3 bg-[#0f172a] text-white rounded-xl font-bold text-sm hover:bg-[#1e293b] transition shadow-sm">
          <Plus className="w-5 h-5" />
          Nova Disciplina
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : viewMode === 'grid' ? (
        /* Visualização em Cards */
        <div className="space-y-10">
          {favoriteCourses.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                <Star className="w-4 h-4 text-amber-400 fill-current" />
                Disciplinas em Curso
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoriteCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    fileCount={fileCounts[course.id] || 0}
                    isFavorite={true}
                    onClick={() => setSelectedCourse(course)}
                    onToggleFavorite={(e) => handleToggleFavorite(e, course.id)}
                  />
                ))}
              </div>
            </section>
          )}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <BookOpen className="w-4 h-4 text-gray-400" />
              Todas as Disciplinas
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  fileCount={fileCounts[course.id] || 0}
                  isFavorite={false}
                  onClick={() => setSelectedCourse(course)}
                  onToggleFavorite={(e) => handleToggleFavorite(e, course.id)}
                />
              ))}
            </div>
          </section>
        </div>
      ) : (
        /* Visualização em Árvore Agrupada por Período */
        <div className="space-y-6">
          <CourseTreeView 
            courses={filteredCourses}
            favorites={favorites}
            fileCounts={fileCounts}
            onSelectCourse={(course) => {
              setSelectedCourse(course);
              setViewMode('grid'); // Muda para grid para abrir a FolderView
            }}
            onToggleFavorite={handleToggleFavorite}
          />
        </div>
      )}

      {showNewModal && <NewCourseModal onClose={() => setShowNewModal(false)} onSuccess={loadData} />}
    </div>
  );
}