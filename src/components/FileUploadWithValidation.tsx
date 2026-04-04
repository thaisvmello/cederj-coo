"use client";

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader, AlertCircle, FileText, Upload, X, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFileValidation } from '../hooks/useFileValidation';
import { FolderWarningBanner } from './FolderWarningBanner';
import toast from 'react-hot-toast';
import { formatFileName } from '../lib/utils';

interface FileUploadWithValidationProps {
  folderId: string;
  folderName: string;
  disciplineName: string;
  onUploadSuccess: () => void;
}

interface PendingFile {
  id: string;
  name: string;
  file: File;
  uploading: boolean;
  uploaded: boolean;
  isDuplicate: boolean;
  isImage: boolean;
  error?: string;
}

export function FileUploadWithValidation({ folderId, folderName, disciplineName, onUploadSuccess }: FileUploadWithValidationProps) {
  const { user } = useAuth();
  const { checkDuplicates } = useFileValidation();
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const removeFile = (id: string) => {
    setPendingFiles(prev => prev.filter(f => f.id !== id));
  };

  const processFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const isADAPFolder = folderName.toUpperCase().startsWith('AD') || folderName.toUpperCase().startsWith('AP');
    const isMaterialsFolder = folderName.toUpperCase() === 'MATERIAIS';

    const newFiles: PendingFile[] = [];
    const adapRegex = /\b(AD|AP)([0-9]|_|\s|$)/i;

    Array.from(files).forEach(file => {
      const hasADAP = adapRegex.test(file.name);
      const isImage = file.type.startsWith('image/');

      if (isADAPFolder && !hasADAP) {
        toast.error(
          `O arquivo "${file.name}" não parece ser uma prova (AD ou AP). Materiais de estudo devem ser colocados na pasta 'MATERIAIS'.`,
          { duration: 6000 }
        );
        return;
      }

      if (isMaterialsFolder && hasADAP) {
        toast.error(
          `A pasta 'MATERIAIS' é para resumos e livros. Provas (AD ou AP) devem ser enviadas para suas respectivas pastas.`,
          { duration: 6000 }
        );
        return;
      }

      let suggestedName = formatFileName(disciplineName, file.name);
      if (isImage) {
        suggestedName = suggestedName.replace(/\.(png|jpg|jpeg|webp|jfif)$/i, '.pdf');
      }

      newFiles.push({
        id: Math.random().toString(36).substring(2, 9),
        name: suggestedName,
        file,
        uploading: false,
        uploaded: false,
        isDuplicate: false,
        isImage
      });
    });

    if (newFiles.length === 0) return;

    checkDuplicates(
      folderId,
      newFiles.map(f => ({ name: f.name, size: f.file.size }))
    ).then(duplicates => {
      const filesWithDuplicateCheck = newFiles.map(f => ({
        ...f,
        isDuplicate: duplicates.includes(f.name),
      }));
      setPendingFiles(prev => [...prev, ...filesWithDuplicateCheck]);
    });
  };

  const convertImageToPdf = async (imageFile: File): Promise<Blob> => {
    const { jsPDF } = await import('jspdf');
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const orientation = img.width > img.height ? 'l' : 'p';
          const pdf = new jsPDF({
            orientation,
            unit: 'px',
            format: [img.width, img.height]
          });
          
          pdf.addImage(e.target?.result as string, 'JPEG', 0, 0, img.width, img.height);
          resolve(pdf.output('blob'));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });
  };

  const uploadFile = async (pendingFile: PendingFile): Promise<boolean> => {
    if (!user) return false;

    setPendingFiles(prev =>
      prev.map(f => (f.id === pendingFile.id ? { ...f, uploading: true, error: undefined } : f))
    );

    try {
      let fileToUpload = pendingFile.file;
      let fileType = pendingFile.file.type;
      let fileName = pendingFile.name;

      if (pendingFile.isImage) {
        toast.loading(`Convertendo "${pendingFile.file.name}" para PDF...`, { id: `conv-${pendingFile.id}` });
        const pdfBlob = await convertImageToPdf(pendingFile.file);
        fileToUpload = new File([pdfBlob], fileName, { type: 'application/pdf' });
        fileType = 'application/pdf';
        toast.success(`Conversão concluída!`, { id: `conv-${pendingFile.id}` });
      }

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
          fileName: fileName,
          fileType: fileType,
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
        body: fileToUpload,
        headers: { 
          'Content-Type': fileType 
        }
      });

      if (!uploadRes.ok) {
        throw new Error(`Falha no upload para R2 (${uploadRes.status})`);
      }

      const { error: dbError } = await supabase.from('files').insert({
        folder_id: folderId,
        name: fileName,
        file_path: data.publicUrl,
        file_size: fileToUpload.size,
        file_type: fileType,
        uploaded_by: user.id,
      });

      if (dbError) throw dbError;

      setPendingFiles(prev =>
        prev.map(f => (f.id === pendingFile.id ? { ...f, uploading: false, uploaded: true } : f))
      );
      
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('[FileUploadWithValidation] Erro:', msg);
      
      setPendingFiles(prev =>
        prev.map(f => (f.id === pendingFile.id ? { ...f, uploading: false, error: msg } : f))
      );
      
      return false;
    }
  };

  const uploadAll = async () => {
    const filesToUpload = pendingFiles.filter(f => !f.uploading && !f.uploaded && !f.isDuplicate);
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const allUploaded = pendingFiles.length > 0 && pendingFiles.every(f => f.uploaded || f.isDuplicate);
  const hasErrors = pendingFiles.some(f => f.error);
  const hasDuplicates = pendingFiles.some(f => f.isDuplicate);
  const validFiles = pendingFiles.filter(f => !f.isDuplicate && !f.uploaded);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="font-bold text-gray-900">Enviar Arquivos</h3>
            <p className="text-xs text-gray-500">Destino: {disciplineName} ({folderName})</p>
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              isDragging 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}  
          >
            <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-blue-500' : 'text-gray-300'}`} />
            <p className="text-sm font-medium text-gray-700 mb-1">
              Arraste arquivos aqui ou
            </p>
            <label className="inline-block">
              <span className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold cursor-pointer hover:bg-blue-700 transition">
                Selecione do computador
              </span>
              <input
                type="file"
                multiple
                onChange={(e) => processFiles(e.target.files)}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="lg:w-1/3">
          <FolderWarningBanner />
        </div>
      </div>

      {hasDuplicates && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            Alguns arquivos já existem na pasta e foram marcados como duplicados.
          </p>
        </div>
      )}

      {pendingFiles.length > 0 && (
        <div className="space-y-3">
          <div className="max-h-60 overflow-y-auto space-y-2">
            {pendingFiles.map((file) => ( 
              <div 
                key={file.id}
                className={`p-3 rounded-lg border flex items-center justify-between ${
                  file.error
                    ? 'bg-red-50 border-red-200' 
                    : file.uploaded
                    ? 'bg-green-50 border-green-200'
                    : file.isDuplicate
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-gray-50 border-gray-100'
                }`}  
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {file.isImage ? (
                    <ImageIcon className="w-4 h-4 shrink-0 text-purple-500" />
                  ) : (
                    <FileText className={`w-4 h-4 shrink-0 ${file.error ? 'text-red-400' : file.uploaded ? 'text-green-500' : file.isDuplicate ? 'text-amber-500' : 'text-blue-500'}`} />
                  )}
                  <div className="min-w-0">
                    {!file.uploaded && !file.uploading ? (
                      <div className="flex flex-col">
                        <input
                          type="text"
                          value={file.name}
                          onChange={(e) => {
                            setPendingFiles(prev =>
                              prev.map(f => 
                                f.id === file.id 
                                  ? { ...f, name: e.target.value } 
                                  : f
                              )
                            );
                          }}
                          className="w-full px-2 py-1 border border-blue-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          autoFocus
                        />
                        {file.isImage && (
                          <span className="text-[9px] text-purple-600 font-bold uppercase mt-0.5">
                            ✨ Será convertido para PDF automaticamente
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-gray-900 truncate block">{file.name}</span>
                    )}
                    {file.isDuplicate && (
                      <span className="text-[10px] text-amber-600 font-medium">Arquivo duplicado</span>
                    )}
                    {file.error && (
                      <span className="text-[10px] text-red-600 font-medium">{file.error}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {file.uploading && <Loader className="w-4 h-4 text-blue-500 animate-spin" />}
                  {file.uploaded && <span className="text-xs text-green-600 font-medium">✓ Enviado</span>}
                  {!file.uploaded && !file.uploading && (
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!allUploaded && validFiles.length > 0 && (
            <button
              onClick={uploadAll}
              disabled={isUploading}
              className="w-full py-3 bg-[#0f172a] text-white rounded-xl font-bold text-sm hover:bg-[#1e293b] transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Processando e Enviando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Enviar {validFiles.length} arquivo(s)
                </>
              )}
            </button>
          )}

          {allUploaded && !hasErrors && (
            <div className="text-center py-2">
              <p className="text-sm text-green-600 font-medium">Todos os arquivos foram enviados!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}