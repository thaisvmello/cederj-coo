"use client";

import React, { useState } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Link } from 'react-router-dom';
import { 
  BookOpen, Search, Star, LayoutGrid, List, Plus, FolderPlus, Upload, 
  Download, Eye, Pencil, Trash2, MessageSquare, Link as LinkIcon, 
  ArrowLeft, CheckCircle2, AlertTriangle, FileText, Folder, Play, RefreshCw
} from 'lucide-react';

export function Tutorial() {
  // Estado para simulações interativas
  const [simulatedFiles, setSimulatedFiles] = useState(3);
  const [isRenaming, setIsRenaming] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <Header showHomeButton={true} onGoHome={() => (window.location.href = '/')} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-10 space-y-12">
        <div className="border-b border-gray-200 pb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Centro de Treinamento</h1>
            <p className="text-gray-500 mt-2">Aprenda a dominar as ferramentas de colaboração do Acervo.</p>
          </div>
          <Link to="/" className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm">
            Voltar ao Acervo
          </Link>
        </div>

        {/* 1. Simulação de Busca */}
        <section className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl"><Search className="w-6 h-6" /></div>
            <div>
              <h3 className="text-xl font-bold">1. Busca Inteligente</h3>
              <p className="text-sm text-gray-500">Nossa busca filtra por nome ou código EAD.</p>
            </div>
          </div>
          
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-3 text-gray-400 w-5 h-5" />
              <input 
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ex: Contabilidade ou EAD17001..." 
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-3 italic">Dica: Tente digitar o código da disciplina para resultados mais rápidos.</p>
          </div>
        </section>

        {/* 2. Simulação de Arquivos e Conversão */}
        <section className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl"><Upload className="w-6 h-6" /></div>
            <div>
              <h3 className="text-xl font-bold">2. Envio Inteligente (Converter PDF)</h3>
              <p className="text-sm text-gray-500">O acervo converte fotos automaticamente para PDF para você.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-700">
                <FileText className="w-4 h-4" /> Simulação de Upload
              </div>
              <div className="h-24 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center flex-col text-gray-400 text-xs">
                <Upload className="w-8 h-8 mb-2" />
                <span>Solte seu arquivo aqui</span>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-bold text-sm">Por que usar?</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✅ <strong>Conversão Automática:</strong> Envie fotos (PNG/JPG) e nós geramos o PDF.</li>
                <li>✅ <strong>Padronização:</strong> O sistema renomeia automaticamente o arquivo para o padrão CEDERJ.</li>
                <li>✅ <strong>Validação:</strong> Verificamos duplicatas antes de subir.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3. Simulação de Renomeação */}
        <section className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl"><Pencil className="w-6 h-6" /></div>
            <div>
              <h3 className="text-xl font-bold">3. Ferramenta de Renomear</h3>
              <p className="text-sm text-gray-500">Mantenha a organização coletiva.</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-amber-200 shadow-sm">
              <div className="flex items-center gap-3">
                <FileText className="text-blue-500" />
                {isRenaming ? (
                  <input className="px-2 py-1 border border-blue-500 rounded text-sm" defaultValue="PROVA_AP1.pdf" />
                ) : (
                  <span className="text-sm font-medium">CONT_BASICA_AP1_2025_1.pdf</span>
                )}
              </div>
              <button 
                onClick={() => setIsRenaming(!isRenaming)}
                className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600"
              >
                {isRenaming ? 'Salvar' : 'Simular Renomear'}
              </button>
            </div>
          </div>
        </section>

        {/* 4. Comentários (Simulação) */}
        <section className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl"><MessageSquare className="w-6 h-6" /></div>
            <div>
              <h3 className="text-xl font-bold">4. Discussão e Dicas</h3>
              <p className="text-sm text-gray-500">Use o chat para trocar experiências.</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">JS</div>
                <div className="bg-white p-3 rounded-xl rounded-tl-none shadow-sm text-sm text-gray-700">
                  Dica: a questão 3 é idêntica à do semestre passado!
                </div>
              </div>
              <div className="flex gap-2">
                <input className="flex-1 p-2.5 rounded-lg border border-gray-200 text-xs" placeholder="Responder..." />
                <button className="bg-indigo-600 text-white px-4 rounded-lg font-bold text-xs">Enviar</button>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}