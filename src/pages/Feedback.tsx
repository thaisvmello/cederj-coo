import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Upload } from 'lucide-react';

export function Feedback() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'bug' | 'suggestion'>('suggestion');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const attachmentUrls: string[] = [];

      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { data, error } = await supabase.storage
          .from('feedback-attachments')
          .upload(fileName, file);

        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
          .from('feedback-attachments')
          .getPublicUrl(data.path);
        
        attachmentUrls.push(publicUrl);
      }

      const { error } = await supabase.from('feedback_reports').insert({
        user_id: user.id,
        title,
        description,
        type,
        attachments: attachmentUrls
      });

      if (error) throw error;

      alert('Feedback enviado com sucesso!');
      setTitle('');
      setDescription('');
      setFiles([]);
    } catch (error) {
      console.error(error);
      alert('Erro ao enviar feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Reportar Erro ou Dar Sugestão</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Feedback</label>
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value as 'bug' | 'suggestion')}
              className="w-full p-2 border rounded"
            >
              <option value="suggestion">Sugestão</option>
              <option value="bug">Erro (Bug)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Título</label>
            <input 
              type="text"
              placeholder="Título" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              className="w-full p-2 border rounded"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Descrição</label>
            <textarea 
              placeholder="Descreva o problema ou sugestão detalhadamente..." 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              className="w-full p-2 border rounded h-32"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Anexos</label>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              multiple 
              accept="image/*" 
              className="hidden" 
            />
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 flex items-center"
            >
              <Upload className="mr-2 h-4 w-4" /> Anexar Imagens
            </button>
            <div className="mt-2 text-sm text-gray-500">
              {files.map(f => <div key={f.name}>{f.name}</div>)}
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Enviar'}
          </button>
        </form>
      </div>
    </div>
  );
}
