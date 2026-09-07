"use client";

import React, { useState } from 'react';
import { X, Chrome, Mail, Lock, CheckCircle2, UserPlus, KeyRound, ArrowRight, HelpCircle } from 'lucide-react';

interface LoginTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGoogle?: () => void;
  onSelectCreateAccount?: () => void;
}

export function LoginTutorialModal({ isOpen, onClose, onSelectCreateAccount }: LoginTutorialModalProps) {
  const [activeTab, setActiveTab] = useState<'google' | 'signup' | 'login' | 'recovery'>('google');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header do Modal */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-md shadow-blue-200">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">Como Acessar o Acervo</h2>
              <p className="text-xs text-gray-500 font-medium">Guia passo a passo para primeiro acesso e login diário</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-white/80 rounded-full transition"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas de Navegação */}
        <div className="flex border-b border-gray-100 bg-gray-50/70 p-2 gap-1 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('google')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all shrink-0 ${
              activeTab === 'google'
                ? 'bg-white text-blue-600 shadow-sm border border-gray-200/80'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/60'
            }`}
          >
            <Chrome className="w-3.5 h-3.5 text-blue-600" />
            1. Login com Google (Mais Rápido)
          </button>

          <button
            onClick={() => setActiveTab('signup')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all shrink-0 ${
              activeTab === 'signup'
                ? 'bg-white text-blue-600 shadow-sm border border-gray-200/80'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/60'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
            2. Criar Nova Conta
          </button>

          <button
            onClick={() => setActiveTab('login')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all shrink-0 ${
              activeTab === 'login'
                ? 'bg-white text-blue-600 shadow-sm border border-gray-200/80'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/60'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-indigo-600" />
            3. Já Tenho Conta
          </button>

          <button
            onClick={() => setActiveTab('recovery')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all shrink-0 ${
              activeTab === 'recovery'
                ? 'bg-white text-blue-600 shadow-sm border border-gray-200/80'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/60'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-500" />
            4. Esqueci a Senha
          </button>
        </div>

        {/* Conteúdo Didático com Prints / Ilustrações */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-gray-700 leading-relaxed custom-scrollbar">
          {/* Aba 1: Google */}
          {activeTab === 'google' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-blue-50/80 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
                <span className="text-xl">⚡</span>
                <div>
                  <h3 className="font-bold text-blue-900 text-sm">Opção Recomendada (1 Clique)</h3>
                  <p className="text-xs text-blue-700 mt-0.5">
                    Você não precisa memorizar novas senhas nem preencher formulários longos.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Como fazer:</h4>
                <ol className="space-y-2.5 text-xs text-gray-600 list-decimal list-inside">
                  <li>Na tela de login, role até o botão <strong>"Google"</strong> com o logo colorido.</li>
                  <li>Clique no botão e selecione sua conta Google pessoal ou universitária.</li>
                  <li>Pronto! Você será conectado automaticamente e direcionado ao acervo.</li>
                </ol>
              </div>

              {/* Simulação Visual */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-3">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">Demonstração visual do botão</p>
                <div className="max-w-xs mx-auto space-y-2">
                  <div className="w-full bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 font-bold py-2.5 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2 text-xs">
                    <Chrome className="w-4 h-4 text-blue-600" />
                    <span>Continuar com o Google</span>
                  </div>
                  <p className="text-[10px] text-center text-gray-400">
                    Clique nesse botão para acessar sem senha!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Aba 2: Criar Nova Conta */}
          {activeTab === 'signup' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-emerald-50/80 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3">
                <span className="text-xl">📝</span>
                <div>
                  <h3 className="font-bold text-emerald-900 text-sm">Primeiro Acesso por E-mail</h3>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Se você prefere usar um e-mail com senha própria para o Acervo.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Passo a Passo:</h4>
                <ol className="space-y-2.5 text-xs text-gray-600 list-decimal list-inside">
                  <li>Na parte inferior da tela de login, clique no link azul <strong>"Criar nova"</strong>.</li>
                  <li>Digite seu <strong>E-mail</strong> de uso frequente.</li>
                  <li>Crie uma <strong>Senha</strong> de no mínimo 6 caracteres.</li>
                  <li>Digite seu <strong>Nome</strong> e <strong>Sobrenome</strong> (para identificação nos comentários e uploads).</li>
                  <li>Clique no botão azul <strong>"Criar Conta"</strong>.</li>
                </ol>
              </div>

              {/* Simulação Visual */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">Exemplo do Formulário de Cadastro</p>
                <div className="max-w-sm mx-auto bg-white border border-gray-200 rounded-xl p-3.5 space-y-2 text-xs shadow-sm">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-gray-400">seu.email@exemplo.com</div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-gray-400">•••••••• (mínimo 6 dígitos)</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-gray-400">Nome</div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-gray-400">Sobrenome</div>
                  </div>
                  <div className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg text-center text-xs">
                    Criar Conta
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Aba 3: Já Tenho Conta */}
          {activeTab === 'login' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-indigo-50/80 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3">
                <span className="text-xl">🔑</span>
                <div>
                  <h3 className="font-bold text-indigo-900 text-sm">Acesso Normal (Usuário Já Cadastrado)</h3>
                  <p className="text-xs text-indigo-700 mt-0.5">
                    Para quem já possui cadastro prévio no sistema.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Como entrar:</h4>
                <ol className="space-y-2.5 text-xs text-gray-600 list-decimal list-inside">
                  <li>Digite seu <strong>E-mail cadastrado</strong>.</li>
                  <li>Digite sua <strong>Senha</strong>.</li>
                  <li>Clique no botão azul <strong>"Entrar"</strong>.</li>
                </ol>
              </div>

              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 text-xs text-blue-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Sua sessão ficará salva no navegador para você não precisar digitar toda vez.</span>
              </div>
            </div>
          )}

          {/* Aba 4: Esqueci a Senha */}
          {activeTab === 'recovery' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-amber-50/80 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
                <span className="text-xl">🔄</span>
                <div>
                  <h3 className="font-bold text-amber-900 text-sm">Esqueceu sua senha?</h3>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Você pode redefinir sua senha com facilidade pelo seu e-mail.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Como redefinir:</h4>
                <ol className="space-y-2.5 text-xs text-gray-600 list-decimal list-inside">
                  <li>Acima do campo de senha, clique no link <strong>"Esqueci minha senha"</strong>.</li>
                  <li>Informe o e-mail cadastrado e clique em <strong>"Enviar link de recuperação"</strong>.</li>
                  <li>Abra o e-mail recebido e clique no link de redefinição.</li>
                  <li>Digite sua nova senha e confirme para entrar imediatamente!</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
          <p className="text-[11px] text-gray-500 font-medium hidden sm:block">
            Acervo Acadêmico • Ciências Contábeis
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                onClose();
                if (activeTab === 'signup' && onSelectCreateAccount) {
                  onSelectCreateAccount();
                }
              }}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition shadow-md shadow-blue-100 flex items-center gap-1.5 w-full sm:w-auto justify-center"
            >
              <span>Entendi, ir para o Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}