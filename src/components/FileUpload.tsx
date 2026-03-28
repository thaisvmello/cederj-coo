import { supabase } from '../lib/supabase';
import { Loader, AlertCircle, FileText, Upload } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { formatFileName } from '../lib/utils';
import { useState } from 'react';

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
  uploaded: boolean;
  error?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  folderId,
  disciplineName,
  onUploadSuccess,
}) => {
  const { user } = useAuth();
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (pendingFile: PendingFile): Promise<boolean> => {
    if (!user) return false;
    setPendingFiles((prev) =>
      prev.map((f) => (f.id === pendingFile.id ? { ...f, uploading: true, error: undefined } : f))
    );
    try {
      const { data: { session } } = await (supabase as any).auth.getSession();
      if (!session) throw new Error('Sessão expirada. Por favor, faça login novamente.');
      const functionUrl = `https://tlcdhwjkdbrmrwueeokj.supabase.co/functions/v1/get-r2-upload-url`;
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          apikey: (supabase as any).supabaseKey,
        },
        body: JSON.stringify({
          fileName: pendingFile.file.name,
          fileType: pendingFile.file.type,
          folderId,
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Erro na função (${response.status})`);
      }
      const data = await response.json();
      const uploadRes = await fetch(data.uploadUrl, {
        method: 'PUT',
        body: pendingFile.file,
        headers: { 'Content-Type': pendingFile.file.type },
      });
      if (!uploadRes.ok) throw new Error(`Falha no upload (${uploadRes.status})`);
      const { error: dbError } = await (supabase as any)
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
      setPendingFiles((prev) =>
        prev.map((f) => (f.id === pendingFile.id ? { ...f, uploading: false, uploaded: true } : f))
      );
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro desconhecido';
      console.error('[FileUpload] Erro:', msg);
      setPendingFiles((prev) =>
        prev.map((f) => (f.id === pendingFile.id ? { ...f, uploading: false, error: msg } : f))
      );
      return false;
    }
  };

  const uploadAll = async () => {
    const filesToUpload = pendingFiles.filter((f) => !f.uploading && !f.uploaded);
    if (filesToUpload.length === 0) return;
    setIsUploading(true);
    let success = 0;
    for (const file of filesToUpload) {
      if (await uploadFile(file)) success++;
    }
    setIsUploading(false);
    if (success === filesToUpload.length) {
      toast.success(`${success} arquivo(s) enviado(s) com sucesso!`);
      onUploadSuccess();
    } else {
      toast.error('Alguns arquivos falharam ao enviar.');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles: PendingFile[] = Array.from(e.target.files).map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      name: formatFileName(disciplineName, file.name),
      file,
      uploading: false,
      uploaded: false,
    }));
    setPendingFiles((prev) => [...prev, ...newFiles]);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <h3 className="font-bold text-gray-900">Upload para R2</h3>
      <div
        className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-gray-300"
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.multiple = true;
          input.onchange = (e) => handleFileSelect(e as any);
          input.click();
        }}
      >
        <Upload className="w-8 h-8 mx-auto mb-3 text-gray-300" />
        <p className="text-sm font-medium text-gray-700 mb-1">Arraste arquivos aqui ou clique para selecionar</p>
      </div>

      {pendingFiles.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {pendingFiles.map((f) => (
            <div
              key={f.id}
              className={`p-3 rounded flex justify-between items-center border ${
                f.error ? 'bg-red-50 border-red-200' : f.uploaded ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <span className="text-sm">{f.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {f.uploading && <Loader className="w-4 h-4 animate-spin text-blue-500" />}
                {f.uploaded && <span className="text-green-600 font-medium">✓ Enviado</span>}
                {f.error && <span className="text-red-600 text-sm">{f.error}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {pendingFiles.some((f) => !f.uploaded) && (
        <button
          onClick={uploadAll}
          disabled={isUploading}
          className="w-full py-3 bg-[#0f172a] text-white rounded-xl font-bold hover:bg-[#1e293b] disabled:opacity-50"
        >
          {isUploading ? 'Enviando...' : 'Enviar Arquivos'}
        </button>
      )}
    </div>
  );
};