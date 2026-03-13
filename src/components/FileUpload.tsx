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
        headers: { 'Content-Type': pendingFile.file.type }
      });

      if (!uploadRes.ok) throw new Error('Falha no envio para o storage');

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
      toast.error(msg);
      setPendingFiles((prev) =>
        prev.map((f) => (f.id === pendingFile.id ? { ...f, uploading: false, error: msg } : f))
      );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-sm">
      <h3 className="font-bold text-gray-900">Upload para {disciplineName}</h3>
      
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

      {pendingFiles.length > 0 && (
        <div className="space-y-2">
          {pendingFiles.map((file) => (
            <div key={file.id} className="p-3 rounded-lg border bg-gray-50 flex items-center justify-between">
              <span className="text-xs font-medium truncate flex-1">{file.name}</span>
              <div className="flex items-center gap-2">
                {file.uploading ? (
                  <Loader className="w-4 h-4 text-blue-500 animate-spin" />
                ) : (
                  <>
                    <button onClick={() => uploadFile(file)} className="text-xs text-blue-600 font-bold">Enviar</button>
                    <button onClick={() => setPendingFiles(p => p.filter(f => f.id !== file.id))}><X className="w-4 h-4 text-gray-400" /></button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}