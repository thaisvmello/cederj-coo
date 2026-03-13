import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ChevronLeft, Folder, Upload, ChevronRight, FolderPlus } from 'lucide-react';
import type { Course, Folder as FolderType } from '../lib/types';
import { FileList } from './FileList';
import { FileUploadWithValidation } from './FileUploadWithValidation';
import { FolderRequestModal } from './FolderRequestModal';
import { FolderComments } from './FolderComments';
import { FolderWarningBanner } from './FolderWarningBanner';

interface FolderViewProps {
  course: Course;
  onBack: () => void;
}

export function FolderView({ course, onBack }: FolderViewProps) {
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<FolderType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

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
      if (folderList.length > 0 && !selectedFolder) {
        setSelectedFolder(folderList[0]);
      }
    }
    setLoading(false);
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
            onClick={() => setShowRequestModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm font-semibold text-amber-700 hover:bg-amber-100 transition"
          >
            <FolderPlus className="w-4 h-4" />
            Solicitar Pasta
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

      {/* Aviso fixo sobre duplicidade */}
      <FolderWarningBanner />

      <div className="space-y-4">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pastas de Materiais</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => setSelectedFolder(folder)}
              className={`flex flex-col items-center justify-center p-6 rounded-xl border transition-all ${
                selectedFolder?.id === folder.id
                  ? 'bg-white border-blue-500 shadow-sm ring-1 ring-blue-500'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <Folder className={`w-8 h-8 mb-3 ${
                selectedFolder?.id === folder.id ? 'text-blue-500' : 'text-gray-400'
              }`} />
              <span className={`text-xs font-bold text-center line-clamp-2 ${
                selectedFolder?.id === folder.id ? 'text-gray-900' : 'text-gray-600'
              }`}>
                {folder.name}
              </span>
            </button>
          ))}
          {folders.length === 0 && (
            <div className="col-span-full py-8 text-center border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-sm text-gray-400">Nenhuma pasta criada ainda.</p>
              <button
                onClick={() => setShowRequestModal(true)}
                className="mt-2 text-xs text-amber-600 hover:text-amber-700 font-medium"
              >
                Solicitar criação de pasta
              </button>
            </div>
          )}
        </div>
      </div>

      {showUpload && selectedFolder && (
        <FileUploadWithValidation 
          folderId={selectedFolder.id} 
          disciplineName={selectedFolder.name}
          onUploadSuccess={() => {
            setShowUpload(false);
            loadFolders();
          }}
        />
      )}

      {selectedFolder && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <FileList folderId={selectedFolder.id} />
          </div>
          <div className="space-y-4">
            <FolderComments folderId={selectedFolder.id} />
          </div>
        </div>
      )}

      {showRequestModal && (
        <FolderRequestModal 
          courseId={course.id}
          courseName={course.name}
          onClose={() => setShowRequestModal(false)}
          onSuccess={loadFolders}
        />
      )}
    </div>
  );
}