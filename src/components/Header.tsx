import { useAdmin } from '../hooks/useAdmin';
import { LogOut, Calculator, Shield, Home, Settings } from 'lucide-react';
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

  return (
    <header className="w-full z-40">
      {/* Main Header */}
      <div className="bg-[#00394a] text-white px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" onClick={onGoHome} className="flex items-center gap-4 hover:opacity-80 transition-opacity">
            <img
              src="/57002beae21c30a2d583825b8ea17010.png"
              alt="Logo Acervo Acadêmico"
              className="h-14 w-auto object-contain"
            />
            <div className="border-l border-white/20 pl-4">
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight">
                Acervo Acadêmico
              </h1>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <Link to="/profile" className="group">
                <div className="flex items-center gap-2 justify-end mb-0.5">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider group-hover:text-blue-400 transition-colors">Usuário</p>
                  {isAdmin && (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-medium">
                      <Shield className="w-3 h-3" />
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">{user?.email || ''}</p>
              </Link>
            </div>

            {isAdmin && (
              <Link
                to={isAdminPage ? '/' : '/admin'}
                className={`p-2.5 rounded-full transition-all border border-transparent ${
                  isAdminPage
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/10'
                }`}
                title={isAdminPage ? 'Voltar ao Início' : 'Painel do Administrador'}
              >
                {isAdminPage ? <Home className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
              </Link>
            )}

            {!isAdminPage && !isProfilePage && showHomeButton && onGoHome && (
              <button
                onClick={onGoHome}
                className="p-2.5 hover:bg-white/10 rounded-full transition-all text-gray-400 hover:text-white border border-transparent hover:border-white/10"
                title="Voltar ao Início"
              >
                <Home className="w-5 h-5" />
              </button>
            )}

            {/* Notification Bell */}
            <NotificationBell />

            <button
              onClick={() => signOut()}
              className="p-2.5 hover:bg-white/10 rounded-full transition-all text-gray-400 hover:text-white border border-transparent hover:border-white/10"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Nav */}
      {!isAdminPage && !isProfilePage && (
        <div className="bg-[#004157] text-gray-300 border-b border-gray-800 px-4 sm:px-6 lg:px-8 py-2">
          <div className="max-w-7xl mx-auto flex items-center gap-6 text-sm font-medium overflow-x-auto whitespace-nowrap no-scrollbar">
            <button
              onClick={onNavigateToCalculator}
              className={`flex items-center gap-1.5 hover:text-white transition-colors py-1 ${
                currentPage === 'calculator' ? 'text-white' : ''
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-blue-400" />
              Calculadora de Notas
            </button>

            <span className="text-gray-600">|</span>

            <a
              href="https://chat.whatsapp.com/LJ7stNpuLzf4DI2UqogMvb"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-white transition-colors py-1"
            >
              <svg className="w-3.5 h-3.5 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Grupo GERAL Contábeis CEDERJ
            </a>

            <a
              href="https://chat.whatsapp.com/FJ9rXB2NAorEpSk1gSgaxP?mode=ac_t"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-white transition-colors py-1"
            >
              <svg className="w-3.5 h-3.5 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Comunidade de Disciplinas
            </a>
          </div>
        </div>
      )}
    </header>
  );
}