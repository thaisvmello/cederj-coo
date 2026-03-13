import { useState, useRef } from 'react';
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
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      prev.map((f) => (f.id === pendingFile.id ? { ...f, uploading: true, error: undefined } : f))
    );

    try {
      // Upload via Edge Function proxy (evita problemas de CORS)
      const formData = new FormData();
      formData.append('file', pendingFile.file);
      formData.append('folderId', folderId);

      const { data, error: funcError } = await supabase.functions.invoke('get-r2-upload-url', {
        body: formData,
      });

      if (funcError || !data?.publicUrl) {
        throw new Error(funcError?.message || 'Erro ao fazer upload do arquivo');
      }

      // Registrar o arquivo no banco de dados do Supabase
      const { error: dbError } = await supabase.from('files').insert({
        folder_id: folderId,
        name: pendingFile.name,
        file_path: data.publicUrl,
        file_size: pendingFile.file.size,
        file_type: pendingFile.file.type,
        uploaded_by: user.id,
      });

      if (dbError) throw dbError;

      setPendingFiles((prev) => prev.filter((f) => f.id !== pendingFile.id));
      toast.success(`${pendingFile.name} enviado com sucesso!`);
      onUploadSuccess();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro no upload';
      console.error('Upload error:', error);
      toast.error(msg);
      setPendingFiles((prev) =>
        prev.map((f) => (f.id === pendingFile.id ? { ...f, uploading: false, error: msg } : f))
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
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">Upload para {disciplineName}</h3>
      </div>

      {pendingFiles.length === 0 ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); addFiles(Array.from(e.dataTransfer.files)); }}
          className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-semibold text-sm">Clique ou arraste arquivos</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => addFiles(Array.from(e.target.files || []))}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="max-h-60 overflow-y-auto space-y-2">
            {pendingFiles.map((file) => (
              <div key={file.id} className="p-3 rounded-lg border bg-gray-50 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">{file.name}</p>
                  {file.error && <p className="text-[10px] text-red-500 mt-1">{file.error}</p>}
                </div>
                {file.uploading ? (
                  <Loader className="w-4 h-4 text-blue-500 animate-spin" />
                ) : (
                  <button 
                    onClick={() => setPendingFiles(p => p.filter(f => f.id !== file.id))}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={uploadAll}
            disabled={pendingFiles.some(f => f.uploading)}
            className="w-full py-3 bg-[#0f172a] text-white rounded-xl font-bold text-sm hover:bg-[#1e293b] transition disabled:opacity-50"
          >
            {pendingFiles.some(f => f.uploading) ? 'Enviando...' : `Iniciar Upload (${pendingFiles.length})`}
          </button>
        </div>
      )}
    </div>
  );
}