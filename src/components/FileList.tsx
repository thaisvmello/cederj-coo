import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Download, FileText, Eye, Loader } from 'lucide-react';
import type { File as FileType } from '../lib/types';
import { PDFViewer } from './PDFViewer';

interface FileListProps {
  folderId: string;
}

export function FileList({ folderId }: FileListProps) {
  const [files, setFiles] = useState<FileType[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileType | null>(null);
  const [showViewer, setShowViewer] = useState(false);

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

  const handleDownload = async (file: FileType) => {
    try {
      const { data, error } = await supabase.storage
        .from('course-materials')
        .download(file.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      await supabase.from('file_access_logs').insert({
        file_id: file.id,
        accessed_by: (await supabase.auth.getUser()).data.user?.id,
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Erro ao baixar arquivo');
    }
  };

  const handleViewPDF = (file: FileType) => {
    if (file.file_type === 'application/pdf') {
      setSelectedFile(file);
      setShowViewer(true);
    }
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
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Arquivo
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Tamanho
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {files.map((file) => (
                <tr key={file.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 truncate block max-w-xs">
                      {file.description || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {(file.file_size / 1024).toFixed(2)} KB
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {file.file_type === 'application/pdf' && (
                        <button
                          onClick={() => handleViewPDF(file)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition text-xs font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          Ver
                        </button>
                      )}
                      <button
                        onClick={() => handleDownload(file)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition text-xs font-medium"
                      >
                        <Download className="w-4 h-4" />
                        Baixar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showViewer && selectedFile && (
        <PDFViewer
          file={selectedFile}
          onClose={() => setShowViewer(false)}
        />
      )}
    </>
  );
}
