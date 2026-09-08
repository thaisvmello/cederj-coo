"use client";

import { useState } from 'react';
import { X, Chrome, Mail, CheckCircle, UserPlus, KeyRound, ArrowRight, HelpCircle } from 'lucide-react';

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header do Modal */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-md shadow-blue-200">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">Como Acessar o Acervo</h2>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Guia passo a passo para primeiro acesso e login diário</p>
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

        {/* Abas de Navegação em Grade Responsiva */}
        <div className="p-3 border-b border-gray-100 bg-gray-50/80">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold">
            <button
              onClick={() => setActiveTab('google')}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl transition-all text-center ${
                activeTab === 'google'
                  ? 'bg-white text-blue-600 shadow-sm border border-blue-200 ring-1 ring-blue-500/20'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60 border border-transparent'
              }`}
            >
              <Chrome className="w-4 h-4 text-blue-600 shrink-0" />
              <span>1. Google (Recomendado)</span>
            </button>

            <button
              onClick={() => setActiveTab('signup')}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl transition-all text-center ${
                activeTab === 'signup'
                  ? 'bg-white text-emerald-700 shadow-sm border border-emerald-200 ring-1 ring-emerald-500/20'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60 border border-transparent'
              }`}
            >
              <UserPlus className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>2. Criar Nova Conta</span>
            </button>

            <button
              onClick={() => setActiveTab('login')}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl transition-all text-center ${
                activeTab === 'login'
                  ? 'bg-white text-indigo-700 shadow-sm border border-indigo-200 ring-1 ring-indigo-500/20'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60 border border-transparent'
              }`}
            >
              <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>3. Já Tenho Conta</span>
            </button>

            <button
              onClick={() => setActiveTab('recovery')}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl transition-all text-center ${
                activeTab === 'recovery'
                  ? 'bg-white text-amber-700 shadow-sm border border-amber-200 ring-1 ring-amber-500/20'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60 border border-transparent'
              }`}
            >
              <KeyRound className="w-4 h-4 text-amber-500 shrink-0" />
              <span>4. Esqueci a Senha</span>
            </button>
          </div>
        </div>

        {/* Conteúdo Didático */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-sm text-gray-700 leading-relaxed custom-scrollbar">
          {activeTab === 'google' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-blue-50/80 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <h3 className="font-bold text-blue-900 text-sm sm:text-base">Opção Recomendada (1 Clique)</h3>
                  <p className="text-xs sm:text-sm text-blue-700 mt-0.5">
                    Você não precisa memorizar novas senhas nem preencher formulários longos.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Como fazer:</h4>
                  <ol className="space-y-3 text-xs sm:text-sm text-gray-600 list-decimal list-inside leading-relaxed">
                    <li>Na tela de login, clique no botão <strong>"Google"</strong>.</li>
                    <li>Selecione sua conta Google habitual (pessoal ou acadêmica).</li>
                    <li>Pronto! Você será conectado instantaneamente ao acervo com segurança.</li>
                  </ol>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-3">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">Demonstração visual do botão</p>
                  <div className="max-w-xs mx-auto space-y-2">
                    <div className="w-full bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 font-bold py-3 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2 text-xs sm:text-sm">
                      <Chrome className="w-5 h-5 text-blue-600" />
                      <span>Continuar com o Google</span>
                    </div>
                    <p className="text-[11px] text-center text-gray-500">
                      Clique no botão do Google para entrar sem senha!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'signup' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-emerald-50/80 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3">
                <span className="text-2xl">📝</span>
                <div>
                  <h3 className="font-bold text-emerald-900 text-sm sm:text-base">Primeiro Acesso por E-mail</h3>
                  <p className="text-xs sm:text-sm text-emerald-700 mt-0.5">
                    Se você prefere cadastrar um e-mail com senha própria para o Acervo.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Passo a Passo:</h4>
                  <ol className="space-y-2.5 text-xs sm:text-sm text-gray-600 list-decimal list-inside leading-relaxed">
                    <li>Na parte inferior da tela de login, clique em <strong>"Criar nova"</strong>.</li>
                    <li>Informe seu <strong>E-mail</strong>.</li>
                    <li>Crie uma <strong>Senha</strong> de no mínimo 6 caracteres.</li>
                    <li>Digite seu <strong>Nome</strong> e <strong>Sobrenome</strong>.</li>
                    <li>Clique no botão azul <strong>"Criar Conta"</strong>.</li>
                  </ol>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-3">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">Formulário de Cadastro</p>
                  <div className="max-w-sm mx-auto bg-white border border-gray-200 rounded-xl p-4 space-y-2.5 text-xs shadow-sm">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-gray-400">seu.email@exemplo.com</div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-gray-400">•••••••• (mínimo 6 dígitos)</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-gray-400">Nome</div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-gray-400">Sobrenome</div>
                    </div>
                    <div className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg text-center text-xs">
                      Criar Conta
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'login' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-indigo-50/80 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3">
                <span className="text-2xl">🔑</span>
                <div>
                  <h3 className="font-bold text-indigo-900 text-sm sm:text-base">Acesso Normal (Usuário Já Cadastrado)</h3>
                  <p className="text-xs sm:text-sm text-indigo-700 mt-0.5">
                    Para quem já cadastrou e-mail e senha anteriormente.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Como entrar:</h4>
                  <ol className="space-y-3 text-xs sm:text-sm text-gray-600 list-decimal list-inside leading-relaxed">
                    <li>Digite seu <strong>E-mail cadastrado</strong>.</li>
                    <li>Digite sua <strong>Senha</strong>.</li>
                    <li>Clique no botão azul <strong>"Entrar"</strong>.</li>
                  </ol>
                  <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 text-xs text-blue-800 flex items-center gap-2 mt-4">
                    <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Sua sessão fica salva no navegador para acesso rápido diário.</span>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-3">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">Tela de Entrada</p>
                  <div className="max-w-sm mx-auto bg-white border border-gray-200 rounded-xl p-4 space-y-2.5 text-xs shadow-sm">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-gray-400">seu.email@exemplo.com</div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-gray-400">••••••••</div>
                    <div className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg text-center text-xs">
                      Entrar
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'recovery' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-amber-50/80 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
                <span className="text-2xl">🔄</span>
                <div>
                  <h3 className="font-bold text-amber-900 text-sm sm:text-base">Esqueceu sua senha?</h3>
                  <p className="text-xs sm:text-sm text-amber-700 mt-0.5">
                    Você pode criar uma nova senha a qualquer momento através do seu e-mail.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Como redefinir:</h4>
                  <ol className="space-y-2.5 text-xs sm:text-sm text-gray-600 list-decimal list-inside leading-relaxed">
                    <li>Acima do campo de senha, clique no link <strong>"Esqueci minha senha"</strong>.</li>
                    <li>Digite seu e-mail e clique em <strong>"Enviar link de recuperação"</strong>.</li>
                    <li>Abra seu e-mail e clique no link recebido.</li>
                    <li>Digite sua nova senha para entrar imediatamente.</li>
                  </ol>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-3">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">Recuperação de Acesso</p>
                  <div className="max-w-sm mx-auto bg-white border border-gray-200 rounded-xl p-4 space-y-2.5 text-xs shadow-sm">
                    <div className="text-[11px] text-gray-500 font-medium text-center">Link enviado para seu e-mail</div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-gray-400">Nova Senha: ••••••••</div>
                    <div className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg text-center text-xs">
                      Atualizar Senha
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
          <p className="text-xs text-gray-500 font-medium hidden sm:block">
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
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs sm:text-sm transition shadow-md shadow-blue-100 flex items-center gap-1.5 w-full sm:w-auto justify-center"
            >
              <span>Entendi, ir para o Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}