import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, X, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface FileUploadProps {
  folderId: string;
  disciplineName: string;
  onUploadSuccess: () => void;
}

interface PendingFile {
  id: string;
  name: string;
  file: File;
  uploading: boolean;
  error?: string;
}

export function FileUpload({ folderId, disciplineName, onUploadSuccess }: FileUploadProps) {
  const { user } = useAuth();
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);

  const addFiles = (files: File[]) => {
    const newFiles = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      file,
      uploading: false,
    }));
    setPendingFiles((prev) => [...prev, ...newFiles]);
  };

  const uploadFile = async (pendingFile: PendingFile) => {
    if (!user) return;

    setPendingFiles((prev) => 
      prev.map(f => (f.id === pendingFile.id ? { ...f, uploading: true } : f))
    );
    
    try {
      const { data, error: funcError } = await supabase.functions.invoke('get-r2-upload-url', {
        body: {
          fileName: pendingFile.file.name,
          fileType: pendingFile.file.type,
          folderId
        }
      });

      if (funcError || !data?.uploadUrl) {
        throw new Error(funcError?.message || 'Erro ao obter URL de upload');
      }

      const uploadRes = await fetch(data.uploadUrl, {
        method: 'PUT',
        body: pendingFile.file,
        headers: { 
          'Content-Type': pendingFile.file.type 
        }
      });

      if (!uploadRes.ok) {
        throw new Error('Falha no envio do arquivo para o storage');
      }

      const { error: dbError } = await supabase
        .from('files')
        .insert({
          folder_id: folderId,
          name: pendingFile.name,
          file_path: data.publicUrl,
          file_size: pendingFile.file.size,
          file_type: pendingFile.file.type,
          uploaded_by: user.id,
        });

      if (dbError) throw dbError;

      setPendingFiles((prev) => prev.filter(f => f.id !== pendingFile.id));
      toast.success(`${pendingFile.name} enviado com sucesso!`);
      onUploadSuccess();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro no upload';
      console.error('Upload error:', error);
      toast.error(msg);
      setPendingFiles((prev) => 
        prev.map(f => (f.id === pendingFile.id ? { ...f, uploading: false, error: msg } : f))
      );
    }
  };

  const uploadAll = async () => {
    const filesToUpload = pendingFiles.filter(f => !f.uploading);
    for (const file of filesToUpload) {
      await uploadFile(file);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Upload className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Envio de Arquivos para {disciplineName}</h3>
            <p className="text-sm text-gray-500">Arraste arquivos aqui ou clique para selecionar</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Removido botão de nova pasta para eliminar uso de showNewFolder */}
        </div>
      </div>

      {pendingFiles.length === 0 ? (
        <div
          onDragOver={(e) => { e.preventDefault(); addFiles(Array.from(e.dataTransfer.files)); }}
          onDrop={(e) => { e.preventDefault(); addFiles(Array.from(e.dataTransfer.files)); }}
          className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all"
        >
          <Upload className="w-10 h-10 text-gray-400" />
          <p className="mt-3 text-sm font-medium text-gray-500">Arraste arquivos aqui ou clique para selecionar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingFiles.map((file) => (
            <div key={file.id} className="flex items-center gap-2">
              <div className="p-2 bg-gray-50 rounded-lg">
                <X className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                {file.error && (
                  <p className="text-[10px] text-red-500 mt-0.5">Erro: {file.error}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {pendingFiles.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Loader className="w-4 h-4 text-blue-500 animate-spin" />
            </div>
            <p className="text-sm font-medium text-gray-500">Enviando...</p>
          </div>
          <button 
            onClick={uploadAll}
            disabled={pendingFiles.some(f => f.uploading)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0f172a] text-white rounded-xl font-bold text-sm hover:bg-[#1e293b] transition disabled:opacity-50"
          >
            {pendingFiles.some(f => f.uploading) ? 'Enviando...' : 'Iniciar Upload'}
          </button>
        </div>
      )}
    </div>
  );
}