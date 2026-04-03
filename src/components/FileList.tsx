"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Download, FileText, Eye, Loader, Trash2, Pencil, X, Check, Archive, Upload } from 'lucide-react';
import type { File as FileType } from '../lib/types';
import { PDFViewer } from './PDFViewer';
import { FileActionModal } from './FileActionModal';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../hooks/useAdmin';
import JSZip from 'jszip';

interface FileListProps {
  folderId: string;
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [zipping, setZipping] = useState(false);
  
  const [actionModal, setActionModal] = useState<{
    fileId: string;
    fileName: string;
    type: 'rename' | 'delete';
  } | null>(null);

  const { user } = useAuth();
  const { isAdmin } = useAdmin();

  useEffect(() => {
    loadFiles();
  }, [folderId]);

  const loadFiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('folder_id', folderId)
      .order('created_at', { ascending: false });

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
      a.download = `arquivos-${folderId}-${Date.now()}.zip`;
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
    if (!isAdmin || !editingName.trim()) return;

    try {
      const { error } = await supabase
        .from('files')
        .update({ name: editingName.trim() })
        .eq('id', fileId);

      if (error) throw error;

      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, name: editingName.trim() } : f
      ));
      toast.success('Arquivo renomeado com sucesso');
      cancelRename();
    } catch (error) {
      console.error('Erro ao renomear arquivo:', error);
      toast.error('Erro ao renomear arquivo');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 flex items-center justify-center">
        <Loader className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selectedFileIds.length === files.length && files.length > 0}
            onChange={handleSelectAll}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded"
          />
          <label className="text-sm text-gray-700">
            Selecionar todos <span className="text-gray-400">{`(${selectedFileIds.length}/${files.length})`}</span>
          </label>
        </div>
        
        <div className="flex-1" />

        <div className="flex items-center gap-2">
          {selectedFileIds.length > 0 && (
            <button
              onClick={handleBatchDownload}
              disabled={loading}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              Baixar Selecionados
            </button>
          )}
          
          <button 
            onClick={onToggleUpload}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
              isUploadOpen 
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                : 'bg-[#0f172a] text-white hover:bg-[#1e293b]'
            }`}
          >
            <Upload className="w-4 h-4" />
            Enviar Arquivo
          </button>

          <button
            onClick={handleDownloadAllAsZip}
            disabled={zipping || files.length === 0}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {zipping ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Compactando...
              </>
            ) : (
              <>
                <Archive className="w-4 h-4" />
                Baixar Tudo (ZIP)
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {files.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Nenhum arquivo nesta pasta</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left w-10"></th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Arquivo</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tamanho</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {files.map((file) => (
                  <tr key={file.id} className="hover:bg-gray-50/50 transition group">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedFileIds.includes(file.id)}
                        onChange={() => toggleSelect(file.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      {editingFileId === file.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="px-2 py-1 border border-blue-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRename(file.id);
                              if (e.key === 'Escape') cancelRename();
                            }}
                          />
                          <button onClick={() => handleRename(file.id)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="w-4 h-4" /></button>
                          <button onClick={cancelRename} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                          <span className="text-sm font-medium text-gray-700 truncate">{file.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs text-gray-400 font-medium">{(file.file_size / 1024).toFixed(2)} KB</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {file.file_type === 'application/pdf' && (
                          <button
                            onClick={() => handleViewFile(file)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Visualizar"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDownload(e, file)}
                          className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="Baixar"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        
                        {isAdmin ? (
                          <>
                            <button onClick={() => startRename(file)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition" title="Renomear"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteFile(file.id)} disabled={deletingId === file.id} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50" title="Excluir">
                              {deletingId === file.id ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => setActionModal({ fileId: file.id, fileName: file.name, type: 'rename' })} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Solicitar renomeação"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => setActionModal({ fileId: file.id, fileName: file.name, type: 'delete' })} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Solicitar exclusão"><Trash2 className="w-4 h-4" /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showViewer && selectedFile && (
        <PDFViewer file={selectedFile} onClose={() => {
          setShowViewer(false);
          setSelectedFile(null);
        }} />
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
    </>
  );
}