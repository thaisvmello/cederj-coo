import { useState, useRef, useEffect } from 'react';
import { useAdmin } from '../hooks/useAdmin';
import { LogOut, Calculator, Shield, Home, Settings, ChevronDown, Calendar, FileText, HelpCircle, ExternalLink, Wrench, MessageSquare, Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';
import { useAuth } from '../contexts/AuthContext';

export function Header({
  showHomeButton = false,
  onGoHome,
  onNavigateToCalculator,
  currentPage,
}: {
  showHomeButton?: boolean;
  onGoHome?: () => void;
  onNavigateToCalculator?: () => void;
  currentPage?: string;
}) {
  const { isAdmin } = useAdmin();
  const location = useLocation();
  const isAdminPage = location.pathname === '/admin';
  const isProfilePage = location.pathname === '/profile';
  const isTutorialPage = location.pathname === '/tutorial';
  const isFeedbackPage = location.pathname === '/feedback';
  const { user, signOut } = useAuth();

  const [toolsOpen, setToolsOpen] = useState(false);
  const [whatsappOpen, setWhatsappOpen] = useState(false);

  const toolsRef = useRef<HTMLDivElement>(null);
  const whatsappRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) {
        setToolsOpen(false);
      }
      if (whatsappRef.current && !whatsappRef.current.contains(event.target as Node)) {
        setWhatsappOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="w-full z-40 sticky top-0 shadow-md">
      {/* Main Header - Azul Escuro */}
      <div className="bg-[#00394a] text-white px-4 sm:px-6 py-3 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Lado Esquerdo - Botão Voltar/Admin (Mobile) */}
          <div className="flex items-center gap-2 md:hidden">
            {isAdmin && (
              <Link
                to={isAdminPage ? '/' : '/admin'}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-300 hover:text-white"
              >
                {isAdminPage ? <Home className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
              </Link>
            )}
            {!isAdminPage && !isProfilePage && !isTutorialPage && !isFeedbackPage && showHomeButton && onGoHome && (
              <button
                onClick={onGoHome}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-300 hover:text-white"
              >
                <Home className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Centro - Logo e Título (Desktop fica à esquerda, Mobile fica centralizado se houver espaço) */}
          <Link 
            to="/" 
            onClick={onGoHome} 
            className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-1 md:flex-none justify-center md:justify-start"
          >
            <img
              src="/57002beae21c30a2d583825b8ea17010.png"
              alt="Logo Acervo Acadêmico"
              className="h-8 md:h-10 w-auto object-contain shrink-0"
            />
            <div className="border-l-2 border-white/20 pl-3 flex flex-col justify-center">
              <h1 className="text-[16px] md:text-2xl font-extrabold leading-none tracking-tight">
                Acervo Acadêmico
              </h1>
              {isAdmin && <span className="text-[9px] md:text-[10px] text-purple-300 font-medium uppercase tracking-widest mt-0.5 md:hidden">Painel Admin</span>}
            </div>
          </Link>

          {/* Lado Direito - Perfil, Notificação e Sair */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            
            {/* Bloco de Usuário - Escondido no Mobile para limpeza visual */}
            <div className="text-right hidden md:block">
              <Link to="/profile" className="group block">
                <div className="flex items-center gap-2 justify-end">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider group-hover:text-blue-300 transition-colors">Meu Perfil</p>
                  {isAdmin && (
                    <span className="inline-flex items-center gap-1 text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full font-bold">
                      <Shield className="w-2.5 h-2.5" /> Admin
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors truncate max-w-[180px]">
                  {user?.email?.split('@')[0] || 'Usuário'}
                </p>
              </Link>
            </div>

            {/* Botões Desktop - Voltar/Admin */}
            <div className="hidden md:flex items-center gap-1">
              {isAdmin && (
                <Link
                  to={isAdminPage ? '/' : '/admin'}
                  className={`p-2 rounded-full transition-all border border-transparent ${
                    isAdminPage ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                  title={isAdminPage ? 'Voltar ao Início' : 'Painel do Administrador'}
                >
                  {isAdminPage ? <Home className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
                </Link>
              )}
              {!isAdminPage && !isProfilePage && !isTutorialPage && !isFeedbackPage && showHomeButton && onGoHome && (
                <button
                  onClick={onGoHome}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-300 hover:text-white"
                  title="Voltar ao Início"
                >
                  <Home className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="w-px h-6 bg-white/10 hidden md:block mx-1"></div>

            {/* Ações Universais (Mobile e Desktop) */}
            <NotificationBell />

            <button
              onClick={() => signOut()}
              className="p-2 hover:bg-rose-500/20 hover:text-rose-300 rounded-full transition-colors text-gray-300"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Nav - Azul Petróleo - Design Pílulas */}
      {!isAdminPage && !isProfilePage && (
        <div className="bg-[#004157] text-gray-200 border-b border-[#002f3e] px-2 sm:px-6 relative z-30 shadow-inner">
          <div className="max-w-7xl mx-auto flex items-center justify-start md:justify-center gap-2 overflow-x-auto no-scrollbar py-2.5 px-2 snap-x">
            
            {/* Dropdown Ferramentas */}
            <div className="relative shrink-0 snap-start" ref={toolsRef}>
              <button
                onClick={() => {
                  setToolsOpen(!toolsOpen);
                  setWhatsappOpen(false);
                }}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border transition-all text-xs sm:text-sm font-semibold shadow-sm ${
                  toolsOpen || currentPage === 'calculator' 
                  ? 'bg-blue-500/20 border-blue-400/30 text-blue-100' 
                  : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'
                }`}
              >
                <Wrench className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Ferramentas</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 shrink-0 opacity-70 ${toolsOpen ? 'rotate-180' : ''}`} />
              </button>

              {toolsOpen && (
                <div className="absolute left-0 mt-3 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2 duration-150 z-50 overflow-hidden">
                  <div className="px-3 pb-2 mb-2 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Recursos Úteis</div>
                  
                  <button
                    onClick={() => {
                      onNavigateToCalculator?.();
                      setToolsOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center gap-3 text-sm font-medium text-gray-700 group"
                  >
                    <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-200 transition-colors"><Calculator className="w-4 h-4" /></div>
                    Calculadora de Notas
                  </button>

                  <a
                    href="/calendario-academico.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setToolsOpen(false)}
                    className="w-full text-left px-4 py-3 hover:bg-emerald-50 hover:text-emerald-700 transition-colors flex items-center justify-between text-sm font-medium text-gray-700 group"
                  >
                    <span className="flex items-center gap-3">
                      <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg group-hover:bg-emerald-200 transition-colors"><Calendar className="w-4 h-4" /></div>
                      Calendário Acadêmico
                    </span>
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>

                  <a
                    href="/calendario-de-provas.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setToolsOpen(false)}
                    className="w-full text-left px-4 py-3 hover:bg-amber-50 hover:text-amber-700 transition-colors flex items-center justify-between text-sm font-medium text-gray-700 group"
                  >
                    <span className="flex items-center gap-3">
                      <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg group-hover:bg-amber-200 transition-colors"><FileText className="w-4 h-4" /></div>
                      Calendário de Provas
                    </span>
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </div>
              )}
            </div>

            {/* Dropdown WhatsApp */}
            <div className="relative shrink-0 snap-start" ref={whatsappRef}>
              <button
                onClick={() => {
                  setWhatsappOpen(!whatsappOpen);
                  setToolsOpen(false);
                }}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border transition-all text-xs sm:text-sm font-semibold shadow-sm ${
                  whatsappOpen 
                  ? 'bg-green-500/20 border-green-400/30 text-green-100' 
                  : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'
                }`}
              >
                <svg className="w-3.5 h-3.5 text-green-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span>Comunidade</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 shrink-0 opacity-70 ${whatsappOpen ? 'rotate-180' : ''}`} />
              </button>

              {whatsappOpen && (
                <div className="absolute left-0 md:-left-1/2 mt-3 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2 duration-150 z-50 overflow-hidden">
                  <div className="px-3 pb-2 mb-2 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Grupos do WhatsApp</div>
                  
                  <a
                    href="https://chat.whatsapp.com/LJ7stNpuLzf4DI2UqogMvb"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setWhatsappOpen(false)}
                    className="w-full text-left px-4 py-3 hover:bg-green-50 hover:text-green-700 transition-colors flex items-center justify-between text-sm font-medium text-gray-700 group"
                  >
                    <span className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <span className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></span>
                      </div>
                      <div className="flex flex-col">
                        <span className="leading-none mb-1">Geral - Contábeis</span>
                        <span className="text-[10px] text-gray-400 font-normal">Chat aberto para todos</span>
                      </div>
                    </span>
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>

                  <a
                    href="https://chat.whatsapp.com/FJ9rXB2NAorEpSk1gSgaxP?mode=ac_t"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setWhatsappOpen(false)}
                    className="w-full text-left px-4 py-3 hover:bg-green-50 hover:text-green-700 transition-colors flex items-center justify-between text-sm font-medium text-gray-700 group"
                  >
                    <span className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <span className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></span>
                      </div>
                      <div className="flex flex-col">
                        <span className="leading-none mb-1">Por Disciplinas</span>
                        <span className="text-[10px] text-gray-400 font-normal">Grupos específicos das matérias</span>
                      </div>
                    </span>
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </div>
              )}
            </div>

            {/* Link Tutorial */}
            <Link
              to="/tutorial"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-transparent bg-white/5 hover:bg-white/10 hover:border-white/10 text-amber-300 hover:text-amber-200 transition-all shrink-0 snap-start text-xs sm:text-sm font-semibold shadow-sm"
            >
              <HelpCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Tutorial</span>
            </Link>

            {/* Link Erros/Sugestões */}
            <Link
              to="/feedback"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-transparent bg-white/5 hover:bg-white/10 hover:border-white/10 text-rose-300 hover:text-rose-200 transition-all shrink-0 snap-start text-xs sm:text-sm font-semibold shadow-sm"
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span>Feedback</span>
            </Link>

          </div>
        </div>
      )}
    </header>
  );
}