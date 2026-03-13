import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ChevronLeft, Folder, Plus, Upload, ChevronRight } from 'lucide-react';
import type { Course, Folder as FolderType } from '../lib/types';
import { FileList } from './FileList';
import { FileUpload } from './FileUpload';
import { NewFolderModal } from './NewFolderModal';
import { FolderComments } from './FolderComments';

interface FolderViewProps {
  course: Course;
  onBack: () => void;
}

export function FolderView({ course, onBack }: FolderViewProps) {
  const [mainFolders, setMainFolders] = useState<FolderType[]>([]);
  const [subFolders, setSubFolders] = useState<FolderType[]>([]);
  const [selectedMainFolder, setSelectedMainFolder] = useState<FolderType | null>(null);
  const [activeFolder, setActiveFolder] = useState<FolderType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);

  useEffect(() => {
    loadMainFolders();
  }, [course.id]);

  const loadMainFolders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('course_id', course.id)
      .is('parent_folder_id', null)
      .order('name');

    if (!error && data) {
      setMainFolders(data);
      if (data.length > 0 && !selectedMainFolder) {
        handleSelectMainFolder(data[0]);
      }
    }
    setLoading(false);
  };

  const handleSelectMainFolder = async (folder: FolderType) => {
    setSelectedMainFolder(folder);
    setActiveFolder(folder);
    
    const { data } = await supabase
      .from('folders')
      .select('*')
      .eq('parent_folder_id', folder.id)
      .order('name');
    
    setSubFolders(data || []);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <button 
          onClick={onBack}
          className="hover:text-gray-900 transition flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Disciplinas
        </button>
        <ChevronRight className="w-3 h-3" />
        <span className="font-bold text-gray-900 truncate">{course.name}</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white rounded-xl border border-gray-200">
            <Folder className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{course.name}</h2>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">{course.code}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowNewFolder(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            <Plus className="w-4 h-4" />
            Nova Pasta
          </button>
          <button 
            onClick={() => setShowUpload(!showUpload)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0f172a] text-white rounded-lg text-sm font-semibold hover:bg-[#1e293b] transition"
          >
            <Upload className="w-4 h-4" />
            Enviar Arquivo
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pastas de Materiais</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {mainFolders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => handleSelectMainFolder(folder)}
              className={`flex flex-col items-center justify-center p-6 rounded-xl border transition-all ${
                selectedMainFolder?.id === folder.id
                  ? 'bg-white border-blue-500 shadow-sm ring-1 ring-blue-500'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <Folder className={`w-8 h-8 mb-3 ${
                selectedMainFolder?.id === folder.id ? 'text-blue-500' : 'text-gray-400'
              }`} />
              <span className={`text-xs font-bold text-center line-clamp-2 ${
                selectedMainFolder?.id === folder.id ? 'text-gray-900' : 'text-gray-600'
              }`}>
                {folder.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {selectedMainFolder && subFolders.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Subpastas de {selectedMainFolder.name}</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setActiveFolder(selectedMainFolder)}
              className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
                activeFolder?.id === selectedMainFolder.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }`}
            >
              Geral
            </button>
            {subFolders.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setActiveFolder(sub)}
                className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
                  activeFolder?.id === sub.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                }`}
              >
                {sub.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {showUpload && activeFolder && (
        <FileUpload 
          folderId={activeFolder.id} 
          disciplineName={activeFolder.name}
          onUploadSuccess={() => {
            setShowUpload(false);
            loadMainFolders();
          }}
        />
      )}

      {activeFolder && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <FileList folderId={activeFolder.id} />
          </div>
          <div className="space-y-4">
            <FolderComments folderId={activeFolder.id} />
          </div>
        </div>
      )}

      {showNewFolder && (
        <NewFolderModal 
          courseId={course.id}
          parentFolderId={null}
          onClose={() => setShowNewFolder(false)}
          onSuccess={loadMainFolders}
        />
      )}
    </div>
  );
}