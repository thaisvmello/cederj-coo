import { X, Download } from 'lucide-react';
import type { File } from '../lib/types';
import toast from 'react-hot-toast';

interface PDFViewerProps {
  file: File;
  onClose: () => void;
}

export function PDFViewer({ file, onClose }: PDFViewerProps) {
  // No Firebase, já estamos guardando a URL pública no file_path
  const url = file.file_path;

  const handleDownload = () => {
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Erro ao baixar arquivo');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="font-semibold text-gray-900">{file.name}</h2>
            {file.description && (
              <p className="text-sm text-gray-600 mt-1">{file.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition font-medium text-sm"
            >
              <Download className="w-4 h-4" />
              Baixar
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden bg-gray-100">
          <iframe
            src={`${url}#toolbar=0`}
            title={file.name}
            className="w-full h-full border-none"
          />
        </div>
      </div>
    </div>
  );
}