"use client";

import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, X, Loader, CheckCircle } from 'lucide-react';
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

  const checkDuplicate = async (fileName: string) => {
    const { data, error } = await supabase
      .from('files')
      .select('id')
      .eq('folder_id', folderId)
      .eq('name', fileName)
      .maybeSingle();
    
    if (error) return false;
    return !!data;
  };

  const uploadFile = async (pendingFile: PendingFile) => {
    if (!user) return;

    setPendingFiles(prev => prev.map(f => (f.id === pendingFile.id ? { ...f, uploading: true } : f)));
    
    try {
      // Validação de duplicata
      const isDuplicate = await checkDuplicate(pendingFile.name);
      if (isDuplicate) {
        throw new Error('Um arquivo com este nome já existe nesta pasta.');
      }

      // 1. Obter URL de upload via Edge Function
      const { data, error: funcError } = await supabase.functions.invoke('get-r2-upload-url', {
        body: {
          fileName: pendingFile.name,
          folderId
        }
      });

      if (funcError || !data?.uploadUrl) {
        throw new Error(funcError?.message || 'Erro ao obter URL de upload');
      }

      // 2. Upload direto para o storage usando a URL assinada
      const uploadRes = await fetch(data.uploadUrl, {
        method: 'PUT',
        body: pendingFile.file,
        headers: { 
          'Content-Type': pendingFile.file.type 
        }
      });

      if (!uploadRes.ok) {
        throw new Error('Falha no envio do arquivo para o servidor de arquivos');
      }

      // 3. Registrar o arquivo no banco de dados
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

      setPendingFiles(prev => prev.filter(f => f.id !== pendingFile.id));
      toast.success(`${pendingFile.name} enviado com sucesso!`);
      onUploadSuccess();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro no upload';
      console.error('Upload error:', error);
      toast.error(msg);
      setPendingFiles(prev => prev.map(f => (f.id === pendingFile.id ? { ...f, uploading: false, error: msg } : f)));
    }
  };

  const uploadAll = async (e: React.MouseEvent) => {
    e.preventDefault();
    const filesToUpload = pendingFiles.filter(f => !f.uploading);
    if (filesToUpload.length === 0) return;

    for (const file of filesToUpload) {
      await uploadFile(file);
    }
  };

  const removePendingFile = (id: string) => {
    setPendingFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Upload className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Enviar Materiais para {disciplineName}</h3>
          <p className="text-sm text-gray-500">Selecione arquivos PDF, imagens ou documentos</p>
        </div>
      </div>

      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={(e) => addFiles(Array.from(e.target.files || []))}
        className="hidden"
      />

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { 
          e.preventDefault(); 
          setIsDragging(false); 
          addFiles(Array.from(e.dataTransfer.files)); 
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
          isDragging 
            ? 'border-blue-500 bg-blue-50 scale-[0.99]' 
            : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
        }`}
      >
        <Upload className={`w-10 h-10 mx-auto mb-3 transition-colors ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
        <p className="text-sm font-bold text-gray-600">Arraste arquivos aqui ou clique para selecionar</p>
        <p className="text-xs text-gray-400 mt-1">PDF, Imagens, Documentos</p>
      </div>

      {pendingFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Arquivos na Fila ({pendingFiles.length})</h4>
            <button 
              onClick={uploadAll}
              disabled={pendingFiles.some(f => f.uploading)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              {pendingFiles.some(f => f.uploading) ? (
                <>
                  <Loader className="w-3 h-3 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-3 h-3" />
                  Iniciar Upload
                </>
              )}
            </button>
          </div>
          
          <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar pr-2">
            {pendingFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-1.5 bg-white rounded shadow-sm">
                    <Upload className="w-3 h-3 text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-700 truncate">{file.name}</p>
                    <p className="text-[10px] text-gray-400">{(file.file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {file.error && (
                    <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded">
                      Erro: {file.error}
                    </span>
                  )}
                  {!file.uploading && (
                    <button 
                      onClick={() => removePendingFile(file.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}