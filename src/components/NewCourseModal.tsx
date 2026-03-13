import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, FolderPlus, Loader, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface NewCourseModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function NewCourseModal({ onClose, onSuccess }: NewCourseModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [period, setPeriod] = useState('');
  const [subjectType, setSubjectType] = useState('Obrigatória');
  const [existingTypes, setExistingTypes] = useState<string[]>(['Obrigatória', 'Optativa', 'Eletiva']);
  const [loading, setLoading] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(true);

  useEffect(() => {
    fetchExistingTypes();
  }, []);

  const fetchExistingTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('subject_type')
        .not('subject_type', 'is', null);
      
      if (error) throw error;

      if (data) {
        const types = Array.from(new Set(data.map((item: { subject_type: string | null }) => item.subject_type)));
        const combinedTypes = Array.from(new Set([...existingTypes, ...types]));
        setExistingTypes(combinedTypes.filter(Boolean) as string[]);
      }
    } catch (error) {
      console.error('Error fetching types:', error);
    } finally {
      setLoadingTypes(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Por favor, informe o nome da disciplina');
      return;
    }
    if (!user) {
      toast.error('Você precisa estar logado para solicitar uma disciplina');
      return;
    }

    setLoading(true);
    try {
      // Verificar se já existe uma solicitação pendente com mesmo nome
      const { data: existingRequest } = await supabase
        .from('course_requests')
        .select('id')
        .eq('name', name.trim())
        .eq('status', 'pending')
        .maybeSingle();

      if (existingRequest) {
        toast.error('Já existe uma solicitação pendente para esta disciplina!');
        setLoading(false);
        return;
      }

      // Verificar se a disciplina já existe
      const { data: existingCourse } = await supabase
        .from('courses')
        .select('id')
        .ilike('name', name.trim())
        .maybeSingle();

      if (existingCourse) {
        toast.error('Esta disciplina já existe no acervo!');
        setLoading(false);
        return;
      }

      // Criar solicitação
      const { error } = await supabase.from('course_requests').insert({
        requested_by: user.id,
        name: name.trim(),
        code: code.trim() || null,
        period: period.trim() || null,
        subject_type: subjectType,
        is_mandatory: subjectType.toLowerCase().includes('obrigatória'),
        status: 'pending'
      });

      if (error) throw error;

      toast.success('Solicitação enviada! Aguarde a aprovação do administrador.');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating course request:', error);
      
      if (error?.code === '42P01') {
        toast.error('Sistema de solicitações não configurado. Contate o administrador.');
      } else if (error?.code === '42501' || error?.message?.includes('policy')) {
        toast.error('Sem permissão para criar solicitação. Verifique se está logado.');
      } else {
        toast.error(`Erro ao enviar solicitação: ${error?.message || 'Tente novamente'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <FolderPlus className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Solicitar Nova Disciplina</h2>
              <p className="text-xs text-gray-500">Requer aprovação do administrador</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs text-amber-800">
              <strong>Atenção:</strong> A criação de novas disciplinas requer aprovação do administrador. 
              Sua solicitação será analisada em breve.
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Nome da disciplina *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Contabilidade Básica I"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Código EAD (opcional)
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ex: EAD17034"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Tipo da disciplina
              </label>
              <div className="relative">
                <select
                  value={subjectType}
                  onChange={(e) => setSubjectType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition appearance-none"
                >
                  {existingTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                  <option value="custom">+ Outro tipo...</option>
                </select>
                {loadingTypes && (
                  <Loader className="absolute right-3 top-3 w-4 h-4 text-gray-400 animate-spin" />
                )}
              </div>
              {subjectType === 'custom' && (
                <input
                  type="text"
                  placeholder="Digite o novo tipo"
                  className="mt-2 w-full px-4 py-2 bg-white border border-amber-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  onBlur={(e) => {
                    if (e.target.value.trim()) {
                      const newType = e.target.value.trim();
                      setExistingTypes(prev => Array.from(new Set([...prev, newType])));
                      setSubjectType(newType);
                    } else {
                      setSubjectType('Obrigatória');
                    }
                  }}
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Período/Semestre
              </label>
              <input
                type="text"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="Ex: 1"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-amber-500 text-white rounded-xl font-bold text-sm hover:bg-amber-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? 'Enviando...' : 'Enviar Solicitação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}