"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Download, FileText, Eye, Loader, Trash2, Pencil, X, Check, Archive, Upload, AlertTriangle } from 'lucide-react';
import type { File as FileType } from '../lib/types';
import { PDFViewer } from './PDFViewer';
import { FileActionModal } from './FileActionModal';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../hooks/useAdmin';
import JSZip from 'jszip';

interface FileListProps {
  folderId: string;
  courseName?: string;
  folderName?: string;
  onToggleUpload?: () => void;
  isUploadOpen?: boolean;
}

export function FileList({ folderId, courseName, folderName, onToggleUpload, isUploadOpen }: FileListProps) {
  const [files, setFiles] = useState<FileType[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [showViewer, setShowViewer] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileType | null>(null);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [zipping, setZipping] = useState(false);
  
  const [actionModal, setActionModal] = useState<{
    fileId: string;
    fileName: string;
    type: 'rename' | 'delete';
  } | null>(null);

  const { user } = useAuth();
  const { isAdmin } = useAdmin();

  // Identificar nomes duplicados na pasta atual
  const duplicateNames = useMemo(() => {
    const counts: Record<string, number> = {};
    files.forEach(f => {
      counts[f.name] = (counts[f.name] || 0) + 1;
    });
    return new Set(Object.keys(counts).filter(name => counts[name] > 1));
  }, [files]);

  useEffect(() => {
    loadFiles();
  }, [folderId]);

  const loadFiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('folder_id', folderId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error loading files:', error);
    } else {
      setFiles(data || []);
    }
    setLoading(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedFileIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const downloadFile = async (file: FileType) => {
    try {
      const a = document.createElement('a');
      a.href = file.file_path;
      a.download = file.name;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      if (user) {
        await supabase.from('folder_access').insert({
          folder_id: file.folder_id,
          user_id: user.id,
        });
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Erro ao baixar arquivo');
    }
  };

  const handleDownload = (e: React.MouseEvent, file: FileType) => {
    e.stopPropagation();
    downloadFile(file);
  };

  const handleViewFile = (file: FileType) => {
    setSelectedFile(file);
    setShowViewer(true);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedFileIds(files.map(f => f.id));
    } else {
      setSelectedFileIds([]);
    }
  };

  const handleBatchDownload = async () => {
    if (selectedFileIds.length === 0) return;
    setLoading(true);
    for (const id of selectedFileIds) {
      const file = files.find(f => f.id === id);
      if (file) {
        await downloadFile(file);
      }
    }
    setLoading(false);
    setSelectedFileIds([]);
  };

  const handleDownloadAllAsZip = async () => {
    if (files.length === 0) return;
    
    setZipping(true);
    const toastId = toast.loading('Preparando arquivo ZIP...');
    
    try {
      const zip = new JSZip();
      let successCount = 0;
      let errorCount = 0;

      for (const file of files) {
        try {
          const response = await fetch(file.file_path);
          if (!response.ok) throw new Error(`Failed to fetch ${file.name}`);
          const blob = await response.blob();
          zip.file(file.name, blob);
          successCount++;
        } catch (err) {
          console.error(`Error adding ${file.name} to zip:`, err);
          errorCount++;
        }
      }

      if (successCount === 0) {
        toast.error('Nenhum arquivo pôde ser baixado', { id: toastId });
        setZipping(false);
        return;
      }

      toast.loading('Gerando arquivo ZIP...', { id: toastId });
      
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      
      const zipName = `${courseName || 'ACERVO'}_${folderName || 'ARQUIVOS'}`
        .toUpperCase()
        .replace(/\s+/g, '_')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
        
      a.download = `${zipName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (errorCount > 0) {
        toast.success(`${successCount} arquivos baixados, ${errorCount} com erro`, { id: toastId });
      } else {
        toast.success(`${successCount} arquivos baixados com sucesso!`, { id: toastId });
      }
    } catch (error) {
      console.error('Error creating zip:', error);
      toast.error('Erro ao criar arquivo ZIP', { id: toastId });
    } finally {
      setZipping(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!isAdmin) return;
    
    setDeletingId(fileId);
    try {
      const { error } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;

      setFiles(prev => prev.filter(f => f.id !== fileId));
      toast.success('Arquivo excluído com sucesso');
    } catch (error) {
      console.error('Erro ao excluir arquivo:', error);
      toast.error('Erro ao excluir arquivo');
    } finally {
      setDeletingId(null);
    }
  };

  const startRename = (file: FileType) => {
    setEditingFileId(file.id);
    setEditingName(file.name);
  };

  const cancelRename = () => {
    setEditingFileId(null);
    setEditingName('');
  };

  const handleRename = async (fileId: string) => {
    if (!user) {
      toast.error('Você precisa estar logado para renomear arquivos');
      return;
    }

    if (!editingName.trim()) {
      toast.error('O nome do arquivo não pode estar em branco');
      return;
    }

    setIsRenaming(true);

    try {
      const { error } = await supabase
        .from('files')
        .update({ name: editingName.trim() })
        .eq('id', fileId);

      if (error) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Sessão expirada. Faça login novamente.');

        const res = await fetch('https://tlcdhwjkdbrmrwueeokj.supabase.co/functions/v1/rename-file', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            fileId,
            newName: editingName.trim()
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Erro ao renomear arquivo');
        }
      }

      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, name: editingName.trim() } : f
      ));
      toast.success('Arquivo renomeado com sucesso!');
      cancelRename();
    } catch (error: any) {
      console.error('Erro ao renomear arquivo:', error);
      toast.error(error.message || 'Erro ao renomear arquivo');
    } finally {
      setIsRenaming(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex items-center justify-center">
        <Loader className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-4">
      {/* Barra de Ações do Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="select-all"
            checked={selectedFileIds.length === files.length && files.length > 0}
            onChange={handleSelectAll}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
          />
          <label htmlFor="select-all" className="text-xs sm:text-sm font-semibold text-gray-700 cursor-pointer select-none">
            Selecionar todos <span className="text-gray-400 font-normal">({selectedFileIds.length}/{files.length})</span>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedFileIds.length > 0 && (
            <button
              onClick={handleBatchDownload}
              disabled={loading}
              className="flex-1 sm:flex-none px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition disabled:opacity-50 shadow-sm"
            >
              Baixar Selecionados ({selectedFileIds.length})
            </button>
          )}
          
          <button 
            onClick={onToggleUpload}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
              isUploadOpen 
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                : 'bg-[#0f172a] text-white hover:bg-[#1e293b]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Enviar Arquivo</span>
          </button>

          <button
            onClick={handleDownloadAllAsZip}
            disabled={zipping || files.length === 0}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition disabled:opacity-50 shadow-sm"
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
      </div>

      {/* Lista de Arquivos 100% Fluida e Responsiva */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
        {files.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <FileText className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="text-gray-500 text-sm font-medium">Nenhum arquivo nesta pasta</p>
            <p className="text-xs text-gray-400">Clique em "Enviar Arquivo" acima para adicionar material.</p>
          </div>
        ) : (
          files.map((file) => {
            const isDuplicate = duplicateNames.has(file.name);
            const isSelected = selectedFileIds.includes(file.id);

            return (
              <div 
                key={file.id} 
                className={`p-3.5 sm:p-4 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isSelected ? 'bg-blue-50/40' : 'hover:bg-gray-50/60'
                }`}
              >
                {/* Lado Esquerdo: Checkbox + Ícone + Nome do Arquivo */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(file.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer mt-1 shrink-0"
                  />

                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0 mt-0.5">
                    <FileText className={`w-4 h-4 ${isDuplicate ? 'text-orange-500' : 'text-blue-500'}`} />
                  </div>

                  <div className="min-w-0 flex-1">
                    {editingFileId === file.id ? (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          disabled={isRenaming}
                          className="px-3 py-1.5 border border-blue-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full bg-white shadow-inner"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(file.id);
                            if (e.key === 'Escape') cancelRename();
                          }}
                        />
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                          <button 
                            onClick={() => handleRename(file.id)} 
                            disabled={isRenaming}
                            className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg disabled:opacity-50 transition"
                            title="Salvar novo nome"
                          >
                            {isRenaming ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={cancelRename} 
                            disabled={isRenaming}
                            className="p-1.5 bg-gray-100 text-gray-500 hover:bg-gray-200 rounded-lg disabled:opacity-50 transition"
                            title="Cancelar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p 
                          className={`text-xs sm:text-sm font-semibold break-words leading-snug ${
                            isDuplicate ? 'text-orange-700 flex items-center gap-1.5' : 'text-gray-900'
                          }`}
                        >
                          {isDuplicate && <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-orange-500" />}
                          <span>{file.name}</span>
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                          <span>{(file.file_size / 1024).toFixed(1)} KB</span>
                          <span>•</span>
                          <span className="uppercase">{file.file_type.split('/')[1] || 'DOC'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lado Direito: Ações (Sempre alinhadas e adaptadas para mobile) */}
                <div className="flex items-center justify-end gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  {file.file_type === 'application/pdf' && (
                    <button
                      onClick={() => handleViewFile(file)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition flex items-center gap-1"
                      title="Visualizar e Anotar"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-[11px] font-bold sm:hidden">Ver</span>
                    </button>
                  )}

                  <button
                    onClick={(e) => handleDownload(e, file)}
                    className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition flex items-center gap-1"
                    title="Baixar Arquivo"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-[11px] font-bold sm:hidden">Baixar</span>
                  </button>
                  
                  <button 
                    onClick={() => startRename(file)} 
                    className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition flex items-center gap-1" 
                    title="Renomear arquivo"
                  >
                    <Pencil className="w-4 h-4" />
                    <span className="text-[11px] font-bold sm:hidden">Renomear</span>
                  </button>

                  {isAdmin ? (
                    <button 
                      onClick={() => handleDeleteFile(file.id)} 
                      disabled={deletingId === file.id} 
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition disabled:opacity-50" 
                      title="Excluir arquivo"
                    >
                      {deletingId === file.id ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  ) : (
                    <button 
                      onClick={() => setActionModal({ fileId: file.id, fileName: file.name, type: 'delete' })} 
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition" 
                      title="Solicitar exclusão"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {showViewer && selectedFile && (
        <PDFViewer 
          file={selectedFile} 
          onClose={() => {
            setShowViewer(false);
            setSelectedFile(null);
          }} 
        />
      )}

      {actionModal && (
        <FileActionModal
          fileId={actionModal.fileId}
          fileName={actionModal.fileName}
          actionType={actionModal.type}
          onClose={() => setActionModal(null)}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
}