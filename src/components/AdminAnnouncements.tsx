import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter, Button, Input, Textarea, Label, FormControl, FormHelperText, Table, TableHead, TableBody, TableRow, TableCell, Badge } from '@/components/ui';
import { Bell, X, CheckCircle, AlertTriangle } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

export const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('type', 'announcement')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching announcements:', error);
      } else {
        setAnnouncements(data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const sendAnnouncement = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    try {
      const { data: users, error } = await supabase
        .from('auth.users')
        .select('id');

      if (error) throw error;

      const notifications = users.map((user: any) => ({
        user_id: user.id,
        title,
        content,
        type: 'announcement' as const,
        is_read: false
      }));

      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (insertError) throw insertError;

      setTitle('');
      setContent('');
      setShowCreate(false);
      fetchAnnouncements();
      
      // Send real-time notification to all users
      const channel = supabase.channel('global_announcement');
      channel.publish('announcement', { title, content });
    } catch (error) {
      console.error('Error sending announcement:', error);
      alert('Erro ao enviar anúncio. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('notifications')
        .eq('type', 'announcement')
        .update({ is_read: true });

      if (error) {
        console.error('Error marking announcements as read:', error);
      } else {
        fetchAnnouncements();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Anúncios</h2>
        <Button
          onClick={() => setShowCreate(true)}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Novo Anúncio
        </Button>
      </div>

      <Dialog open={showCreate} onClose={() => setShowCreate(false)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogTitle>Novo Anúncio</DialogTitle>
          <DialogDescription>
            <FormControl className="mb-4">
              <Label htmlFor="title" className="text-sm font-medium text-gray-700 mb-1">
                Título
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título do anúncio..."
                required
              />
            </FormControl>
            
            <FormControl className="mb-4">
              <Label htmlFor="content" className="text-sm font-medium text-gray-700 mb-1">
                Conteúdo
              </Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Conteúdo do anúncio..."
                required
                className="min-h-[100px]"
              />
            </FormControl>
          </DialogDescription>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreate(false)}
              className="mr-2"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={sendAnnouncement}
              disabled={!title.trim() || !content.trim() || loading}
              loading={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Enviar Anúncio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell className="font-medium">Título</TableCell>
              <TableCell className="font-medium">Conteúdo</TableCell>
              <TableCell className="font-medium">Data</TableCell>
              <TableCell className="font-medium">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {announcements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                  Nenhuma anúncio enviado
                </TableCell>
              </TableRow>
            ) : (
              announcements.map((announcement) => (
                <TableRow key={announcement.id}>
                  <TableCell className="font-medium">{announcement.title}</TableCell>
                  <TableCell className="text-sm text-gray-600 line-clamp-2">
                    {announcement.content}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(announcement.created_at).toLocaleString('pt-BR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={announcement.is_read ? 'default' : 'secondary'}>
                      {announcement.is_read ? 'Lido' : 'Não lido'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {announcements.length > 0 && (
        <div className="flex justify-between">
          <Button
            onClick={markAllAsRead}
            disabled={loading}
            className="text-sm"
          >
            Marcar todos como lidos
          </Button>
          <span className="text-sm text-gray-500">
            {announcements.length} anúncios
          </span>
        </div>
      )}
    </div>
  );
};