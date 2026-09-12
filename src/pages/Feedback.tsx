import { useState, useRef } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X } from 'lucide-react';

export function Feedback() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'bug' | 'suggestion'>('suggestion');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

      toast({ title: 'Feedback enviado com sucesso!' });
      setTitle('');
      setDescription('');
      setFiles([]);
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro ao enviar feedback', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Reportar Erro ou Dar Sugestão</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value as 'bug' | 'suggestion')}
              className="w-full p-2 border rounded"
            >
              <option value="suggestion">Sugestão</option>
              <option value="bug">Erro (Bug)</option>
            </select>
            <Input 
              placeholder="Título" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required 
            />
            <Textarea 
              placeholder="Descreva o problema ou sugestão detalhadamente..." 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              required 
            />
            <div>
              <Button type="button" onClick={() => fileInputRef.current?.click()} variant="outline">
                <Upload className="mr-2 h-4 w-4" /> Anexar Imagens
              </Button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                multiple 
                accept="image/*" 
                className="hidden" 
              />
              <div className="mt-2 text-sm text-gray-500">
                {files.map(f => <div key={f.name}>{f.name}</div>)}
              </div>
            </div>
            <Button disabled={loading} className="w-full">
              {loading ? <Loader2 className="animate-spin" /> : 'Enviar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
