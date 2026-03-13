import { useState, useRef } from 'react';
import { Upload, X, AlertTriangle, CheckCircle, FileText, Loader } from 'lucide-react';
import { useFileValidation } from '../hooks/useFileValidation';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface FileUploadWithValidationProps {
  folderId: string;
  disciplineName: string;
  onUploadSuccess: () => void;
}

interface FileItem {
  id: string;
  file: File;
  isDuplicate: boolean;
  uploading: boolean;
  uploaded: boolean;
  error?: string;
}

export function FileUploadWithValidation({ folderId, disciplineName, onUploadSuccess }: FileUploadWithValidationProps) {
  const { user } = useAuth();
  const { checkDuplicates } = useFileValidation();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const handleFilesSelected = async (selectedFiles: FileList | File[]) => {
    const newFiles = Array.from(selectedFiles);
    
    // Adicionar arquivos imediatamente
    const newFileItems: FileItem[] = newFiles.map(file => ({
      id: generateId(),
      file,
      isDuplicate: false,
      uploading: false,
      uploaded: false
    }));
    
    setFiles(prev => [...prev, ...newFileItems]);
    setIsValidating(true);

    // Verificar duplicatas
    const filesToCheck = newFiles.map(f => ({ name: f.name, size: f.size }));
    const duplicates = await checkDuplicates(folderId, filesToCheck);

    // Atualizar status
    setFiles(prev => prev.map(item => {
      const isNewFile = newFileItems.some(nf => nf.id === item.id);
      if (isNewFile && duplicates.includes(item.file.name)) {
        return { ...item, isDuplicate: true };
      }
      return item;
    }));

    setIsValidating(false);

    if (duplicates.length > 0) {
      toast.error(`${duplicates.length} arquivo(s) duplicado(s) detectado(s)`);
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearAll = () => {
    setFiles([]);
  };

  const uploadSingleFile = async (fileItem: FileItem): Promise<boolean> => {
    if (!user) return false;

    setFiles(prev =>
      prev.map(f => (f.id === fileItem.id ? { ...f, uploading: true, error: undefined } : f))
    );

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const anonKey = (supabase as any).supabaseKey;
      
      if (!session) throw new Error('Sessão expirada');

      const functionUrl = `https://tlcdhwjkdbrmrwueeokj.supabase.co/functions/v1/get-r2-upload-url`;
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': anonKey,
        },
        body: JSON.stringify({
          fileName: fileItem.file.name,
          fileType: fileItem.file.type,
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
        body: fileItem.file,
        headers: { 'Content-Type': fileItem.file.type }
      });

      if (!uploadRes.ok) {
        throw new Error(`Falha no upload (${uploadRes.status})`);
      }

      const { error: dbError } = await supabase.from('files').insert({
        folder_id: folderId,
        name: fileItem.file.name,
        file_path: data.publicUrl,
        file_size: fileItem.file.size,
        file_type: fileItem.file.type,
        uploaded_by: user.id,
      });

      if (dbError) throw dbError;

      setFiles(prev =>
        prev.map(f => (f.id === fileItem.id ? { ...f, uploading: false, uploaded: true } : f))
      );
      
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      
      setFiles(prev =>
        prev.map(f => (f.id === fileItem.id ? { ...f, uploading: false, error: msg } : f))
      );
      
      return false;
    }
  };

  const uploadAll = async () => {
    const filesToUpload = files.filter(f => !f.isDuplicate && !f.uploading && !f.uploaded);
    if (filesToUpload.length === 0) return;

    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const file of filesToUpload) {
      const success = await uploadSingleFile(file);
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    setIsUploading(false);

    if (errorCount === 0) {
      toast.success(`${successCount} arquivo(s) enviado(s) com sucesso!`);
      setTimeout(() => {
        clearAll();
        onUploadSuccess();
      }, 1000);
    } else if (successCount > 0) {
      toast.success(`${successCount} enviado(s), ${errorCount} com erro`);
    } else {
      toast.error('Erro ao enviar arquivos');
    }
  };

  const validFiles = files.filter(f => !f.isDuplicate);
  const duplicateFiles = files.filter(f => f.isDuplicate);
  const pendingUpload = validFiles.filter(f => !f.uploaded);
  const allUploaded = validFiles.length > 0 && validFiles.every(f => f.uploaded);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900">Upload de Arquivos</h3>
          <p className="text-xs text-gray-500">Destino: {disciplineName}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
          <CheckCircle className="w-3.5 h-3.5" />
          Verificação automática
        </div>
      </div>

      {/* Área de drop */}
      <div
        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-blue-500', 'bg-blue-50'); }}
        onDragLeave={(e) => { e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50'); }}
        onDrop={(e) => { 
          e.preventDefault(); 
          e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
          if (e.dataTransfer.files.length > 0) {
            handleFilesSelected(e.dataTransfer.files);
          }
        }}
        className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center transition-all cursor-pointer hover:border-blue-400 hover:bg-gray-50"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 font-semibold">
          {files.length > 0 ? 'Adicionar mais arquivos' : 'Arraste arquivos ou clique para selecionar'}
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Você pode selecionar múltiplos arquivos de uma vez
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFilesSelected(e.target.files);
              e.target.value = '';
            }
          }}
          className="hidden"
        />
      </div>

      {/* Lista de arquivos */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {files.length} arquivo(s) selecionado(s)
            </span>
            {!isUploading && (
              <button
                onClick={clearAll}
                className="text-xs text-gray-400 hover:text-red-500 transition"
              >
                Limpar todos
              </button>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {files.map((item) => (
              <div 
                key={item.id} 
                className={`p-3 rounded-lg border flex items-center justify-between ${
                  item.error 
                    ? 'bg-red-50 border-red-200' 
                    : item.uploaded
                    ? 'bg-green-50 border-green-200'
                    : item.isDuplicate
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <FileText className={`w-4 h-4 shrink-0 ${
                    item.error ? 'text-red-400' 
                    : item.uploaded ? 'text-green-500'
                    : item.isDuplicate ? 'text-amber-500'
                    : 'text-blue-500'
                  }`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.file.name}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {(item.file.size / 1024).toFixed(1)} KB
                      {item.isDuplicate && (
                        <span className="text-amber-600 font-semibold ml-2">• Já existe</span>
                      )}
                      {item.uploaded && (
                        <span className="text-green-600 font-semibold ml-2">• Enviado</span>
                      )}
                      {item.error && (
                        <span className="text-red-600 font-semibold ml-2">• Erro</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.uploading && <Loader className="w-4 h-4 text-blue-500 animate-spin" />}
                  {!item.uploading && !item.uploaded && (
                    <button 
                      onClick={() => removeFile(item.id)} 
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Resumo e botão */}
          {!allUploaded && (
            <div className="pt-3 border-t border-gray-100 space-y-3">
              {duplicateFiles.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{duplicateFiles.length} arquivo(s) duplicado(s) serão ignorados</span>
                </div>
              )}
              
              <button
                onClick={uploadAll}
                disabled={pendingUpload.length === 0 || isUploading || isValidating}
                className="w-full py-3 bg-[#0f172a] text-white rounded-xl font-bold text-sm hover:bg-[#1e293b] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isValidating ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Verificando arquivos...
                  </>
                ) : isUploading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : pendingUpload.length === 0 ? (
                  'Nenhum arquivo para enviar'
                ) : (
                  `Enviar ${pendingUpload.length} arquivo(s)`
                )}
              </button>
            </div>
          )}

          {allUploaded && (
            <div className="text-center py-2 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 font-medium">✓ Todos os arquivos foram enviados!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}