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
      // 1. Obter a sessão e a chave anon
      const { data: { session } } = await supabase.auth.getSession();
      const anonKey = (supabase as any).supabaseKey; // Pega a chave anon do cliente
      
      if (!session) throw new Error('Sessão expirada. Por favor, faça login novamente.');

      // 2. Chamar a Edge Function
      const functionUrl = `https://tlcdhwjkdbrmrwueeokj.supabase.co/functions/v1/get-r2-upload-url`;
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': anonKey, // Obrigatório para o gateway do Supabase
        },
        body: JSON.stringify({
          fileName: pendingFile.file.name,
          fileType: pendingFile.file.type,
          folderId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro na função (${response.status})`);
      }

      const data = await response.json();

      // 3. Upload direto para o R2 via PUT
      const uploadRes = await fetch(data.uploadUrl, {
        method: 'PUT',
        body: pendingFile.file,
        headers: { 
          'Content-Type': pendingFile.file.type 
        }
      }).catch(err => {
        if (err.name === 'TypeError') throw new Error('Erro de Rede/CORS no R2: Verifique as configurações de CORS no painel da Cloudflare.');
        throw err;
      });

      if (!uploadRes.ok) {
        throw new Error(`Falha no R2 (${uploadRes.status}): Verifique as permissões do bucket.`);
      }

      // 4. Salvar metadados no Supabase
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
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('[FileUpload] Erro:', msg);
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
        <div>
          <h3 className="font-bold text-gray-900">Upload Direto (R2)</h3>
          <p className="text-xs text-gray-500">Destino: {disciplineName}</p>
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
              <div key={file.id} className={`p-3 rounded-lg border ${file.error ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 truncate flex-1 mr-4">{file.name}</span>
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
                {file.error && (
                  <div className="mt-2 flex items-start gap-1.5 text-[10px] text-red-600 font-medium">
                    <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                    <span>{file.error}</span>
                  </div>
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