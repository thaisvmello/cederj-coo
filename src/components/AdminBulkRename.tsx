import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { RefreshCw, Play, CheckCircle, AlertCircle, Loader, FileText } from 'lucide-react';
import { generateNewFileName } from '../lib/utils';
import toast from 'react-hot-toast';

export function AdminBulkRename() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<{ success: number; skipped: number; error: number } | null>(null);

  const handleBulkRename = async () => {
    if (!confirm('Isso irá renomear TODOS os arquivos em pastas de provas (AD1, AP1, AP2, AP3) para o padrão inteligente. Deseja continuar?')) {
      return;
    }

    setLoading(true);
    setResults(null);
    let success = 0;
    let skipped = 0;
    let error = 0;

    try {
      // 1. Buscar dados necessários
      const { data: courses } = await supabase.from('courses').select('id, name');
      const { data: folders } = await supabase.from('folders').select('id, course_id, name');
      const { data: files } = await supabase.from('files').select('id, name, folder_id');

      if (!files || !folders || !courses) throw new Error('Erro ao carregar dados');

      setProgress({ current: 0, total: files.length });

      // 2. Processar cada arquivo
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const folder = folders.find(f => f.id === file.folder_id);
        const course = courses.find(c => c.id === folder?.course_id);

        // Verificar se a pasta é de prova (AD1, AP1, AP2, AP3)
        if (course && folder && /^(AD|AP)[1-3]$/i.test(folder.name)) {
          const newName = generateNewFileName(course.name, folder.name, file.name);

          // Se o arquivo já tem o nome correto, pular
          if (file.name === newName) {
            skipped++;
          } else {
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
      <div className="p-4 border-b border-gray-100 bg-indigo-50">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-indigo-800">Manutenção: Padronização de Nomes</h3>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
          <p className="text-sm text-indigo-900 leading-relaxed">
            Esta ferramenta percorre todos os arquivos do acervo em pastas de provas (AD1, AP1, AP2, AP3) e aplica o <strong>padrão de nomenclatura</strong>:
          </p>
          <ul className="text-sm text-indigo-800 mt-2 space-y-1 list-disc list-inside">
            <li>Prefixo da disciplina (ex: INSTDIREITO_)</li>
            <li>Nome da pasta (ex: AP1_)</li>
            <li>Ano extraído do arquivo (ex: 2025_)</li>
            <li>Semestre extraído (ex: 1_)</li>
            <li>Palavras-chave mantidas (GABARITO, RESOLUÇÃO)</li>
          </ul>
          <p className="text-sm text-indigo-900 mt-2">
            Exemplo: <code>25_1 Gabarito.pdf</code> → <code>INSTDIREITO_AP1_2025_1_GABARITO.pdf</code>
          </p>
        </div>

        {loading ? (
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
        ) : results ? (
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
        ) : (
          <button
            onClick={handleBulkRename}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
          >
            <Play className="w-5 h-5" />
            Iniciar Padronização de Nomes
          </button>
        )}
      </div>
    </div>
  );
}