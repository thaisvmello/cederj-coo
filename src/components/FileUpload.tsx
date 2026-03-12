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
      prev.map((f) => (f.id === pendingFile.id ? { ...f, uploading: true } : f))
    );

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada. Faça login novamente.');

      // 1. Obter URL pré-assinada usando a Edge Function
      const { data, error: funcError } = await supabase.functions.invoke('get-r2-upload-url', {
        body: {
          fileName: pendingFile.file.name,
          fileType: pendingFile.file.type,
          folderId
        }
      });

      if (funcError || !data) throw new Error(funcError?.message || 'Erro ao obter URL de upload');

      // 2. Upload direto para o R2 usando a URL assinada
      const uploadRes = await fetch(data.uploadUrl, {
        method: 'PUT',
        body: pendingFile.file,
        headers: { 'Content-Type': pendingFile.file.type }
      });

      if (!uploadRes.ok) {
        throw new Error('Falha no upload para o R2. Verifique as configurações de CORS do seu bucket.');
      }

      // 3. Salvar metadados no Supabase
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
      toast.success(`${pendingFile.name} enviado!`);
      onUploadSuccess();
    } catch (error) {
      console.error('[FileUpload] Erro:', error);
      toast.error(error instanceof Error ? error.message : 'Erro no upload');
      setPendingFiles((prev) =>
        prev.map((f) => (f.id === pendingFile.id ? { ...f, uploading: false } : f))
      );
    }
  };

  const uploadAll = async () => {
    for (const file of pendingFiles) {
      if (!file.uploading) await uploadFile(file);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900">Upload de Materiais</h3>
          <p className="text-xs text-gray-500">Pasta: {disciplineName}</p>
        </div>
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
              <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-sm font-medium text-gray-900 truncate">{file.name}</span>
                {file.uploading ? <Loader className="w-4 h-4 text-blue-500 animate-spin" /> : (
                  <button onClick={() => setPendingFiles(prev => prev.filter(f => f.id !== file.id))} className="text-gray-400 hover:text-red-500">
                    <X className="w-4 h-4" />
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
            {pendingFiles.some(f => f.uploading) ? 'Enviando...' : `Enviar ${pendingFiles.length} arquivo(s)`}
          </button>
        </div>
      )}
    </div>
  );
}