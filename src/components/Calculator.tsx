import { useState, useEffect } from 'react';
import { Calculator as CalcIcon, RotateCcw, GraduationCap, Info } from 'lucide-react';

export function Calculator() {
  const [ad1, setAd1] = useState('');
  const [ap1, setAp1] = useState('');
  const [ad2, setAd2] = useState('');
  const [ap2, setAp2] = useState('');
  const [ap3, setAp3] = useState('');

  const [results, setResults] = useState({
    n1: '',
    n2: '',
    n: '',
    nf: '',
    ap1Aprovacao: '',
    ap2Aprovacao: '',
    ap3Aprovacao: '',
    situacao: ''
  });

  function toNumber(value: string): number {
    if (!value) return 0;
    const num = parseFloat(value.replace(',', '.'));
    return Math.max(0, isNaN(num) ? 0 : num);
  }

  function roundToOne(num: number): number {
    return Math.round((num + Number.EPSILON) * 10) / 10;
  }

  useEffect(() => {
    const ad1Num = toNumber(ad1);
    const ap1Num = toNumber(ap1);
    const ad2Num = toNumber(ad2);
    const ap2Num = toNumber(ap2);
    const ap3Num = toNumber(ap3);

    // N1 = AD1 * 0.2 + AP1 * 0.8
    const n1 = ad1Num * 0.2 + ap1Num * 0.8;
    
    // N2 = AD2 * 0.2 + AP2 * 0.8
    const n2 = ad2Num * 0.2 + ap2Num * 0.8;
    
    // N = (N1 + N2) / 2
    const n = (n1 + n2) / 2;
    
    // NF = N >= 6 ? N : (Math.max(N1, N2) + AP3) / 2
    const nf = n >= 6 ? n : (Math.max(n1, n2) + ap3Num) / 2;

    // Notas necessárias para aprovação
    const ap1Aprovacao = ad1 ? Math.ceil((6 - ad1Num * 0.2) / 0.8 * 10) / 10 : null;
    const ap2Aprovacao = ad1 && ap1 && ad2 ? Math.ceil((12 - n1 - ad2Num * 0.2) / 0.8 * 10) / 10 : null;
    const ap3Aprovacao = n < 6 && n > 0 ? Math.ceil((10 - Math.max(n1, n2)) * 10) / 10 : null;

    // Situação
    let situacao = '';
    if (ad1 || ap1 || ad2 || ap2 || ap3) {
      if (n >= 6) {
        situacao = 'APROVADO';
      } else if (n < 6 && ap3Num === 0) {
        situacao = 'FAZER AP3';
      } else if (n < 6 && ap3Num > 0) {
        if (nf >= 5) {
          situacao = 'APROVADO';
        } else {
          situacao = 'REPROVADO';
        }
      }
    }

    setResults({
      n1: n1 > 0 || ap1 || ad1 ? roundToOne(n1).toFixed(1) : '',
      n2: n2 > 0 || ap2 || ad2 ? roundToOne(n2).toFixed(1) : '',
      n: n > 0 ? roundToOne(n).toFixed(1) : '',
      nf: nf > 0 && (ap3 || n < 6) ? roundToOne(nf).toFixed(1) : '',
      ap1Aprovacao: ap1Aprovacao !== null && ap1Aprovacao > 0 ? ap1Aprovacao.toFixed(1) : '',
      ap2Aprovacao: ap2Aprovacao !== null && ap2Aprovacao > 0 ? ap2Aprovacao.toFixed(1) : '',
      ap3Aprovacao: n >= 6 ? 'Não precisa :)' : (ap3Aprovacao !== null && ap3Aprovacao > 0 ? ap3Aprovacao.toFixed(1) : ''),
      situacao
    });
  }, [ad1, ap1, ad2, ap2, ap3]);

  const reset = () => {
    setAd1('');
    setAp1('');
    setAd2('');
    setAp2('');
    setAp3('');
  };

  const getSituacaoStyle = () => {
    switch (results.situacao) {
      case 'APROVADO': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'FAZER AP3': return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'REPROVADO': return 'bg-red-100 border-red-300 text-red-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 rounded-lg">
          <CalcIcon className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Calculadora de Notas CEDERJ</h2>
          <p className="text-sm text-gray-500">Calcule suas notas e veja sua situação acadêmica</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário de Notas */}
        <div className="space-y-6">
          {/* Primeira Unidade */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-600" />
              Primeiro Ciclo (AD1 + AP1)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  AD1 (Avaliação a Distância)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={ad1}
                  onChange={(e) => setAd1(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-medium focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  AP1 (Avaliação Presencial)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={ap1}
                  onChange={(e) => setAp1(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-medium focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="0.0"
                />
              </div>
            </div>
            {results.n1 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-blue-700 font-medium">N1 = </span>
                <span className="text-lg font-bold text-blue-800">{results.n1}</span>
                <span className="text-xs text-blue-600 ml-2">(AD1 × 0.2 + AP1 × 0.8)</span>
              </div>
            )}
          </div>

          {/* Segunda Unidade */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-emerald-600" />
              Segundo Ciclo (AD2 + AP2)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  AD2 (Avaliação a Distância)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={ad2}
                  onChange={(e) => setAd2(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition"
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  AP2 (Avaliação Presencial)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={ap2}
                  onChange={(e) => setAp2(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition"
                  placeholder="0.0"
                />
              </div>
            </div>
            {results.n2 && (
              <div className="mt-4 p-3 bg-emerald-50 rounded-lg">
                <span className="text-sm text-emerald-700 font-medium">N2 = </span>
                <span className="text-lg font-bold text-emerald-800">{results.n2}</span>
                <span className="text-xs text-emerald-600 ml-2">(AD2 × 0.2 + AP2 × 0.8)</span>
              </div>
            )}
          </div>

          {/* AP3 - Prova Final */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-amber-600" />
              Prova Final (AP3)
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                AP3 (Avaliação Presencial Final)
              </label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={ap3}
                onChange={(e) => setAp3(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-medium focus:ring-2 focus:ring-amber-500 outline-none transition"
                placeholder="0.0"
              />
              <p className="text-xs text-gray-500 mt-2">Preencha apenas se precisar fazer a prova final</p>
            </div>
          </div>

          {/* Botão Limpar */}
          <button
            onClick={reset}
            className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Limpar Tudo
          </button>
        </div>

        {/* Resultados */}
        <div className="space-y-6">
          {/* Médias Calculadas */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">📊 Médias Calculadas</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Média Final (N)</span>
                <span className="text-xl font-bold text-gray-900">{results.n || '-'}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Nota Final (NF)</span>
                <span className="text-xl font-bold text-gray-900">{results.nf || '-'}</span>
              </div>
            </div>
          </div>

          {/* Situação */}
          {results.situacao && (
            <div className={`rounded-xl border-2 p-6 shadow-sm ${getSituacaoStyle()}`}>
              <h3 className="font-bold mb-2">📋 Situação</h3>
              <p className="text-3xl font-extrabold">{results.situacao}</p>
            </div>
          )}

          {/* Notas Necessárias para Aprovação */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-purple-600" />
              Notas Necessárias para Aprovação
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-sm text-purple-700">AP1 mínima</span>
                <span className="text-lg font-bold text-purple-800">
                  {results.ap1Aprovacao || 'Preencha AD1'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-sm text-purple-700">AP2 mínima</span>
                <span className="text-lg font-bold text-purple-800">
                  {results.ap2Aprovacao || 'Preencha AD1, AP1 e AD2'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-sm text-purple-700">AP3 mínima</span>
                <span className="text-lg font-bold text-purple-800">
                  {results.ap3Aprovacao || 'Preencha as notas'}
                </span>
              </div>
            </div>
          </div>

          {/* Fórmulas */}
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
            <h4 className="font-bold text-blue-900 text-sm mb-2">📐 Fórmulas</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• N1 = AD1 × 0.2 + AP1 × 0.8</li>
              <li>• N2 = AD2 × 0.2 + AP2 × 0.8</li>
              <li>• N = (N1 + N2) / 2</li>
              <li>• NF = (maior(N1,N2) + AP3) / 2</li>
              <li>• Aprovação direta: N ≥ 6.0</li>
              <li>• Aprovação final: NF ≥ 5.0</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}