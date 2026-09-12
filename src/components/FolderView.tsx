"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import {
  ChevronLeft,
  Folder,
  FolderPlus,
  Pencil,
  Archive,
  Loader,
  Video,
  ChevronDown,
  MoreVertical
} from 'lucide-react';
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

  // Controle do menu dropdown de pastas
  const [isFolderDropdownOpen, setIsFolderDropdownOpen] = useState(false);
  // Controle do menu de 3 pontos do Header
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const headerMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadFolders();
  }, [course.id]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target as Node)) {
        setIsHeaderMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    setIsFolderDropdownOpen(false);
  };

  const handleSelectVideos = () => {
    setSelectedFolder(null);
    setShowVideos(true);
    setIsFolderDropdownOpen(false);
  };

  const handleDownloadFullCourse = async () => {
    if (folders.length === 0) {
      toast.error('Esta disciplina não possui pastas com arquivos.');
      return;
    }

    setZipping(true);
    const toastId = toast.loading('Compactando arquivos da disciplina...');

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
        toast.success(`${successCount} arquivos baixados (${errorCount} falhas).`, { id: toastId });
      } else {
        toast.success('Disciplina baixada com sucesso!', { id: toastId });
      }
    } catch (error) {
      console.error('Erro no download completo:', error);
      toast.error('Erro ao gerar download.', { id: toastId });
    } finally {
      setZipping(false);
    }
  };

  const activeFolderName = showVideos ? 'VIDEOAULAS' : selectedFolder?.name || 'Selecione uma pasta';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-4 animate-in fade-in duration-200">
      
      {/* 1. Header Compacto (Voltar + Nome Truncado + Menu ⋮) */}
      <div className="flex items-center justify-between gap-2 bg-white px-3 py-2.5 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <button
            onClick={onBack}
            className="p-1.5 hover:bg-gray-100 rounded-xl transition text-gray-600 shrink-0"
            title="Voltar"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="min-w-0 flex-1">
            <h1 className="text-xs sm:text-sm font-extrabold text-gray-900 truncate leading-tight">
              {course.name}
            </h1>
            {course.code && (
              <p className="text-[9px] sm:text-[10px] font-semibold text-gray-400 uppercase truncate">
                {course.code}
              </p>
            )}
          </div>
        </div>

        {/* Menu de 3 Pontos (Ações Secundárias) */}
        <div className="relative shrink-0" ref={headerMenuRef}>
          <button
            onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
            className="p-1.5 hover:bg-gray-100 rounded-xl transition text-gray-500 hover:text-gray-800"
            title="Mais Opções"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {isHeaderMenuOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-2xl shadow-xl py-1.5 z-40 text-xs font-medium animate-in zoom-in-95 duration-150">
              {isAdmin && (
                <button
                  onClick={() => {
                    setShowEditCourse(true);
                    setIsHeaderMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left hover:bg-purple-50 text-purple-700 flex items-center gap-2"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Editar Disciplina</span>
                </button>
              )}
              
              <button
                onClick={() => {
                  setShowRequestModal(true);
                  setIsHeaderMenuOpen(false);
                }}
                className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-gray-700 flex items-center gap-2"
              >
                <FolderPlus className="w-3.5 h-3.5 text-amber-600" />
                <span>Solicitar Nova Pasta</span>
              </button>

              <button
                onClick={() => {
                  handleDownloadFullCourse();
                  setIsHeaderMenuOpen(false);
                }}
                className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-gray-700 flex items-center gap-2 border-t border-gray-100"
              >
                <Archive className="w-3.5 h-3.5 text-emerald-600" />
                <span>Baixar Disciplina Completa</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Botões de Ação Rápidos Compactos (Lado a Lado) */}
      <div className="grid grid-cols-1 gap-2">
        <button
          onClick={handleDownloadFullCourse}
          disabled={zipping || folders.length === 0}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
        >
          {zipping ? (
            <>
              <Loader className="w-3.5 h-3.5 animate-spin" />
              <span>Compactando...</span>
            </>
          ) : (
            <>
              <Archive className="w-3.5 h-3.5" />
              <span>Baixar Tudo (ZIP)</span>
            </>
          )}
        </button>
      </div>

      {/* 3. Seletor de Pastas de Materiais (Dropdown Inline 3 Colunas Fixo) */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 space-y-2">
        <button
          onClick={() => setIsFolderDropdownOpen(!isFolderDropdownOpen)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 bg-gray-50 hover:bg-blue-50/60 border border-gray-200 rounded-xl transition text-left group"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest shrink-0">Pasta:</span>
            <div className="flex items-center gap-1.5 min-w-0">
              {showVideos ? (
                <Video className="w-4 h-4 text-blue-600 shrink-0" />
              ) : (
                <Folder className="w-4 h-4 text-blue-600 shrink-0" />
              )}
              <span className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                {activeFolderName}
              </span>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ${isFolderDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
        </button>

        {/* Grid Fixo de 3 Colunas dentro da tela (Sem rolagem horizontal) */}
        {isFolderDropdownOpen && (
          <div className="pt-2 border-t border-gray-100 animate-in fade-in duration-150">
            <div className="grid grid-cols-3 gap-2">
              {folders.map((folder) => {
                const isActive = !showVideos && selectedFolder?.id === folder.id;
                return (
                  <div key={folder.id} className="relative group">
                    <button
                      onClick={() => handleSelectFolder(folder)}
                      className={`w-full flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl border text-center transition ${
                        isActive
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
                      }`}
                    >
                      <Folder className={`w-4 h-4 mb-1 shrink-0 ${isActive ? 'text-white' : 'text-blue-500'}`} />
                      <span className="text-[11px] font-bold truncate w-full px-0.5">
                        {folder.name}
                      </span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingFolder(folder);
                        }}
                        className="absolute top-1 right-1 p-1 bg-white/90 border border-gray-200 rounded-md text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition shadow-sm"
                        title="Renomear pasta"
                      >
                        <Pencil className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Botão de Videoaulas no Grid */}
              <button
                onClick={handleSelectVideos}
                className={`w-full flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl border text-center transition ${
                  showVideos
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                    : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
                }`}
              >
                <Video className={`w-4 h-4 mb-1 shrink-0 ${showVideos ? 'text-white' : 'text-blue-500'}`} />
                <span className="text-[11px] font-bold truncate w-full px-0.5">
                  Vídeos
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Área de Upload (quando ativada) */}
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

      {/* 5. Conteúdo Principal da Pasta (Lista de Arquivos + Links + Discussão) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
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
              <div className="pt-2">
                <ExternalLinksList courseId={course.id} folderId={selectedFolder.id} />
              </div>
            </>
          ) : null}
        </div>
        
        <div className="space-y-4">
          <FolderComments courseId={course.id} />
        </div>
      </div>

      {/* Modais */}
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