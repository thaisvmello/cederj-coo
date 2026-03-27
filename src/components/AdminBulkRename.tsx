import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { RefreshCw, Play, CheckCircle, AlertCircle, Loader, Folder, Search, CheckSquare, Square, Edit3 } from 'lucide-react';
import { abbreviateDiscipline } from '../lib/utils';
import toast from 'react-hot-toast';

interface FolderWithCourse {
  id: string;
  name: string;
  course_name: string;
  suggested_prefix: string;
  selected: boolean;
  custom_prefix: string;
  file_count: number;
}

export function AdminBulkRename() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [folders, setFolders] = useState<FolderWithCourse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<{ success: number; skipped: number; error: number } | null>(null);

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    setFetching(true);
    try {
      const { data: coursesData } = await supabase.from('courses').select('id, name');
      const { data: foldersData } = await supabase.from('folders').select('id, name, course_id');
      const { data: filesData } = await supabase.from('files').select('folder_id');

      if (coursesData && foldersData) {
        const formatted = foldersData.map(f => {
          const course = coursesData.find(c => c.id === f.course_id);
          const courseName = course?.name || 'Sem Disciplina';
          const suggested = abbreviateDiscipline(courseName);
          const count = filesData?.filter(file => file.folder_id === f.id).length || 0;
          
          return {
            id: f.id,
            name: f.name,
            course_name: courseName,
            suggested_prefix: suggested,
            custom_prefix: suggested ? `${suggested}_` : '',
            selected: false,
            file_count: count
          };
        });
        setFolders(formatted);
      }
    } catch (err) {
      console.error('Erro ao carregar pastas:', err);
      toast.error('Erro ao carregar pastas');
    } finally {
      setFetching(false);
    }
  };

  const filteredFolders = useMemo(() => {
    return folders.filter(f => 
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.course_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [folders, searchQuery]);

  const toggleSelect = (id: string) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, selected: !f.selected } : f));
  };

  const toggleSelectAll = () => {
    const allSelected = filteredFolders.every(f => f.selected);
    setFolders(prev => prev.map(f => {
      if (filteredFolders.some(ff => ff.id === f.id)) {
        return { ...f, selected: !allSelected };
      }
      return f;
    }));
  };

  const updatePrefix = (id: string, value: string) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, custom_prefix: value } : f));
  };

  const handleBulkRename = async () => {
    const selectedFolders = folders.filter(f => f.selected && f.file_count > 0);
    if (selectedFolders.length === 0) {
      toast.error('Selecione pelo menos uma pasta com arquivos');
      return;
    }

    if (!confirm(`Isso irá renomear os arquivos das ${selectedFolders.length} pastas selecionadas. Deseja continuar?`)) {
      return;
    }

    setLoading(true);
    setResults(null);
    let success = 0;
    let skipped = 0;
    let error = 0;

    try {
      const folderIds = selectedFolders.map(f => f.id);
      const { data: files, error: filesError } = await supabase
        .from('files')
        .select('id, name, folder_id')
        .in('folder_id', folderIds);

      if (filesError) throw filesError;
      if (!files || files.length === 0) {
        toast.error('Nenhum arquivo encontrado nas pastas selecionadas');
        setLoading(false);
        return;
      }

      setProgress({ current: 0, total: files.length });

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const folderConfig = selectedFolders.find(f => f.id === file.folder_id);
        
        if (folderConfig && folderConfig.custom_prefix) {
          const prefix = folderConfig.custom_prefix;

          if (file.name.startsWith(prefix)) {
            skipped++;
          } else {
            const newName = `${prefix}${file.name}`;
            
            const { error: updateError } = await supabase
              .from('files')
              .update({ name: newName })
              .eq('id', file.id);

            if (updateError) {
              console.error(`Erro ao renomear ${file.name}:`, updateError);
              error++;
            } else {
              success++;
            }
          }
        } else {
          skipped++; // Pasta não selecionada ou sem prefixo customizado
        }

        setProgress(prev => ({ ...prev, current: i + 1 }));
      }

      setResults({ success, skipped, error });
      toast.success('Processo de renomeação concluído!');
    } catch (err: any) {
      console.error('Erro no bulk rename:', err);
      toast.error(err.message || 'Erro ao processar renomeação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-indigo-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-indigo-800">Manutenção: Padronização de Nomes de Arquivos</h3>
        </div>
        <button onClick={loadFolders} className="p-2 hover:bg-indigo-100 rounded-lg transition text-indigo-600" title="Recarregar pastas">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
          <p className="text-sm text-indigo-900 leading-relaxed">
            Selecione as pastas e defina um prefixo customizado (ex: <code>CONTAB_</code>) para renomear os arquivos.
            O prefixo sugerido será baseado no nome da disciplina.
          </p>
        </div>

        {/* Barra de Busca e Seleção */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar pasta ou disciplina..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition shadow-sm"
            />
          </div>
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition shadow-sm"
          >
            {filteredFolders.every(f => f.selected) ? <Square className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
            {filteredFolders.every(f => f.selected) ? 'Desmarcar todos' : 'Selecionar todos'}
          </button>
        </div>

        {fetching ? (
          <div className="p-8 flex justify-center">
            <Loader className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : filteredFolders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Nenhuma pasta encontrada</div>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3"></th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Pasta</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Disciplina</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Arquivos</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Prefixo Sugerido</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Prefixo Customizado</th>
                </tr>
              </thead>
              <tbody>
                {filteredFolders.map((folder) => (
                  <tr key={folder.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={folder.selected}
                        onChange={() => toggleSelect(folder.id)}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded disabled:opacity-50"
                        disabled={folder.file_count === 0}
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{folder.name}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm text-gray-500">{folder.course_name}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm text-gray-500">{folder.file_count}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm text-gray-400 font-mono">{folder.suggested_prefix}</span>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={folder.custom_prefix}
                        onChange={(e) => updatePrefix(folder.id, e.target.value)}
                        placeholder="Ex: CONTAB_"
                        className="w-full px-3 py-1.5 border border-indigo-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        disabled={!folder.selected || folder.file_count === 0}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Botão de Execução */}
        {!loading && !results && filteredFolders.length > 0 && (
          <button
            onClick={handleBulkRename}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
          >
            <Play className="w-5 h-5" />
            Renomear Arquivos Selecionados
          </button>
        )}

        {/* Resultados */}
        {loading && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm font-bold text-gray-600">
              <span>Processando arquivos...</span>
              <span>{progress.current} / {progress.total}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-indigo-600 h-full transition-all duration-300" 
                style={{ width: `${(progress.total > 0 ? (progress.current / progress.total) * 100 : 0)}%` }}
              />
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 animate-pulse">
              <Loader className="w-3 h-3 animate-spin" />
              Aguarde a conclusão...
            </div>
          </div>
        )}

        {results && (
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
              <CheckCircle className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
              <p className="text-xl font-bold text-emerald-700">{results.success}</p>
              <p className="text-[10px] text-emerald-600 font-bold uppercase">Renomeados</p>
            </div>
            <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-center">
              <FileText className="w-5 h-5 text-gray-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-gray-600">{results.skipped}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Mantidos</p>
            </div>
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-center">
              <AlertCircle className="w-5 h-5 text-red-600 mx-auto mb-2" />
              <p className="text-xl font-bold text-red-700">{results.error}</p>
              <p className="text-[10px] text-red-600 font-bold uppercase">Erros</p>
            </div>
            <button 
              onClick={() => setResults(null)}
              className="col-span-3 mt-2 text-xs text-indigo-600 font-bold hover:underline"
            >
              Limpar resultados e voltar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}