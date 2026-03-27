"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Download, FileText, Eye, Loader } from 'lucide-react';
import type { File as FileType } from '../lib/types';
import { PDFViewer } from './PDFViewer';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface FileListProps {
  folderId: string;
}

export function FileList({ folderId }: FileListProps) {
  const [files, setFiles] = useState<FileType[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [showViewer, setShowViewer] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileType | null>(null);
  const { user } = useAuth();

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

      // Log access
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
    // Download sequentially to avoid overwhelming
    for (const id of selectedFileIds) {
      const file = files.find(f => f.id === id);
      if (file) {
        await downloadFile(file);
      }
    }
    setLoading(false);
    setSelectedFileIds([]);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 flex items-center justify-center">
        <Loader className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">Nenhum arquivo nesta pasta</p>
      </div>
    );
  }

  return (
    <>
      {/* Selection Controls */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="checkbox"
          checked={selectedFileIds.length === files.length && files.length > 0}
          onChange={handleSelectAll}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded"
        />
        <label className="text-sm text-gray-700">
          {selectedFileIds.length === files.length && files.length > 0 ? 'Selecionar tudo' : 'Selecionar todos'}
        </label>
        <span className="text-sm text-gray-400">{`(${selectedFileIds.length}/${files.length})`}</span>
        {selectedFileIds.length > 0 && (
          <button            onClick={handleBatchDownload}
            disabled={loading}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition disabled:opacity-50"
          >
            Baixar Selecionados
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Arquivo</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Descrição</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Tamanho</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {files.map((file) => (
                <tr key={file.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedFileIds.includes(file.id)}
                      onChange={() => toggleSelect(file.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-900 truncate">{file.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 truncate block max-w-xs">{file.description || '-'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{(file.file_size / 1024).toFixed(2)} KB</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {file.file_type === 'application/pdf' && (
                        <button
                          onClick={() => handleViewFile(file)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition text-xs font-medium"
                        >
                          <Eye className="w-4 h-4" /> Ver
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDownload(e, file)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition text-xs font-medium"
                      >
                        <Download className="w-4 h-4" /> Baixar                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showViewer && selectedFile && (
        <PDFViewer file={selectedFile} onClose={() => {
          setShowViewer(false);
          setSelectedFile(null);
        }} />
      )}
    </>
  );
}