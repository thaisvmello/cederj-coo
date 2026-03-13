import { useState, useRef, useEffect } from 'react';
import { Upload, X, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { useFileValidation } from '../hooks/useFileValidation';
import { FileUpload } from './FileUpload';
import toast from 'react-hot-toast';

interface FileUploadWithValidationProps {
  folderId: string;
  disciplineName: string;
  onUploadSuccess: () => void;
}

interface FileWithStatus {
  file: File;
  isDuplicate: boolean;
  isValidating: boolean;
}

export function FileUploadWithValidation({ folderId, disciplineName, onUploadSuccess }: FileUploadWithValidationProps) {
  const { checkDuplicates } = useFileValidation();
  const [filesWithStatus, setFilesWithStatus] = useState<FileWithStatus[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = async (newFiles: File[]) => {
    // Adicionar arquivos com status de validação pendente
    const filesToAdd: FileWithStatus[] = newFiles.map(file => ({
      file,
      isDuplicate: false,
      isValidating: true
    }));
    
    setFilesWithStatus(prev => [...prev, ...filesToAdd]);
    setIsValidating(true);

    // Verificar duplicatas
    const filesToCheck = newFiles.map(f => ({ name: f.name, size: f.size }));
    const duplicates = await checkDuplicates(folderId, filesToCheck);

    // Atualizar status de cada arquivo
    setFilesWithStatus(prev => prev.map(item => {
      const isNewFile = newFiles.some(f => f.name === item.file.name && f.size === item.file.size);
      if (isNewFile) {
        return {
          ...item,
          isDuplicate: duplicates.includes(item.file.name),
          isValidating: false
        };
      }
      return item;
    }));

    setIsValidating(false);

    // Mostrar aviso se houver duplicados
    if (duplicates.length > 0) {
      toast.error(`${duplicates.length} arquivo(s) já existem nesta pasta e serão ignorados`);
    }
  };

  const addFiles = (files: FileList | File[]) => {
    handleFilesSelected(Array.from(files));
  };

  const removeFile = (index: number) => {
    setFilesWithStatus(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setFilesWithStatus([]);
    setShowUploader(false);
  };

  const duplicateCount = filesWithStatus.filter(f => f.isDuplicate).length;
  const validCount = filesWithStatus.filter(f => !f.isDuplicate && !f.isValidating).length;
  const hasFiles = filesWithStatus.length > 0;

  // Se o uploader está ativo, passar apenas arquivos válidos para o FileUpload
  if (showUploader && validCount > 0) {
    const validFiles = filesWithStatus
      .filter(f => !f.isDuplicate && !f.isValidating)
      .map(f => f.file);

    return (
      <div className="space-y-3">
        {duplicateCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800">
                  {duplicateCount} arquivo(s) duplicado(s) serão ignorados
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Apenas os {validCount} arquivo(s) novo(s) serão enviados
                </p>
              </div>
            </div>
          </div>
        )}
        <FileUpload 
          folderId={folderId}
          disciplineName={disciplineName}
          onUploadSuccess={() => {
            clearAll();
            onUploadSuccess();
          }}
        />
        <button
          onClick={clearAll}
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

      {/* Área de drop */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { 
          e.preventDefault(); 
          setIsDragging(false); 
          addFiles(e.dataTransfer.files);
        }}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
        } ${isValidating ? 'opacity-75' : ''}`}
        onClick={() => !isValidating && fileInputRef.current?.click()}
      >
        <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 font-semibold">
          {hasFiles ? 'Adicionar mais arquivos' : 'Arraste arquivos ou clique para selecionar'}
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Você pode selecionar múltiplos arquivos de uma vez
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => e.target.files && addFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Lista de arquivos selecionados */}
      {hasFiles && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {filesWithStatus.length} arquivo(s) selecionado(s)
            </span>
            <button
              onClick={clearAll}
              className="text-xs text-gray-400 hover:text-red-500 transition"
            >
              Limpar todos
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {filesWithStatus.map((item, index) => (
              <div 
                key={`${item.file.name}-${index}`} 
                className={`p-3 rounded-lg border flex items-center justify-between ${
                  item.isDuplicate 
                    ? 'bg-red-50 border-red-200' 
                    : item.isValidating
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <FileText className={`w-4 h-4 shrink-0 ${
                    item.isDuplicate ? 'text-red-400' : 'text-blue-500'
                  }`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.file.name}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {(item.file.size / 1024).toFixed(1)} KB
                      {item.isDuplicate && (
                        <span className="text-red-500 font-semibold ml-2">
                          • Já existe nesta pasta
                        </span>
                      )}
                      {item.isValidating && (
                        <span className="text-blue-500 ml-2">
                          • Verificando...
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => removeFile(index)} 
                  className="text-gray-400 hover:text-red-500 p-1 shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Resumo e botão de upload */}
          <div className="pt-3 border-t border-gray-100 space-y-3">
            {duplicateCount > 0 && (
              <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{duplicateCount} arquivo(s) duplicado(s) serão ignorados</span>
              </div>
            )}
            
            <button
              onClick={() => setShowUploader(true)}
              disabled={validCount === 0 || isValidating}
              className="w-full py-3 bg-[#0f172a] text-white rounded-xl font-bold text-sm hover:bg-[#1e293b] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isValidating 
                ? 'Verificando arquivos...' 
                : validCount === 0 
                ? 'Nenhum arquivo novo para enviar'
                : `Enviar ${validCount} arquivo(s)`
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
}