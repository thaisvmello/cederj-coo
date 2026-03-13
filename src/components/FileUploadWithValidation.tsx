import { useState, useRef } from 'react';
import { Upload, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { useFileValidation } from '../hooks/useFileValidation';
import { FileUpload } from './FileUpload';
import toast from 'react-hot-toast';

interface FileUploadWithValidationProps {
  folderId: string;
  disciplineName: string;
  onUploadSuccess: () => void;
}

export function FileUploadWithValidation({ folderId, disciplineName, onUploadSuccess }: FileUploadWithValidationProps) {
  const { checkDuplicates } = useFileValidation();
  const [validatedFiles, setValidatedFiles] = useState<File[]>([]);
  const [duplicateFiles, setDuplicateFiles] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = async (files: File[]) => {
    setIsValidating(true);
    setDuplicateFiles([]);

    const filesToCheck = files.map(f => ({ name: f.name, size: f.size }));
    const duplicates = await checkDuplicates(folderId, filesToCheck);

    if (duplicates.length > 0) {
      setDuplicateFiles(duplicates);
      const uniqueFiles = files.filter(f => !duplicates.includes(f.name));
      setValidatedFiles(uniqueFiles);
      
      if (uniqueFiles.length === 0) {
        toast.error('Todos os arquivos já existem nesta pasta!');
        setIsValidating(false);
        return;
      }
      
      toast.error(`${duplicates.length} arquivo(s) duplicado(s) ignorado(s)`);
    } else {
      setValidatedFiles(files);
    }

    setIsValidating(false);
    setShowUploader(true);
  };

  const addFiles = (files: FileList | File[]) => {
    handleFilesSelected(Array.from(files));
  };

  if (showUploader && validatedFiles.length > 0) {
    return (
      <div className="space-y-3">
        {duplicateFiles.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800">Arquivos duplicados ignorados:</p>
                <ul className="mt-1 space-y-1">
                  {duplicateFiles.map(name => (
                    <li key={name} className="text-xs text-amber-700">• {name}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
        <FileUpload 
          folderId={folderId}
          disciplineName={disciplineName}
          onUploadSuccess={() => {
            setShowUploader(false);
            setValidatedFiles([]);
            setDuplicateFiles([]);
            onUploadSuccess();
          }}
        />
        <button
          onClick={() => {
            setShowUploader(false);
            setValidatedFiles([]);
            setDuplicateFiles([]);
          }}
          className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition"
        >
          Cancelar
        </button>
      </div>
    );
  }

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

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { 
          e.preventDefault(); 
          setIsDragging(false); 
          addFiles(e.dataTransfer.files);
        }}
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
        } ${isValidating ? 'opacity-50 pointer-events-none' : ''}`}
        onClick={() => !isValidating && fileInputRef.current?.click()}
      >
        {isValidating ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Verificando arquivos...</p>
          </div>
        ) : (
          <>
            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-semibold">Arraste arquivos ou clique para selecionar</p>
            <p className="text-xs text-gray-400 mt-2">Arquivos duplicados serão automaticamente ignorados</p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => e.target.files && addFiles(e.target.files)}
          className="hidden"
        />
      </div>
    </div>
  );
}