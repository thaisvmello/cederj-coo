import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ChevronLeft, Folder, ChevronRight, FolderPlus, Pencil, Archive, Loader, Video, Link as LinkIcon } from 'lucide-react';
import type { Course, Folder as FolderType } from '../lib/types';
import { FileList } from './FileList';
import { FileUploadWithValidation } from './FileUploadWithValidation';
import { FolderRequestModal } from './FolderRequestModal';
import { FolderComments } from './FolderComments';
import { VideoGallery } from './VideoGallery';
import { ExternalLinksList } from './ExternalLinksList';
import { useAdmin } from '../hooks/useAdmin';
import { EditCourseModal } from './EditCourseModal';
import { EditFolderModal } from './EditFolderModal';
import JSZip from 'jszip';
import toast from 'react-hot-toast';

interface FolderViewProps {
  course: Course;
  onBack: () => void;
}

export function FolderView({ course: initialCourse, onBack }: FolderViewProps) {
  const { isAdmin } = useAdmin();
  const [course, setCourse] = useState<Course>(initialCourse);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<FolderType | null>(null);
  const [showVideos, setShowVideos] = useState(false);
  const [loading, setLoading] = useState(true);
  const [zipping, setZipping] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showEditCourse, setShowEditCourse] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);

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
      if (folderList.length > 0 && !selectedFolder && !showVideos) {
        setSelectedFolder(folderList[0]);
      }
    }
    setLoading(false);
  };

  const handleSelectFolder = (folder: FolderType) => {
    setShowVideos(false);
    setSelectedFolder(folder);
  };

  const handleSelectVideos = () => {
    setSelectedFolder(null);
    setShowVideos(true);
  };

  const handleDownloadFullCourse = async () => {
    if (folders.length === 0) {
      toast.error('Esta disciplina não possui pastas com arquivos.');
      return;
    }

    setZipping(true);
    const toastId = toast.loading('Iniciando download completo da disciplina...');

    try {
      const folderIds = folders.map(f => f.id);
      const { data: allFiles, error: filesError } = await supabase
        .from('files')
        .select('*')
        .in('folder_id', folderIds);

      if (filesError) throw filesError;
      if (!allFiles || allFiles.length === 0) {
        toast.error('Nenhum arquivo encontrado nesta disciplina.', { id: toastId });
        setZipping(false);
        return;
      }

      const zip = new JSZip();
      let successCount = 0;
      let errorCount = 0;

      toast.loading(`Baixando ${allFiles.length} arquivos...`, { id: toastId });

      for (const file of allFiles) {
        try {
          const folder = folders.find(f => f.id === file.folder_id);
          const folderName = folder ? folder.name : 'Outros';
          
          const response = await fetch(file.file_path);
          if (!response.ok) throw new Error(`Falha ao baixar ${file.name}`);
          
          const blob = await response.blob();
          zip.folder(folderName)?.file(file.name, blob);
          successCount++;
        } catch (err) {
          console.error(`Erro ao processar arquivo ${file.name}:`, err);
          errorCount++;
        }
      }

      if (successCount === 0) {
        toast.error('Não foi possível baixar nenhum arquivo.', { id: toastId });
        setZipping(false);
        return;
      }

      toast.loading('Gerando arquivo ZIP final...', { id: toastId });
      
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ACERVO_${course.name.replace(/\s+/g, '_').toUpperCase()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (errorCount > 0) {
        toast.success(`${successCount} arquivos baixados, ${errorCount} falharam.`, { id: toastId });
      } else {
        toast.success('Disciplina completa baixada com sucesso!', { id: toastId });
      }
    } catch (error) {
      console.error('Erro no download completo:', error);
      toast.error('Erro ao gerar download completo.', { id: toastId });
    } finally {
      setZipping(false);
    }
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
          <div className="group relative">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-900">{course.name}</h2>
              {isAdmin && (
                <button 
                  onClick={() => setShowEditCourse(true)}
                  className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                  title="Editar dados da disciplina"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">{course.code}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleDownloadFullCourse}
            disabled={zipping || folders.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
          >
            {zipping ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Compactando...
              </>
            ) : (
              <>
                <Archive className="w-4 h-4" />
                Baixar Pasta Completa
              </>
            )}
          </button>
          <button 
            onClick={() => setShowRequestModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm font-semibold text-amber-700 hover:bg-amber-100 transition"
          >
            <FolderPlus className="w-4 h-4" />
            Solicitar Pasta
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pastas de Materiais</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {folders.map((folder) => (
            <div key={folder.id} className="relative group">
              <button
                onClick={() => handleSelectFolder(folder)}
                className={`w-full flex flex-col items-center justify-center p-6 rounded-xl border transition-all ${
                  selectedFolder?.id === folder.id
                    ? 'bg-white border-blue-500 shadow-sm ring-1 ring-blue-500'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}  
              >
                <Folder className={`w-8 h-8 mb-3 ${selectedFolder?.id === folder.id ? 'text-blue-500' : 'text-gray-400'}`} />
                <span className={`text-xs font-bold text-center line-clamp-2 ${selectedFolder?.id === folder.id ? 'text-gray-900' : 'text-gray-600'}`}>
                  {folder.name}
                </span>
              </button>
              
              {isAdmin && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingFolder(folder);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm border border-gray-100 rounded-lg text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition shadow-sm"
                  title="Renomear pasta"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          
          {/* Aba Videoaulas */}
          <button
            onClick={handleSelectVideos}
            className={`flex flex-col items-center justify-center p-6 rounded-xl border transition-all ${
              showVideos
                ? 'bg-white border-blue-500 shadow-sm ring-1 ring-blue-500'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <Video className={`w-8 h-8 mb-3 ${showVideos ? 'text-blue-500' : 'text-gray-400'}`} />
            <span className={`text-xs font-bold text-center ${showVideos ? 'text-gray-900' : 'text-gray-600'}`}>
              VIDEOAULAS
            </span>
          </button>

          {folders.length === 0 && !showVideos && (
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
          folderName={selectedFolder.name}
          disciplineName={course.name}
          onUploadSuccess={() => {
            setShowUpload(false);
            loadFolders();
          }}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-8">
          {showVideos ? (
            <VideoGallery courseId={course.id} />
          ) : selectedFolder ? (
            <>
              <FileList 
                folderId={selectedFolder.id} 
                courseName={course.name}
                folderName={selectedFolder.name}
                onToggleUpload={() => setShowUpload(!showUpload)}
                isUploadOpen={showUpload}
              />
              <div className="pt-4">
                <ExternalLinksList courseId={course.id} folderId={selectedFolder.id} />
              </div>
            </>
          ) : null}
        </div>
        <div className="space-y-4">
          <FolderComments courseId={course.id} />
        </div>
      </div>

      {showRequestModal && (
        <FolderRequestModal 
          courseId={course.id}
          courseName={course.name}
          onClose={() => setShowRequestModal(false)}
          onSuccess={loadFolders}
        />
      )}

      {showEditCourse && (
        <EditCourseModal 
          course={course}
          onClose={() => setShowEditCourse(false)}
          onSuccess={(updated) => setCourse(updated)}
        />
      )}

      {editingFolder && (
        <EditFolderModal 
          folder={editingFolder}
          onClose={() => setEditingFolder(null)}
          onSuccess={loadFolders}
        />
      )}
    </div>
  );
}