import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Star, Clock } from 'lucide-react';
import type { Folder } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';

interface QuickAccessBarProps {
  onSelectFolder: (folder: Folder) => void;
  selectedFolderId?: string;
}

export function QuickAccessBar({ onSelectFolder, selectedFolderId }: QuickAccessBarProps) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Folder[]>([]);
  const [recentFolders, setRecentFolders] = useState<Folder[]>([]);
  const [showFavorites, setShowFavorites] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadQuickAccess();
    }
  }, [user]);

  const loadQuickAccess = async () => {
    if (!user) return;

    setLoading(true);

    // Load favorite folders
    const { data: favData } = await supabase
      .from('folder_favorites')
      .select('folder_id')
      .eq('user_id', user.id);

    if (favData) {
      const favoriteIds = favData.map((f) => f.folder_id);
      const { data: folderData } = await supabase
        .from('folders')
        .select('*')
        .in('id', favoriteIds)
        .order('name');

      setFavorites(folderData || []);
    }

    // Load recently accessed folders
    const { data: accessData } = await supabase
      .from('folder_access')
      .select('folder_id')
      .eq('user_id', user.id)
      .order('accessed_at', { ascending: false })
      .limit(5);

    if (accessData) {
      const recentIds = accessData.map((a) => a.folder_id);
      const { data: folderData } = await supabase
        .from('folders')
        .select('*')
        .in('id', recentIds)
        .order('name');

      setRecentFolders(folderData || []);
    }

    setLoading(false);
  };

  const handleSelectFolder = (folder: Folder) => {
    if (user) {
      // Register access
      supabase.from('folder_access').insert({
        user_id: user.id,
        folder_id: folder.id,
        accessed_at: new Date().toISOString(),
      }).then(() => {
        loadQuickAccess();
      });
    }
    onSelectFolder(folder);
  };

  if (loading) {
    return (
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3">
        <p className="text-sm text-gray-500">Carregando acesso rápido...</p>
      </div>
    );
  }

  const displayFolders = showFavorites ? favorites : recentFolders;

  return (
    <div className="bg-white border-b border-gray-200 sticky top-[73px] z-30">
      <div className="px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center gap-4 overflow-x-auto pb-2">
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition whitespace-nowrap text-sm font-medium ${
              showFavorites
                ? 'bg-blue-100 text-blue-900'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <Star className="w-4 h-4" />
            Favoritos ({favorites.length})
          </button>

          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition whitespace-nowrap text-sm font-medium ${
              !showFavorites
                ? 'bg-blue-100 text-blue-900'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            Recentes
          </button>

          <div className="w-px h-6 bg-gray-300" />

          {displayFolders.length > 0 ? (
            displayFolders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => handleSelectFolder(folder)}
                className={`px-3 py-2 rounded-lg transition whitespace-nowrap text-sm font-medium ${
                  selectedFolderId === folder.id
                    ? 'bg-blue-100 text-blue-900'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
                title={folder.name}
              >
                {folder.name.length > 20
                  ? folder.name.substring(0, 20) + '...'
                  : folder.name}
              </button>
            ))
          ) : (
            <p className="text-sm text-gray-500">
              {showFavorites ? 'Nenhuma pasta favorita' : 'Nenhum acesso recente'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
