import { useState } from 'react';
import { Calculator as CalcIcon, Plus, Trash2, RotateCcw, GraduationCap, TrendingUp, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Grade {
  id: string;
  name: string;
  value: string;
  weight: string;
}

interface Semester {
  id: string;
  name: string;
  grades: Grade[];
}

export function Calculator() {
  const [semesters, setSemesters] = useState<Semester[]>([
    {
      id: '1',
      name: 'Semestre Atual',
      grades: [
        { id: '1', name: 'AV1', value: '', weight: '1' },
        { id: '2', name: 'AV2', value: '', weight: '1' },
      ]
    }
  ]);
  const [passingGrade, setPassingGrade] = useState('60');
  const [finalWeight, setFinalWeight] = useState('1');
  const [results, setResults] = useState<{
    average: number;
    status: 'pass' | 'fail' | 'final' | null;
    neededInFinal: number | null;
  }>({ average: 0, status: null, neededInFinal: null });

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const addGrade = (semesterId: string) => {
    setSemesters(prev => prev.map(sem => {
      if (sem.id === semesterId) {
        const gradeNum = sem.grades.length + 1;
        return {
          ...sem,
          grades: [...sem.grades, { id: generateId(), name: `AV${gradeNum}`, value: '', weight: '1' }]
        };
      }
      return sem;
    }));
  };

  const removeGrade = (semesterId: string, gradeId: string) => {
    setSemesters(prev => prev.map(sem => {
      if (sem.id === semesterId) {
        return {
          ...sem,
          grades: sem.grades.filter(g => g.id !== gradeId)
        };
      }
      return sem;
    }));
  };

  const updateGrade = (semesterId: string, gradeId: string, field: 'name' | 'value' | 'weight', value: string) => {
    setSemesters(prev => prev.map(sem => {
      if (sem.id === semesterId) {
        return {
          ...sem,
          grades: sem.grades.map(g => {
            if (g.id === gradeId) {
              return { ...g, [field]: value };
            }
            return g;
          })
        };
      }
      return sem;
    }));
  };

  const calculate = () => {
    const semester = semesters[0];
    const grades = semester.grades.filter(g => g.value !== '');
    
    if (grades.length === 0) {
      toast.error('Adicione pelo menos uma nota');
      return;
    }

    let totalWeightedSum = 0;
    let totalWeight = 0;

    grades.forEach(grade => {
      const value = parseFloat(grade.value);
      const weight = parseFloat(grade.weight) || 1;
      if (!isNaN(value)) {
        totalWeightedSum += value * weight;
        totalWeight += weight;
      }
    });

    const average = totalWeight > 0 ? totalWeightedSum / totalWeight : 0;
    const passing = parseFloat(passingGrade) || 60;
    const finalW = parseFloat(finalWeight) || 1;

    let status: 'pass' | 'fail' | 'final' = 'fail';
    let neededInFinal: number | null = null;

    if (average >= passing) {
      status = 'pass';
    } else {
      // Calcular quanto precisa na final
      // Média final = (média * peso_total + nota_final * peso_final) / (peso_total + peso_final)
      // Para passar: média_final >= passing
      // nota_final >= (passing * (peso_total + peso_final) - média * peso_total) / peso_final
      
      const needed = (passing * (totalWeight + finalW) - totalWeightedSum) / finalW;
      
      if (needed <= 100) {
        status = 'final';
        neededInFinal = needed;
      } else {
        status = 'fail';
      }
    }

    setResults({ average, status, neededInFinal });
  };

  const reset = () => {
    setSemesters([{
      id: '1',
      name: 'Semestre Atual',
      grades: [
        { id: generateId(), name: 'AV1', value: '', weight: '1' },
        { id: generateId(), name: 'AV2', value: '', weight: '1' },
      ]
    }]);
    setResults({ average: 0, status: null, neededInFinal: null });
  };

  const getStatusColor = () => {
    switch (results.status) {
      case 'pass': return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      case 'fail': return 'bg-red-50 border-red-200 text-red-700';
      case 'final': return 'bg-amber-50 border-amber-200 text-amber-700';
      default: return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const getStatusText = () => {
    switch (results.status) {
      case 'pass': return '✓ Aprovado!';
      case 'fail': return '✗ Reprovado';
      case 'final': return '⚠ Precisa de Final';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 rounded-lg">
          <CalcIcon className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Calculadora de Notas</h2>
          <p className="text-sm text-gray-500">Calcule sua média e veja se precisa de final</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Notas */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-600" />
              Suas Notas
            </h3>

            {semesters.map(semester => (
              <div key={semester.id} className="space-y-4">
                <div className="space-y-3">
                  {semester.grades.map((grade, index) => (
                    <div key={grade.id} className="flex items-center gap-3">
                      <input
                        type="text"
                        value={grade.name}
                        onChange={(e) => updateGrade(semester.id, grade.id, 'name', e.target.value)}
                        className="w-20 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="AV1"
                      />
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={grade.value}
                          onChange={(e) => updateGrade(semester.id, grade.id, 'value', e.target.value)}
                          className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="Nota (0-100)"
                        />
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-400">Peso:</span>
                          <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={grade.weight}
                            onChange={(e) => updateGrade(semester.id, grade.id, 'weight', e.target.value)}
                            className="w-16 px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </div>
                      {semester.grades.length > 1 && (
                        <button
                          onClick={() => removeGrade(semester.id, grade.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => addGrade(semester.id)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Avaliação
                </button>
              </div>
            ))}
          </div>

          {/* Configurações */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Configurações
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Média para Aprovação
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={passingGrade}
                  onChange={(e) => setPassingGrade(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Peso da Prova Final
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={finalWeight}
                  onChange={(e) => setFinalWeight(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex items-center gap-3">
            <button
              onClick={calculate}
              className="flex-1 px-6 py-3 bg-[#0f172a] text-white rounded-xl font-bold text-sm hover:bg-[#1e293b] transition flex items-center justify-center gap-2"
            >
              <CalcIcon className="w-4 h-4" />
              Calcular Média
            </button>
            <button
              onClick={reset}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Limpar
            </button>
          </div>
        </div>

        {/* Resultado */}
        <div className="space-y-6">
          <div className={`rounded-xl border p-6 shadow-sm ${getStatusColor()}`}>
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Resultado
            </h3>
            
            {results.status ? (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm font-medium opacity-70 mb-1">Sua Média</p>
                  <p className="text-5xl font-extrabold">{results.average.toFixed(1)}</p>
                </div>
                
                <div className="text-center py-3 border-t border-current/20">
                  <p className="text-lg font-bold">{getStatusText()}</p>
                </div>

                {results.status === 'final' && results.neededInFinal !== null && (
                  <div className="bg-white/50 rounded-lg p-4 text-center">
                    <p className="text-sm font-medium mb-1">Você precisa tirar pelo menos</p>
                    <p className="text-3xl font-extrabold text-amber-600">
                      {results.neededInFinal.toFixed(1)}
                    </p>
                    <p className="text-sm font-medium mt-1">na prova final</p>
                  </div>
                )}

                {results.status === 'pass' && (
                  <div className="bg-white/50 rounded-lg p-4 text-center">
                    <p className="text-sm font-medium">Parabéns! Você está aprovado! 🎉</p>
                  </div>
                )}

                {results.status === 'fail' && (
                  <div className="bg-white/50 rounded-lg p-4 text-center">
                    <p className="text-sm font-medium">Infelizmente não é possível passar mesmo com final 😢</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalcIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm opacity-70">Preencha suas notas e clique em calcular</p>
              </div>
            )}
          </div>

          {/* Dicas */}
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
            <h4 className="font-bold text-blue-900 text-sm mb-2">💡 Dicas</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Use ponto (.) para casas decimais</li>
              <li>• O peso padrão é 1 para todas as provas</li>
              <li>• A média é calculada como média ponderada</li>
              <li>• Configure a média mínima conforme sua disciplina</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}