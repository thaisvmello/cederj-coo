import { AlertTriangle } from 'lucide-react';

export function FolderWarningBanner() {
  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="p-1.5 bg-amber-100 rounded-lg shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-bold text-amber-900">
            POR FAVOR! Vamos evitar duplicidade de material:
          </p>
          <p className="text-xs text-amber-800">
            Procure a prova na lista e veja se já existe antes de fazer o seu envio.
          </p>
          <div className="bg-white/60 rounded-lg p-3 mt-2">
            <p className="text-xs font-bold text-amber-900 mb-1">
              Priorizem o nome do arquivo no formato:
            </p>
            <code className="text-sm font-mono font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded">
              TIPO_DE_PROVA_ANO_SEMESTRE
            </code>
            <p className="text-xs text-amber-700 mt-2">
              Exemplo: <span className="font-mono font-bold">AD_2025_2.pdf</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}