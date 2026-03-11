import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Plus, BookOpen } from 'lucide-react';
import type { Course, CourseFavorite } from '../lib/types';
import { CourseCard } from './CourseCard';
import { FolderView } from './FolderView';
import { useAuth } from '../contexts/AuthContext';

export function CourseBrowser() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [fileCounts, setFileCounts] = useState<{[key: string]: number}>({});
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    
    // Load courses
    const { data: coursesData, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .order('name');

    if (coursesError) {
      console.error('Error loading courses:', coursesError);
    } else {
      setCourses(coursesData || []);
      
      // Load file counts per course
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

    // Load favorites
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
    if (!user) return;

    const isFav = favorites.includes(courseId);
    if (isFav) {
      await supabase
        .from('course_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('course_id', courseId);
      setFavorites(prev => prev.filter(id => id !== courseId));
    } else {
      await supabase
        .from('course_favorites')
        .insert({ user_id: user.id, course_id: courseId });
      setFavorites(prev => [...prev, courseId]);
    }
  };

  const filteredCourses = courses.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.code && c.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
        <button className="flex items-center justify-center gap-2 px-6 py-3 bg-[#0f172a] text-white rounded-xl font-bold text-sm hover:bg-[#1e293b] transition shadow-sm">
          <Plus className="w-5 h-5" />
          Nova Disciplina
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              fileCount={fileCounts[course.id] || 0}
              isFavorite={favorites.includes(course.id)}
              onClick={() => setSelectedCourse(course)}
              onToggleFavorite={(e) => toggleFavorite(e, course.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}