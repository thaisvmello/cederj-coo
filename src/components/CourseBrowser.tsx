import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Plus, BookOpen, Star } from 'lucide-react';
import type { Course } from '../lib/types';
import { CourseCard } from './CourseCard';
import { FolderView } from './FolderView';
import { useAuth } from '../contexts/AuthContext';
import { NewCourseModal } from './NewCourseModal';
import toast from 'react-hot-toast';

export function CourseBrowser() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [fileCounts, setFileCounts] = useState<{[key: string]: number}>({});
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    
    const { data: coursesData, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .order('name');

    if (coursesError) {
      console.error('Error loading courses:', coursesError);
    } else {
      setCourses(coursesData || []);
      
      const { data: filesData } = await supabase
        .from('files')
        .select('id, folder_id');
      
      const { data: foldersData } = await supabase
        .from('folders')
        .select('id, course_id');

      if (filesData && foldersData) {
        const counts: {[key: string]: number} = {};
        foldersData.forEach(folder => {
          const count = filesData.filter(f => f.folder_id === folder.id).length;
          counts[folder.course_id] = (counts[folder.course_id] || 0) + count;
        });
        setFileCounts(counts);
      }
    }

    if (user) {
      const { data: favData } = await supabase
        .from('course_favorites')
        .select('course_id')
        .eq('user_id', user.id);
      
      setFavorites(favData?.map(f => f.course_id) || []);
    }

    setLoading(false);
  };

  const toggleFavorite = async (e: React.MouseEvent, courseId: string) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Você precisa estar logado para favoritar');
      return;
    }

    const isFav = favorites.includes(courseId);
    if (isFav) {
      await supabase
        .from('course_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('course_id', courseId);
      setFavorites(prev => prev.filter(id => id !== courseId));
      toast.success('Removido dos favoritos');
    } else {
      await supabase
        .from('course_favorites')
        .insert({ user_id: user.id, course_id: courseId });
      setFavorites(prev => [...prev, courseId]);
      toast.success('Adicionado aos favoritos');
    }
  };

  const filteredCourses = courses.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.code && c.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const favoriteCourses = filteredCourses.filter(c => favorites.includes(c.id));
  const otherCourses = filteredCourses.filter(c => !favorites.includes(c.id));

  if (selectedCourse) {
    return <FolderView course={selectedCourse} onBack={() => setSelectedCourse(null)} />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Acervo de Provas e Materiais
            </h2>
          </div>
          <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
            CEDERJ — Ciências Contábeis
          </p>
          <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-2">
            <span className="flex items-center gap-1.5">
              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              {courses.length} disciplinas
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              {Object.values(fileCounts).reduce((a, b) => a + b, 0)} arquivos no acervo
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar disciplina ou código EAD..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition shadow-sm"
          />
        </div>
        <button 
          onClick={() => setShowNewModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-[#0f172a] text-white rounded-xl font-bold text-sm hover:bg-[#1e293b] transition shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Nova Disciplina
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
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
                    onToggleFavorite={(e) => toggleFavorite(e, course.id)}
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
                  onToggleFavorite={(e) => toggleFavorite(e, course.id)}
                />
              ))}
            </div>
          </section>
        </div>
      )}

      {showNewModal && (
        <NewCourseModal 
          onClose={() => setShowNewModal(false)} 
          onSuccess={loadData}
        />
      )}
    </div>
  );
}