import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, X, Loader, Edit2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { formatFileName } from '../lib/utils';
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
      name: formatFileName(disciplineName, file.name),
      file,
      uploading: false,
    }));
    setPendingFiles((prev) => [...prev, ...newFiles]);
  };

  const updateFileName = (id: string, newName: string) => {
    setPendingFiles(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
  };

  const uploadFile = async (pendingFile: PendingFile) => {
    if (!user) return;

    setPendingFiles((prev) =>
      prev.map((f) => (f.id === pendingFile.id ? { ...f, uploading: true, error: undefined } : f))
    );

    try {
      // 1. Obter URL de upload via Edge Function
      const { data, error: funcError } = await supabase.functions.invoke('get-r2-upload-url', {
        body: {
          fileName: pendingFile.name,
          fileType: pendingFile.file.type,
          folderId
        }
      });

      if (funcError || !data?.uploadUrl) {
        throw new Error(funcError?.message || 'Erro ao obter URL de upload');
      }

      // 2. Upload direto para o R2 usando a URL assinada
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

      // 3. Registrar o arquivo no banco de dados do Supabase
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
          <p className="text-[10px] text-gray-400 mt-2 uppercase font-bold tracking-widest">Os arquivos serão renomeados automaticamente</p>
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
          <div className="max-h-80 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {pendingFiles.map((file) => (
              <div key={file.id} className="p-4 rounded-xl border bg-gray-50 space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Edit2 className="w-3 h-3 text-gray-400" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nome do arquivo no acervo</span>
                    </div>
                    <input 
                      type="text"
                      value={file.name}
                      onChange={(e) => updateFileName(file.id, e.target.value)}
                      disabled={file.uploading}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition disabled:opacity-50"
                    />
                    {file.error && <p className="text-[10px] text-red-500 mt-1 font-medium">{file.error}</p>}
                  </div>
                  <div className="shrink-0">
                    {file.uploading ? (
                      <Loader className="w-5 h-5 text-blue-500 animate-spin" />
                    ) : (
                      <button 
                        onClick={() => setPendingFiles(p => p.filter(f => f.id !== file.id))}
                        className="p-2 hover:bg-gray-200 rounded-full transition"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium">
                  <span className="truncate max-w-[200px]">Original: {file.file.name}</span>
                  <span>{(file.file.size / 1024).toFixed(1)} KB</span>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={uploadAll}
            disabled={pendingFiles.some(f => f.uploading)}
            className="w-full py-3 bg-[#0f172a] text-white rounded-xl font-bold text-sm hover:bg-[#1e293b] transition disabled:opacity-50 shadow-lg shadow-blue-900/10"
          >
            {pendingFiles.some(f => f.uploading) ? 'Enviando...' : `Iniciar Upload (${pendingFiles.length})`}
          </button>
        </div>
      )}
    </div>
  );
}