interface FileUploadProps {
  folderId: string;
  disciplineName: string;
  onUploadSuccess: () => void;
}

export default function FileUpload({ folderId, disciplineName, onUploadSuccess }: FileUploadProps) {
  const handleUpload = () => {
    // Placeholder implementation - in a real app this would handle file upload
    alert(`Uploading to ${disciplineName} (folder: ${folderId})`);
    onUploadSuccess();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 16l5-5m0 0l5 5m-5-5v12m0 0l-5 5m5-5V9" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Enviar Materiais para {disciplineName}</h3>
          <p className="text-sm text-gray-500">Selecione arquivos PDF, imagens ou documentos</p>
        </div>
      </div>
      
      <div className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-gray-50 transition">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mx-auto mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4a2 2 0 012-2h6.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V18a2 2 0 01-2 2h-5l-5 5v-3z" />
        </svg>
        <p className="text-sm font-bold text-gray-600">Arraste arquivos aqui ou clique para selecionar</p>
        <p className="text-xs text-gray-400 mt-1">PDF, Imagens, Documentos</p>
      </div>
      
      <div className="mt-4">
        <button 
          onClick={handleUpload}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          Iniciar Upload
        </button>
      </div>
    </div>
  );
}