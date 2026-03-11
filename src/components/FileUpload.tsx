import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, X, Loader, AlertCircle } from 'lucide-react';
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
  description: string;
  file: File;
  uploading: boolean;
  validationError: string | null;
}

export function FileUpload({ folderId, disciplineName, onUploadSuccess }: FileUploadProps) {
  const { user } = useAuth();
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFileName = (fileName: string): string | null => {
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
    const parts = nameWithoutExt.split('_');
    if (parts.length !== 3) return 'Formato: DISCIPLINA_PROVA_ANO';
    return null;
  };

  const addFiles = (files: File[]) => {
    const newFiles = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      description: '',
      file,
      uploading: false,
      validationError: validateFileName(file.name),
    }));
    setPendingFiles((prev) => [...prev, ...newFiles]);
  };

  const uploadFile = async (pendingFile: PendingFile) => {
    if (!user) return;

    setPendingFiles((prev) =>
      prev.map((f) => (f.id === pendingFile.id ? { ...f, uploading: true } : f))
    );

    try {
      // 1. Obter URL pré-assinada da Edge Function
      const { data, error: funcError } = await supabase.functions.invoke('get-r2-upload-url', {
        body: { 
          fileName: pendingFile.file.name, 
          fileType: pendingFile.file.type,
          folderId 
        }
      });

      if (funcError) throw funcError;

      // 2. Upload direto para o R2
      const uploadRes = await fetch(data.uploadUrl, {
        method: 'PUT',
        body: pendingFile.file,
        headers: { 'Content-Type': pendingFile.file.type }
      });

      if (!uploadRes.ok) throw new Error('Falha no upload para o R2');

      // 3. Salvar metadados no Supabase
      const { error: dbError } = await supabase.from('files').insert({
        folder_id: folderId,
        name: pendingFile.name,
        file_path: data.publicUrl,
        file_size: pendingFile.file.size,
        file_type: pendingFile.file.type,
        description: pendingFile.description || null,
        uploaded_by: user.id,
      });

      if (dbError) throw dbError;

      setPendingFiles((prev) => prev.filter((f) => f.id !== pendingFile.id));
      onUploadSuccess();
    } catch (error) {
      console.error('R2 Upload error:', error);
      toast.error(`Erro ao enviar ${pendingFile.name}`);
      setPendingFiles((prev) =>
        prev.map((f) => (f.id === pendingFile.id ? { ...f, uploading: false } : f))
      );
    }
  };

  const uploadAll = async () => {
    for (const file of pendingFiles) {
      if (!file.uploading && !file.validationError) {
        await uploadFile(file);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900">Upload de Materiais (Cloudflare R2)</h3>
          <p className="text-xs text-gray-500">Pasta: {disciplineName}</p>
        </div>
        {pendingFiles.length > 0 && (
          <button 
            onClick={() => setPendingFiles([])}
            className="text-xs text-red-500 hover:underline font-medium"
          >
            Limpar lista
          </button>
        )}
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
          <p className="text-gray-600 font-semibold">Arraste arquivos ou clique para selecionar</p>
          <p className="text-xs text-gray-400 mt-1">PDF, Imagens, Docs (Máx 50MB)</p>
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
          <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {pendingFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-white rounded border border-gray-200">
                    <Upload className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{file.name}</p>
                    <p className="text-[10px] text-gray-500">{(file.file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {file.uploading ? (
                    <Loader className="w-4 h-4 text-blue-500 animate-spin" />
                  ) : (
                    <button onClick={() => setPendingFiles(prev => prev.filter(f => f.id !== file.id))} className="text-gray-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={uploadAll}
            disabled={pendingFiles.some(f => f.uploading)}
            className="w-full py-3 bg-[#0f172a] text-white rounded-xl font-bold text-sm hover:bg-[#1e293b] transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {pendingFiles.some(f => f.uploading) ? 'Enviando...' : `Enviar ${pendingFiles.length} arquivo(s)`}
          </button>
        </div>
      )}
    </div>
  );
}