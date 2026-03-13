import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CourseTreeView } from './CourseTreeView';
import { FolderView } from './FolderView';
import type { Course } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';

export function CourseBrowser() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [fileCounts, setFileCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: coursesData } = await supabase.from('courses').select('*').order('name');
      setCourses(coursesData || []);

      if (user) {
        const { data: favs } = await supabase.from('course_favorites').select('course_id').eq('user_id', user.id);
        setFavorites(favs?.map(f => f.course_id) || []);
      }

      const { data: files } = await supabase.from('files').select('folder_id, folders(course_id)');
      const counts: Record<string, number> = {};
      files?.forEach((f: any) => {
        const courseId = f.folders?.course_id;
        if (courseId) counts[courseId] = (counts[courseId] || 0) + 1;
      });
      setFileCounts(counts);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, courseId: string) => {
    e.stopPropagation();
    if (!user) return;
    if (favorites.includes(courseId)) {
      await supabase.from('course_favorites').delete().eq('user_id', user.id).eq('course_id', courseId);
      setFavorites(prev => prev.filter(id => id !== courseId));
    } else {
      await supabase.from('course_favorites').insert({ user_id: user.id, course_id: courseId });
      setFavorites(prev => [...prev, courseId]);
    }
  };

  if (loading) return <div className="flex justify-center p-12 text-gray-500">Carregando disciplinas...</div>;

  if (selectedCourse) {
    return <FolderView course={selectedCourse} onBack={() => setSelectedCourse(null)} />;
  }

  return (
    <CourseTreeView 
      courses={courses}
      favorites={favorites}
      fileCounts={fileCounts}
      onSelectFolder={(course) => setSelectedCourse(course)}
      onToggleFavorite={handleToggleFavorite}
    />
  );
}