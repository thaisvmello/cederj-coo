import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, X, Loader, AlertCircle, FileText } from 'lucide-react';
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
  uploaded: boolean;
  error?: string;
}

export function FileUpload({ folderId, disciplineName, onUploadSuccess }: FileUploadProps) {
  const { user } = useAuth();
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Inicializar com arquivos vazios - os arquivos virão do componente pai
  const uploadFile = async (pendingFile: PendingFile): Promise<boolean> => {
    if (!user) return false;

    setPendingFiles(prev =>
      prev.map(f => (f.id === pendingFile.id ? { ...f, uploading: true, error: undefined } : f))
    );

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const anonKey = (supabase as any).supabaseKey;
      
      if (!session) throw new Error('Sessão expirada. Por favor, faça login novamente.');

      const functionUrl = `https://tlcdhwjkdbrmrwueeokj.supabase.co/functions/v1/get-r2-upload-url`;
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': anonKey,
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

      const uploadRes = await fetch(data.uploadUrl, {
        method: 'PUT',
        body: pendingFile.file,
        headers: { 
          'Content-Type': pendingFile.file.type 
        }
      });

      if (!uploadRes.ok) {
        throw new Error(`Falha no upload (${uploadRes.status})`);
      }

      const { error: dbError } = await supabase.from('files').insert({
        folder_id: folderId,
        name: pendingFile.name,
        file_path: data.publicUrl,
        file_size: pendingFile.file.size,
        file_type: pendingFile.file.type,
        uploaded_by: user.id,
      });

      if (dbError) throw dbError;

      setPendingFiles(prev =>
        prev.map(f => (f.id === pendingFile.id ? { ...f, uploading: false, uploaded: true } : f))
      );
      
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('[FileUpload] Erro:', msg);
      
      setPendingFiles(prev =>
        prev.map(f => (f.id === pendingFile.id ? { ...f, uploading: false, error: msg } : f))
      );
      
      return false;
    }
  };

  const uploadAll = async () => {
    const filesToUpload = pendingFiles.filter(f => !f.uploading && !f.uploaded);
    if (filesToUpload.length === 0) return;

    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const file of filesToUpload) {
      const success = await uploadFile(file);
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    setIsUploading(false);

    if (errorCount === 0) {
      toast.success(`${successCount} arquivo(s) enviado(s) com sucesso!`);
      onUploadSuccess();
    } else if (successCount > 0) {
      toast.success(`${successCount} arquivo(s) enviado(s), ${errorCount} com erro`);
    } else {
      toast.error('Erro ao enviar arquivos');
    }
  };

  const allUploaded = pendingFiles.length > 0 && pendingFiles.every(f => f.uploaded);
  const hasErrors = pendingFiles.some(f => f.error);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900">Upload para R2</h3>
          <p className="text-xs text-gray-500">Destino: {disciplineName}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="max-h-60 overflow-y-auto space-y-2">
          {pendingFiles.map((file) => (
            <div 
              key={file.id} 
              className={`p-3 rounded-lg border ${
                file.error 
                  ? 'bg-red-50 border-red-200' 
                  : file.uploaded
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <FileText className={`w-4 h-4 shrink-0 ${
                    file.error ? 'text-red-400' : file.uploaded ? 'text-green-500' : 'text-blue-500'
                  }`} />
                  <span className="text-sm font-medium text-gray-900 truncate">{file.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {file.uploading && <Loader className="w-4 h-4 text-blue-500 animate-spin" />}
                  {file.uploaded && <span className="text-xs text-green-600 font-medium">✓ Enviado</span>}
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

        {!allUploaded && (
          <button
            onClick={uploadAll}
            disabled={isUploading || pendingFiles.length === 0}
            className="w-full py-3 bg-[#0f172a] text-white rounded-xl font-bold text-sm hover:bg-[#1e293b] transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Enviando...
              </>
            ) : (
              `Iniciar Upload (${pendingFiles.filter(f => !f.uploaded).length})`
            )}
          </button>
        )}

        {allUploaded && !hasErrors && (
          <div className="text-center py-2">
            <p className="text-sm text-green-600 font-medium">Todos os arquivos foram enviados!</p>
          </div>
        )}
      </div>
    </div>
  );
}