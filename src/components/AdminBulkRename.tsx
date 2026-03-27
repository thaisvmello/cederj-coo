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

      // Processar cada arquivo
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const folderConfig = selectedFolders.find(f => f.id === file.folder_id);
        
        if (folderConfig && folderConfig.custom_prefix) {
          const prefix = folderConfig.custom_prefix;
          
          // Se o arquivo já começa com o prefixo, ignoramos
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
          skipped++;
        }

        setProgress(prev => ({ ...prev, current: i + 1 }));
      }

      setResults({ success, skipped, error });
      toast.success('Renomeação concluída com sucesso!');
    } catch (err: any) {
      console.error('Erro no bulk rename:', err);
      toast.error(err.message || 'Erro ao processar renomeação');
    } finally {
      setLoading(false);
    }
  };

  const handlePrefixChange = (id: string, value: string) => {
    updatePrefix(id, value);
  };

  const handleSelectAllChange = (value: boolean) => {
    toggleSelectAll();
    // Update all selected folders with the same value
    setFolders(prev => prev.map(f => {
      if (filteredFolders.some(ff => ff.id === f.id)) {
        return { ...f, custom_prefix: value };
      }
      return f;
    }));
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-indigo-50">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-indigo-800">Manutenção: Renomeação Manual</h3>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Filtro de Busca */}
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar pastas..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition shadow-sm"
          />
        </div>

        {/* Lista de Pastas com Controles */}
        <div className="space-y-4">
          {filteredFolders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Loader className="w-6 h-6 text-gray-400 animate-spin" />
              Carregando pastas...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredFolders.map(folder => (
                <div key={folder.id} className="border border-gray-200 rounded-xl p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Folder className={`w-6 h-6 ${folder.selected ? 'text-indigo-600' : 'text-gray-400'}`} />
                      <strong className="text-gray-900">{folder.name}</strong>
                      <span className="text-xs text-gray-500 ml-1">({folder.file_count} arquivos)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={folder.selected}
                        onChange={() => toggleSelect(folder.id)}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-600">Selecionar</span>
                    </div>
                  </div>

                  {/* Prefixo Personalizado */}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-500">Prefixo:</span>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={folder.custom_prefix}
                        onChange={e => handlePrefixChange(folder.id, e.target.value)}
                        placeholder="Ex: CONTAB_"
                        className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition placeholder:text-gray-400"
                        onKeyPress={e => {
                          if (e.key === 'Enter') {
                            const input = e.target as HTMLInputElement;
                            input.blur();
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Ações rápidas */}
                  <div className="mt-2 flex gap-2 justify-end">
                    <button
                      onClick={() => handleSelectAllChange(!folders.some(f => f.selected))}
                      className="text-xs text-gray-500 hover:text-gray-700 transition"
                    >
                      {folders.every(f => f.selected) ? 'Desmarcar Todos' : 'Selecionar Todos'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Seleção Global */}
          <div className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              checked={filteredFolders.every(f => f.selected)}
              onChange={() => toggleSelectAll()}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-600 font-medium">
              {filteredFolders.length} pastas listadas
            </span>
          </div>
        </div>

        {/* Ações Principais */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleBulkRename}
            disabled={loading}
            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition disabled:opacity-50 shadow-lg shadow-indigo-100"
          >
            {loading ? 'Processando...' : 'Renomear Pastas Selecionadas'}
          </button>
          
          <button
            onClick={() => setFolders(prev => prev.map(f => ({ ...f, custom_prefix: f.suggested_prefix })))}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition"
          >
            {fetching ? 'Carregando...' : 'Usar Prefixos Sugeridos'}
          </button>
        </div>

        {/* Progresso */}
        {loading && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm font-bold text-gray-600">
              <span>Processando arquivos...</span>
              <span>{progress.current} / {progress.total}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-indigo-600 h-full transition-all duration-300" 
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 animate-pulse">
              <Loader className="w-3 h-3 animate-spin" />
              Não feche esta página até concluir
            </div>
          </div>
        )}

        {/* Resultados */}
        {results && (
          <div className="grid grid-cols-3 gap-4 mt-4 p-4 bg-gray-50 border border-gray-100 rounded-xl">
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