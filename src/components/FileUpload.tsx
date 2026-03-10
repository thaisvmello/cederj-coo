import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, X, Loader, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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
  validationError?: string;
}

export function FileUpload({ folderId, disciplineName, onUploadSuccess }: FileUploadProps) {
  const { user } = useAuth();
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFileName = (fileName: string): string | null => {
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
    const parts = nameWithoutExt.split('_');

    if (parts.length !== 3) {
      return 'Formato: DISCIPLINA_PROVA_ANO';
    }

    const [, proof, year] = parts;

    if (!['AD', 'AP'].includes(proof.toUpperCase())) {
      return 'Prova: AD ou AP';
    }

    if (!/^\d{4}$/.test(year)) {
      return 'Ano: 4 dígitos';
    }

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

  const updateDescription = (id: string, description: string) => {
    setPendingFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, description } : f))
    );
  };

  const removeFile = (id: string) => {
    setPendingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const uploadFile = async (pendingFile: PendingFile) => {
    if (!user) return;

    setPendingFiles((prev) =>
      prev.map((f) =>
        f.id === pendingFile.id ? { ...f, uploading: true } : f
      )
    );

    try {
      const timestamp = Date.now();
      const filename = `${folderId}/${timestamp}-${pendingFile.file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('course-materials')
        .upload(filename, pendingFile.file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from('files').insert({
        folder_id: folderId,
        name: pendingFile.name,
        file_path: filename,
        file_size: pendingFile.file.size,
        file_type: pendingFile.file.type,
        description: pendingFile.description || null,
        uploaded_by: user.id,
      });

      if (dbError) throw dbError;

      removeFile(pendingFile.id);
      onUploadSuccess();
    } catch (error) {
      console.error('Upload error:', error);
      alert('Erro ao fazer upload do arquivo');
    }
  };

  const uploadAll = async () => {
    for (const file of pendingFiles) {
      if (!file.uploading && !file.validationError) {
        await uploadFile(file);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">Enviar Arquivos</h3>
        <p className="text-sm text-gray-600">Pasta: {disciplineName}</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
        <div className="flex gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">Padrão de nomenclatura:</p>
            <p>DISCIPLINA_PROVA_ANO</p>
            <p className="text-xs mt-1">Ex: ContabilidadeBasica_AD_2024</p>
          </div>
        </div>
      </div>

      {pendingFiles.length === 0 ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition cursor-pointer ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-700 font-medium mb-1">
            Arraste arquivos aqui ou clique
          </p>
          <p className="text-sm text-gray-500">Suporte para PDFs e documentos</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => addFiles(Array.from(e.target.files || []))}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {pendingFiles.map((file) => (
            <div
              key={file.id}
              className={`border rounded-lg p-3 space-y-2 ${
                file.validationError
                  ? 'border-red-200 bg-red-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                {!file.uploading && (
                  <button
                    onClick={() => removeFile(file.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {file.validationError && (
                <div className="text-xs text-red-700 font-medium">
                  {file.validationError}
                </div>
              )}

              <input
                type="text"
                placeholder="Descrição (opcional)"
                value={file.description}
                onChange={(e) => updateDescription(file.id, e.target.value)}
                disabled={file.uploading || !!file.validationError}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100"
              />

              {file.uploading && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Loader className="w-4 h-4 animate-spin" />
                  Enviando...
                </div>
              )}
            </div>
          ))}

          <button
            onClick={uploadAll}
            disabled={
              pendingFiles.some((f) => f.uploading) ||
              pendingFiles.every((f) => f.validationError)
            }
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
          >
            Enviar Todos
          </button>
        </div>
      )}
    </div>
  );
}
