"use client";

import React, { useState } from 'react';
import { X, Chrome, Mail, Lock, CheckCircle2, UserPlus, KeyRound, ArrowRight, HelpCircle, Eye, EyeOff } from 'lucide-react';

interface LoginTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCreateAccount?: () => void;
}

export function LoginTutorialModal({ isOpen, onClose, onSelectCreateAccount }: LoginTutorialModalProps) {
  const [activeTab, setActiveTab] = useState<'google' | 'signup' | 'login' | 'recovery'>('google');
  const [showSimulatedPassword, setShowSimulatedPassword] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-lg">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">Guia de Acesso</h2>
              <p className="text-xs text-gray-500 font-medium">Aprenda a navegar e acessar o Acervo</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-white/50 rounded-full transition"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-3 border-b border-gray-100 bg-gray-50/50">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-bold">
            {['google', 'signup', 'login', 'recovery'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-2 px-3 rounded-xl transition-all ${activeTab === tab ? 'bg-white shadow-sm ring-1 ring-blue-500/20 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                {tab === 'google' ? '1. Google' : tab === 'signup' ? '2. Cadastro' : tab === 'login' ? '3. Acesso' : '4. Senha'}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 sm:p-8 flex-1 overflow-y-auto custom-scrollbar">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">
                {activeTab === 'google' && "Entrada com Google"}
                {activeTab === 'signup' && "Como Criar Conta"}
                {activeTab === 'login' && "Como Fazer Login"}
                {activeTab === 'recovery' && "Recuperar Acesso"}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {activeTab === 'google' && "A maneira mais rápida. Clique abaixo para simular o login direto via conta Google. Nenhuma senha necessária!"}
                {activeTab === 'signup' && "Preencha seus dados para criar sua conta acadêmica. Lembre-se de usar um e-mail válido para confirmar."}
                {activeTab === 'login' && "Use seu e-mail e a senha cadastrada para acessar seu perfil e contribuir com o acervo."}
                {activeTab === 'recovery' && "Esqueceu sua senha? Enviaremos um link de redefinição para seu e-mail."}
              </p>
            </div>

            {/* Simulação Interativa */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-inner space-y-4">
              {activeTab === 'google' && (
                <button className="w-full py-3 bg-white border border-gray-300 rounded-xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition">
                  <Chrome className="w-4 h-4" /> Continuar com Google
                </button>
              )}
              
              {activeTab === 'signup' && (
                <div className="space-y-3">
                  <input className="w-full p-2.5 rounded-lg border border-gray-300 text-xs" placeholder="E-mail" />
                  <div className="flex gap-2">
                    <input className="w-1/2 p-2.5 rounded-lg border border-gray-300 text-xs" placeholder="Nome" />
                    <input className="w-1/2 p-2.5 rounded-lg border border-gray-300 text-xs" placeholder="Sobrenome" />
                  </div>
                  <button className="w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-bold">Criar Conta</button>
                </div>
              )}

              {(activeTab === 'login' || activeTab === 'recovery') && (
                <div className="space-y-3">
                  <input className="w-full p-2.5 rounded-lg border border-gray-300 text-xs" placeholder="E-mail" />
                  <div className="relative">
                    <input type={showSimulatedPassword ? 'text' : 'password'} className="w-full p-2.5 rounded-lg border border-gray-300 text-xs" placeholder="Senha" />
                    <button type="button" onClick={() => setShowSimulatedPassword(!showSimulatedPassword)} className="absolute right-3 top-2.5 text-gray-400">
                      {showSimulatedPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <button className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold">
                    {activeTab === 'login' ? 'Entrar' : 'Enviar Link de Redefinição'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-700">
            Entendi, voltar para o login <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}