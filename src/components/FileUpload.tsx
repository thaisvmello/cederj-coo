"use client";

import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, X, Loader, Check } from 'lucide-react';
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

export default function FileUpload({ folderId, disciplineName, onUploadSuccess }: FileUploadProps) {
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

  const uploadFile = async (pendingFile: PendingFile) => {
    if (!user) return;

    setPendingFiles((prev) =>
      prev.map((f) => (f.id === pendingFile.id ? { ...f, uploading: true } : f))
    );

    try {
      const { data, error: funcError } = await supabase.functions.invoke('get-r2-upload-url', {
        body: { fileName: pendingFile.name, folderId },
      });

      if (funcError || !data?.uploadUrl) {
        throw new Error(funcError?.message || 'Erro ao obter URL de upload');
      }

      const uploadRes = await fetch(data.uploadUrl, {
        method: 'PUT',
        body: pendingFile.file,
        headers: { 'Content-Type': pendingFile.file.type },
      });

      if (!uploadRes.ok) throw new Error('Falha no envio');

      const { error: dbError } = await supabase.from('files').insert({
        folder_id: folderId,
        name: pendingFile.name,
        file_path: data.publicUrl,
        file_size: pendingFile.file.size,
        file_type: pendingFile.file.type,
        uploaded_by: user.id,
      });

      if (dbError) throw dbError;

      setPendingFiles((prev) => prev.filter((f) => f.id !== pendingFile.id));
      toast.success(`${pendingFile.name} enviado!`);
      onUploadSuccess();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro no upload';
      toast.error(msg);
      setPendingFiles((prev) =>
        prev.map((f) => (f.id === pendingFile.id ? { ...f, uploading: false, error: msg } : f))
      );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Upload className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-bold">Enviar para {disciplineName}</h3>
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
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); addFiles(Array.from(e.dataTransfer.files)); }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-400'
        }`}
      >
        <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
        <p className="text-sm font-bold text-gray-600">Clique ou arraste arquivos aqui</p>
      </div>

      {pendingFiles.length > 0 && (
        <div className="space-y-2">
          {pendingFiles.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-xs truncate">{file.name}</span>
              <button 
                onClick={() => uploadFile(file)}
                disabled={file.uploading}
                className="text-blue-600 text-xs font-bold"
              >
                {file.uploading ? <Loader className="w-3 h-3 animate-spin" /> : 'Enviar'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}