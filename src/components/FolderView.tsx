import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ChevronLeft, Folder, Plus, Upload, MessageSquare, ChevronDown } from 'lucide-react';
import type { Course, Folder as FolderType } from '../lib/types';
import { FileList } from './FileList';
import { FileUpload } from './FileUpload';

interface FolderViewProps {
  course: Course;
  onBack: () => void;
}

export function FolderView({ course, onBack }: FolderViewProps) {
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<FolderType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    loadFolders();
  }, [course.id]);

  const loadFolders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('course_id', course.id)
      .order('name');

    if (error) {
      console.error('Error loading folders:', error);
    } else {
      const folderList = data || [];
      setFolders(folderList);
      // Select first folder by default if none selected
      if (folderList.length > 0 && !selectedFolder) {
        setSelectedFolder(folderList[0]);
      }
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Carregando pastas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition"
      >
        <ChevronLeft className="w-4 h-4" />
        Todas as Disciplinas
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white rounded-xl border border-gray-200">
            <Folder className="w-6 h-6 text-gray-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{course.name}</h2>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">{course.code}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
            <Plus className="w-4 h-4" />
            Nova Subpasta
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
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Subpastas</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => setSelectedFolder(folder)}
              className={`flex flex-col items-center justify-center p-6 rounded-xl border transition-all ${
                selectedFolder?.id === folder.id
                  ? 'bg-white border-blue-500 shadow-sm'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <Folder className={`w-8 h-8 mb-3 ${
                selectedFolder?.id === folder.id ? 'text-blue-500' : 'text-gray-400'
              }`} />
              <span className={`text-xs font-bold ${
                selectedFolder?.id === folder.id ? 'text-gray-900' : 'text-gray-600'
              }`}>
                {folder.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {showUpload && selectedFolder && (
        <FileUpload 
          folderId={selectedFolder.id} 
          disciplineName={selectedFolder.name}
          onUploadSuccess={() => {
            setShowUpload(false);
            loadFolders();
          }}
        />
      )}

      {selectedFolder && (
        <div className="space-y-4">
          <FileList folderId={selectedFolder.id} />
          
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <MessageSquare className="w-4 h-4" />
                Comentários da pasta
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}