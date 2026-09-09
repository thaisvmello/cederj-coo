"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Download, 
  FileText, 
  Eye, 
  Loader, 
  Trash2, 
  Pencil, 
  X, 
  Check, 
  Upload, 
  AlertTriangle,
  MoreVertical
} from 'lucide-react';
import type { File as FileType } from '../lib/types';
import { PDFViewer } from './PDFViewer';
import { FileActionModal } from './FileActionModal';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../hooks/useAdmin';

interface FileListProps {
  folderId: string;
  courseName?: string;
  folderName?: string;
  onToggleUpload?: () => void;
  isUploadOpen?: boolean;
}

export function FileList({ folderId, onToggleUpload, isUploadOpen }: FileListProps) {
  const [files, setFiles] = useState<FileType[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [showViewer, setShowViewer] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileType | null>(null);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Menu de 3 pontos individual para cada arquivo
  const [activeMenuFileId, setActiveMenuFileId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const [actionModal, setActionModal] = useState<{
    fileId: string;
    fileName: string;
    type: 'rename' | 'delete';
  } | null>(null);

  const { user } = useAuth();
  const { isAdmin } = useAdmin();

  // Fecha o menu de 3 pontos ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuFileId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    setActiveMenuFileId(null);
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

  const handleDeleteFile = async (fileId: string) => {
    if (!isAdmin) return;
    
    setDeletingId(fileId);
    setActiveMenuFileId(null);
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
    setActiveMenuFileId(null);
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
    <div className="w-full max-w-full space-y-3">
      {/* 1. Barra Fina de Seleção em Massa & Ações */}
      <div className="flex items-center justify-between gap-2 bg-white px-3.5 py-2 rounded-2xl border border-gray-200 shadow-sm text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <input
            type="checkbox"
            id="select-all"
            checked={selectedFileIds.length === files.length && files.length > 0}
            onChange={handleSelectAll}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer shrink-0"
          />
          <label htmlFor="select-all" className="font-semibold text-gray-700 cursor-pointer truncate">
            Selecionar todos <span className="text-gray-400 font-normal">({selectedFileIds.length}/{files.length})</span>
          </label>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {selectedFileIds.length > 0 && (
            <button
              onClick={handleBatchDownload}
              disabled={loading}
              className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition disabled:opacity-50"
            >
              Baixar ({selectedFileIds.length})
            </button>
          )}

          <button 
            onClick={onToggleUpload}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition ${
              isUploadOpen 
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                : 'bg-[#0f172a] text-white hover:bg-[#1e293b]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Enviar</span>
          </button>
        </div>
      </div>

      {/* 2. Lista de Arquivos com Botão "Ver" sempre visível e menu ⋮ */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
        {files.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <FileText className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-gray-500 text-xs sm:text-sm font-medium">Nenhum arquivo nesta pasta</p>
            <p className="text-[11px] text-gray-400">Toque em "Enviar" acima para colaborar com este acervo.</p>
          </div>
        ) : (
          files.map((file) => {
            const isDuplicate = duplicateNames.has(file.name);
            const isSelected = selectedFileIds.includes(file.id);
            const isMenuOpen = activeMenuFileId === file.id;

            return (
              <div 
                key={file.id} 
                className={`p-3 transition flex items-center justify-between gap-2.5 ${
                  isSelected ? 'bg-blue-50/40' : 'hover:bg-gray-50/60'
                }`}
              >
                {/* Checkbox + Ícone + Nome e Metadados Truncados */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(file.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer shrink-0"
                  />

                  <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                    <FileText className={`w-4 h-4 ${isDuplicate ? 'text-orange-500' : 'text-blue-500'}`} />
                  </div>

                  <div className="min-w-0 flex-1">
                    {editingFileId === file.id ? (
                      <div className="flex items-center gap-1.5 w-full">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          disabled={isRenaming}
                          className="px-2 py-1 border border-blue-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none w-full bg-white"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(file.id);
                            if (e.key === 'Escape') cancelRename();
                          }}
                        />
                        <button 
                          onClick={() => handleRename(file.id)} 
                          disabled={isRenaming}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                        >
                          {isRenaming ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        </button>
                        <button 
                          onClick={cancelRename} 
                          disabled={isRenaming}
                          className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="min-w-0">
                        <p 
                          className={`text-xs sm:text-sm font-semibold truncate leading-tight ${
                            isDuplicate ? 'text-orange-700 flex items-center gap-1' : 'text-gray-900'
                          }`}
                          title={file.name}
                        >
                          {isDuplicate && <AlertTriangle className="w-3 h-3 text-orange-500 shrink-0 inline" />}
                          <span className="truncate">{file.name}</span>
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium truncate mt-0.5">
                          {(file.file_size / 1024).toFixed(1)} KB • {file.file_type.split('/')[1]?.toUpperCase() || 'PDF'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ações: Botão 'Ver' SEMPRE visível + Menu '⋮' com Baixar/Renomear/Excluir */}
                <div className="flex items-center gap-1 shrink-0 relative">
                  {/* Botão Ver (Sempre Visível para PDFs e documentos) */}
                  {file.file_type === 'application/pdf' && (
                    <button
                      onClick={() => handleViewFile(file)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition shadow-xs"
                      title="Visualizar e Anotar"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span>Ver</span>
                    </button>
                  )}

                  {/* Menu de 3 Pontos para ações secundárias */}
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenuFileId(isMenuOpen ? null : file.id)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition"
                      title="Mais Ações"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {isMenuOpen && (
                      <div 
                        ref={menuRef}
                        className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-30 text-xs font-medium animate-in zoom-in-95 duration-100"
                      >
                        <button
                          onClick={(e) => handleDownload(e, file)}
                          className="w-full px-3 py-2 text-left hover:bg-emerald-50 text-emerald-700 flex items-center gap-2"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Baixar</span>
                        </button>

                        <button
                          onClick={() => startRename(file)}
                          className="w-full px-3 py-2 text-left hover:bg-amber-50 text-amber-700 flex items-center gap-2"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Renomear</span>
                        </button>

                        {isAdmin ? (
                          <button
                            onClick={() => handleDeleteFile(file.id)}
                            disabled={deletingId === file.id}
                            className="w-full px-3 py-2 text-left hover:bg-red-50 text-red-700 flex items-center gap-2 border-t border-gray-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Excluir</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setActiveMenuFileId(null);
                              setActionModal({ fileId: file.id, fileName: file.name, type: 'delete' });
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-red-50 text-red-700 flex items-center gap-2 border-t border-gray-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Solicitar Exclusão</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
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