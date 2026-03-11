import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
    const [, proof, year] = parts;
    if (!['AD', 'AP'].includes(proof.toUpperCase())) return 'Prova: AD ou AP';
    if (!/^\d{4}$/.test(year)) return 'Ano: 4 dígitos';
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

  const removeFile = (id: string) => {
    setPendingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const uploadFile = async (pendingFile: PendingFile) => {
    if (!user) return;

    setPendingFiles((prev) =>
      prev.map((f) => (f.id === pendingFile.id ? { ...f, uploading: true } : f))
    );

    try {
      const timestamp = Date.now();
      const storagePath = `materials/${folderId}/${timestamp}-${pendingFile.file.name}`;
      const storageRef = ref(storage, storagePath);

      // Upload para o Firebase
      await uploadBytes(storageRef, pendingFile.file);
      const downloadURL = await getDownloadURL(storageRef);

      // Salva metadados no Supabase (usamos a URL do Firebase no campo file_path)
      const { error: dbError } = await supabase.from('files').insert({
        folder_id: folderId,
        name: pendingFile.name,
        file_path: downloadURL, // Agora guardamos a URL direta ou o path do Firebase
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
      toast.error(`Erro ao enviar ${pendingFile.name}`);
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
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">Enviar Arquivos (Firebase)</h3>
        <p className="text-sm text-gray-600">Pasta: {disciplineName}</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
        <div className="flex gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">Padrão de nomenclatura:</p>
            <p>DISCIPLINA_PROVA_ANO</p>
          </div>
        </div>
      </div>

      {pendingFiles.length === 0 ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); addFiles(Array.from(e.dataTransfer.files)); }}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition cursor-pointer ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-700 font-medium mb-1">Arraste arquivos aqui ou clique</p>
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
            <div key={file.id} className={`border rounded-lg p-3 space-y-2 ${file.validationError ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.file.size / 1024).toFixed(2)} KB</p>
                </div>
                {!file.uploading && (
                  <button onClick={() => removeFile(file.id)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              {file.uploading && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Loader className="w-4 h-4 animate-spin" />
                  Enviando para o Firebase...
                </div>
              )}
            </div>
          ))}
          <button
            onClick={uploadAll}
            disabled={pendingFiles.some((f) => f.uploading) || pendingFiles.every((f) => f.validationError)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
          >
            Enviar Todos
          </button>
        </div>
      )}
    </div>
  );
}