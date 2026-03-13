import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ChevronLeft, Folder, Plus, Upload, ChevronRight, LayoutTemplate } from 'lucide-react';
import type { Course, Folder as FolderType } from '../lib/types';
import { FileList } from './FileList';
import { FileUpload } from './FileUpload';
import { NewFolderModal } from './NewFolderModal';
import { FolderComments } from './FolderComments';
import toast from 'react-hot-toast';

interface FolderViewProps {
  course: Course;
  onBack: () => void;
}

export function FolderView({ course, onBack }: FolderViewProps) {
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [currentFolder, setCurrentFolder] = useState<FolderType | null>(null);
  const [path, setPath] = useState<FolderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    loadFolders();
  }, [course.id, currentFolder]);

  const loadFolders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('course_id', course.id)
      .eq('parent_folder_id', currentFolder?.id || null)
      .order('name');

    if (error) {
      console.error('Error loading folders:', error);
    } else {
      setFolders(data || []);
    }
    setLoading(false);
  };

  const handleFolderClick = (folder: FolderType) => {
    setPath(prev => [...prev, folder]);
    setCurrentFolder(folder);
  };

  const handleBackToPath = (index: number) => {
    if (index === -1) {
      setPath([]);
      setCurrentFolder(null);
    } else {
      const newPath = path.slice(0, index + 1);
      setPath(newPath);
      setCurrentFolder(newPath[newPath.length - 1]);
    }
  };

  const createDefaultSubfolders = async () => {
    if (!currentFolder && folders.length === 0) {
      toast.error('Crie uma pasta principal primeiro');
      return;
    }

    const targetFolderId = currentFolder?.id;
    if (!targetFolderId) {
      toast.error('Selecione uma pasta para criar as subpastas');
      return;
    }

    setIsInitializing(true);
    const defaultNames = ['ADs', 'AP1', 'AP2', 'AP3'];
    
    try {
      const newFolders = defaultNames.map(name => ({
        name,
        course_id: course.id,
        parent_folder_id: targetFolderId
      }));

      const { error } = await supabase.from('folders').insert(newFolders);
      if (error) throw error;

      toast.success('Estrutura padrão criada!');
      loadFolders();
    } catch (error) {
      console.error('Error creating subfolders:', error);
      toast.error('Erro ao criar subpastas');
    } finally {
      setIsInitializing(false);
    }
  };

  if (loading && folders.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-500 overflow-x-auto whitespace-nowrap pb-2 no-scrollbar">
        <button 
          onClick={onBack}
          className="hover:text-gray-900 transition flex items-center gap-1 shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
          Disciplinas
        </button>
        <ChevronRight className="w-3 h-3 shrink-0" />
        <button 
          onClick={() => handleBackToPath(-1)}
          className={`hover:text-gray-900 transition shrink-0 ${!currentFolder ? 'font-bold text-gray-900' : ''}`}
        >
          {course.name}
        </button>
        {path.map((folder, index) => (
          <div key={folder.id} className="flex items-center gap-2 shrink-0">
            <ChevronRight className="w-3 h-3" />
            <button 
              onClick={() => handleBackToPath(index)}
              className={`hover:text-gray-900 transition ${index === path.length - 1 ? 'font-bold text-gray-900' : ''}`}
            >
              {folder.name}
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white rounded-xl border border-gray-200">
            <Folder className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{currentFolder?.name || course.name}</h2>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">
              {currentFolder ? `Subpasta de ${course.name}` : course.code}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {currentFolder && (
            <button 
              onClick={createDefaultSubfolders}
              disabled={isInitializing}
              className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm font-semibold text-amber-700 hover:bg-amber-100 transition disabled:opacity-50"
              title="Criar ADs, AP1, AP2 e AP3 nesta pasta"
            >
              <LayoutTemplate className="w-4 h-4" />
              Gerar ADs/APs
            </button>
          )}
          <button 
            onClick={() => setShowNewFolder(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            <Plus className="w-4 h-4" />
            Nova Pasta
          </button>
          {currentFolder && (
            <button 
              onClick={() => setShowUpload(!showUpload)}
              className="flex items-center gap-2 px-4 py-2 bg-[#0f172a] text-white rounded-lg text-sm font-semibold hover:bg-[#1e293b] transition"
            >
              <Upload className="w-4 h-4" />
              Enviar Arquivo
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          {currentFolder ? 'Subpastas' : 'Pastas de Materiais'}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => handleFolderClick(folder)}
              className="flex flex-col items-center justify-center p-6 rounded-xl border bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all group"
            >
              <Folder className="w-8 h-8 mb-3 text-gray-400 group-hover:text-blue-500 transition-colors" />
              <span className="text-xs font-bold text-center line-clamp-2 text-gray-600 group-hover:text-gray-900">
                {folder.name}
              </span>
            </button>
          ))}
          {folders.length === 0 && !loading && (
            <div className="col-span-full py-8 text-center border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-sm text-gray-400">Nenhuma pasta aqui.</p>
            </div>
          )}
        </div>
      </div>

      {showUpload && currentFolder && (
        <FileUpload 
          folderId={currentFolder.id} 
          disciplineName={currentFolder.name}
          onUploadSuccess={() => {
            setShowUpload(false);
            loadFolders();
          }}
        />
      )}

      {currentFolder && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <FileList folderId={currentFolder.id} />
          </div>
          <div className="space-y-4">
            <FolderComments folderId={currentFolder.id} />
          </div>
        </div>
      )}

      {showNewFolder && (
        <NewFolderModal 
          courseId={course.id}
          parentFolderId={currentFolder?.id || null}
          onClose={() => setShowNewFolder(false)}
          onSuccess={loadFolders}
        />
      )}
    </div>
  );
}