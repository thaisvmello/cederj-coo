import { useState, useRef, useEffect } from 'react';
import { useAdmin } from '../hooks/useAdmin';
import { LogOut, Calculator, Shield, Home, Settings, Calendar, FileText, HelpCircle, ExternalLink, Wrench, Bell } from 'lucide-react';
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
    <header className="w-full z-40 bg-[#00394a]">
      {/* Main Header */}
      <div className="px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" onClick={onGoHome} className="flex items-center gap-3">
            <img
              src="/57002beae21c30a2d583825b8ea17010.png"
              alt="Logo"
              className="h-8 w-8 object-contain"
            />
            <span className="text-xl font-bold text-white tracking-tight">
              Acervo Acadêmico
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={() => {}}
              className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={() => signOut()}
              className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Grid Nav */}
      {!isAdminPage && !isProfilePage && (
        <div className="px-4 pb-3">
          <div className="max-w-7xl mx-auto grid grid-cols-3 gap-2">
            
            {/* Ferramentas */}
            <div className="relative" ref={toolsRef}>
              <button
                onClick={() => {
                  setToolsOpen(!toolsOpen);
                  setWhatsappOpen(false);
                }}
                className="w-full flex flex-col items-center justify-center gap-1 py-2 bg-white/8 rounded-lg hover:bg-white/15 transition-all text-white"
              >
                <Wrench className="w-4 h-4" />
                <span className="text-[10px] font-medium uppercase">Ferramentas</span>
              </button>

              {toolsOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 text-gray-800 z-50">
                  <button
                    onClick={() => {
                      onNavigateToCalculator?.();
                      setToolsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 hover:text-blue-600 transition flex items-center gap-2.5 text-xs font-semibold"
                  >
                    <Calculator className="w-4 h-4 text-blue-500" />
                    Calculadora de Notas
                  </button>

                  <a
                    href="/calendario-academico.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setToolsOpen(false)}
                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 hover:text-blue-600 transition flex items-center justify-between text-xs font-semibold"
                  >
                    <span className="flex items-center gap-2.5">
                      <Calendar className="w-4 h-4 text-emerald-500" />
                      Calendário Acadêmico
                    </span>
                    <ExternalLink className="w-3 h-3 text-gray-400" />
                  </a>
                </div>
              )}
            </div>

            {/* WhatsApp */}
            <div className="relative" ref={whatsappRef}>
              <button
                onClick={() => {
                  setWhatsappOpen(!whatsappOpen);
                  setToolsOpen(false);
                }}
                className="w-full flex flex-col items-center justify-center gap-1 py-2 bg-white/8 rounded-lg hover:bg-white/15 transition-all text-white"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="text-[10px] font-medium uppercase">WhatsApp</span>
              </button>

              {whatsappOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 text-gray-800 z-50">
                  <a
                    href="https://chat.whatsapp.com/LJ7stNpuLzf4DI2UqogMvb"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setWhatsappOpen(false)}
                    className="w-full text-left px-4 py-2.5 hover:bg-green-50 hover:text-green-700 transition flex items-center justify-between text-xs font-semibold"
                  >
                    Grupo Geral
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Tutorial */}
            <Link
              to="/tutorial"
              className="w-full flex flex-col items-center justify-center gap-1 py-2 bg-white/8 rounded-lg hover:bg-white/15 transition-all text-white"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="text-[10px] font-medium uppercase">Tutorial</span>
            </Link>

          </div>
        </div>
      )}
    </header>
  );
}