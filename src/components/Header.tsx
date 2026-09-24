import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LogOut,
  Calculator,
  Shield,
  Home,
  Settings,
  ChevronDown,
  Calendar,
  FileText,
  HelpCircle,
  ExternalLink,
  Wrench,
  MessageSquare,
  Menu,
  X,
} from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { useAuth } from '../contexts/AuthContext';
import { NotificationBell } from './NotificationBell';

/* ------------------------------------------------------------------ */
/* Dados                                                               */
/* ------------------------------------------------------------------ */

const CALENDARS = [
  {
    label: 'Calendário Acadêmico',
    href: '/calendario-academico.pdf',
    icon: Calendar,
    color: 'text-emerald-500',
  },
  {
    label: 'Calendário de Provas',
    href: '/calendario-de-provas.pdf',
    icon: FileText,
    color: 'text-amber-500',
  },
];

const WHATSAPP_GROUPS = [
  {
    label: 'Grupo Geral - Contábeis CEDERJ',
    href: 'https://chat.whatsapp.com/LJ7stNpuLzf4DI2UqogMvb',
  },
  {
    label: 'Comunidade de Disciplinas',
    href: 'https://chat.whatsapp.com/FJ9rXB2NAorEpSk1gSgaxP?mode=ac_t',
  },
];

/* ------------------------------------------------------------------ */
/* Estilos reutilizáveis                                               */
/* ------------------------------------------------------------------ */

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60';

// Botão redondo só com ícone (40x40)
const iconBtn = `inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white ${focusRing}`;

// Item de navegação do desktop
const navItem = `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white ${focusRing}`;
const navItemActive = 'bg-white/10 text-white';

// Item dentro dos dropdowns (desktop)
const dropdownItem =
  'flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#00394a]';

// Item do menu mobile (alvo de toque >= 44px)
const mobileItem = `flex w-full items-center gap-3 rounded-lg px-3 py-3 text-[15px] font-medium text-white/90 transition-colors hover:bg-white/10 active:bg-white/15 ${focusRing}`;

function WhatsAppIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Componente                                                          */
/* ------------------------------------------------------------------ */

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
  const { user, signOut } = useAuth();
  const location = useLocation();

  const isAdminPage = location.pathname === '/admin';
  const isProfilePage = location.pathname === '/profile';
  const isTutorialPage = location.pathname === '/tutorial';
  const isFeedbackPage = location.pathname === '/feedback';

  const showNav = !isAdminPage && !isProfilePage;
  const showHome =
    !isAdminPage && !isProfilePage && !isTutorialPage && !isFeedbackPage && showHomeButton && !!onGoHome;

  const email = user?.email || '';
  const initial = (email[0] || '?').toUpperCase();

  const [openMenu, setOpenMenu] = useState<'tools' | 'whatsapp' | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fecha tudo com Esc
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  // Fecha menus ao trocar de rota
  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
  }, [location.pathname]);

  // Trava o scroll da página enquanto o menu mobile está aberto
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  const closeAll = () => {
    setOpenMenu(null);
    setMobileOpen(false);
  };

  const handleCalculator = () => {
    onNavigateToCalculator?.();
    closeAll();
  };

  const handleGoHome = () => {
    onGoHome?.();
    closeAll();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#00394a] text-white shadow-md shadow-black/10">
      {/* ============================ Barra principal ============================ */}
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-3 sm:h-16 sm:px-6">
        {/* Marca */}
        <Link
          to="/"
          onClick={onGoHome}
          className={`flex min-w-0 items-center gap-2.5 rounded-lg transition-opacity hover:opacity-80 ${focusRing}`}
        >
          <img
            src="/57002beae21c30a2d583825b8ea17010.png"
            alt="Logo Acervo Acadêmico"
            className="h-8 w-auto shrink-0 object-contain sm:h-9"
          />
          <span className="hidden h-6 w-px bg-white/20 sm:block" aria-hidden="true" />
          <span className="truncate text-base font-bold tracking-tight sm:text-lg lg:text-xl">
            Acervo Acadêmico
          </span>
        </Link>

        {/* Navegação (desktop) */}
        {showNav && (
          <nav
            ref={navRef}
            aria-label="Navegação principal"
            className="hidden min-w-0 flex-1 items-center gap-1 lg:flex"
          >
            {/* Ferramentas */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenMenu(openMenu === 'tools' ? null : 'tools')}
                aria-expanded={openMenu === 'tools'}
                aria-haspopup="menu"
                className={`${navItem} ${
                  openMenu === 'tools' || currentPage === 'calculator' ? navItemActive : ''
                }`}
              >
                <Wrench className="h-4 w-4 text-white/60" />
                Ferramentas
                <ChevronDown
                  className={`h-3.5 w-3.5 text-white/60 transition-transform duration-200 ${
                    openMenu === 'tools' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {openMenu === 'tools' && (
                <div
                  role="menu"
                  className="absolute left-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150"
                >
                  <button type="button" role="menuitem" onClick={handleCalculator} className={dropdownItem}>
                    <span className="flex items-center gap-2.5">
                      <Calculator className="h-4 w-4 text-blue-500" />
                      Calculadora de Notas
                    </span>
                  </button>

                  {CALENDARS.map(({ label, href, icon: Icon, color }) => (
                    <a
                      key={href}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      role="menuitem"
                      onClick={() => setOpenMenu(null)}
                      className={dropdownItem}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className={`h-4 w-4 ${color}`} />
                        {label}
                      </span>
                      <ExternalLink className="h-3 w-3 text-slate-400" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* WhatsApp */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenMenu(openMenu === 'whatsapp' ? null : 'whatsapp')}
                aria-expanded={openMenu === 'whatsapp'}
                aria-haspopup="menu"
                className={`${navItem} ${openMenu === 'whatsapp' ? navItemActive : ''}`}
              >
                <WhatsAppIcon className="h-4 w-4 text-white/60" />
                WhatsApp
                <ChevronDown
                  className={`h-3.5 w-3.5 text-white/60 transition-transform duration-200 ${
                    openMenu === 'whatsapp' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {openMenu === 'whatsapp' && (
                <div
                  role="menu"
                  className="absolute left-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150"
                >
                  {WHATSAPP_GROUPS.map(({ label, href }) => (
                    <a
                      key={href}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      role="menuitem"
                      onClick={() => setOpenMenu(null)}
                      className={dropdownItem}
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
                        {label}
                      </span>
                      <ExternalLink className="h-3 w-3 shrink-0 text-slate-400" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            <Link to="/tutorial" className={`${navItem} ${isTutorialPage ? navItemActive : ''}`}>
              <HelpCircle className="h-4 w-4 text-white/60" />
              Tutorial
            </Link>

            <Link to="/feedback" className={`${navItem} ${isFeedbackPage ? navItemActive : ''}`}>
              <MessageSquare className="h-4 w-4 text-white/60" />
              Erros/Sugestões
            </Link>
          </nav>
        )}

        {/* Ações à direita */}
        <div className="flex shrink-0 items-center gap-1">
          {/* Usuário (desktop) */}
          <Link
            to="/profile"
            title={email || 'Meu perfil'}
            className={`hidden items-center gap-2.5 rounded-full p-1 transition-colors hover:bg-white/10 lg:flex xl:pr-3 ${focusRing}`}
          >
            <span className="relative grid h-8 w-8 place-items-center rounded-full bg-white/15 text-sm font-semibold">
              {initial}
              {isAdmin && (
                <span className="absolute -right-0.5 -top-0.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-purple-500 ring-2 ring-[#00394a]">
                  <Shield className="h-2 w-2 text-white" />
                </span>
              )}
            </span>
            <span className="hidden max-w-[180px] truncate text-sm font-medium text-white/90 xl:block">
              {email}
            </span>
          </Link>

          {/* Admin (desktop) */}
          {isAdmin && (
            <Link
              to={isAdminPage ? '/' : '/admin'}
              title={isAdminPage ? 'Voltar ao Início' : 'Painel do Administrador'}
              aria-label={isAdminPage ? 'Voltar ao Início' : 'Painel do Administrador'}
              className={`${iconBtn} hidden lg:inline-flex ${
                isAdminPage ? '!bg-purple-600 !text-white hover:!bg-purple-700' : ''
              }`}
            >
              {isAdminPage ? <Home className="h-5 w-5" /> : <Settings className="h-5 w-5" />}
            </Link>
          )}

          {/* Início (desktop) */}
          {showHome && (
            <button
              type="button"
              onClick={onGoHome}
              title="Voltar ao Início"
              aria-label="Voltar ao Início"
              className={`${iconBtn} hidden lg:inline-flex`}
            >
              <Home className="h-5 w-5" />
            </button>
          )}

          <NotificationBell />

          {/* Sair (desktop) */}
          <button
            type="button"
            onClick={() => signOut()}
            title="Sair"
            aria-label="Sair"
            className={`${iconBtn} hidden lg:inline-flex`}
          >
            <LogOut className="h-5 w-5" />
          </button>

          {/* Botão do menu (mobile / tablet) */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
            className={`${iconBtn} lg:hidden`}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* ============================ Menu mobile ============================ */}
      {mobileOpen && (
        <>
          {/* Fundo escurecido (clique fecha) */}
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-x-0 bottom-0 top-14 z-30 cursor-default bg-black/40 sm:top-16 lg:hidden"
          />

          <div
            id="mobile-menu"
            className="absolute inset-x-0 top-full z-40 max-h-[calc(100dvh-3.5rem)] overflow-y-auto overscroll-contain border-t border-white/10 bg-[#00394a] pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-h-[calc(100dvh-4rem)] lg:hidden"
          >
            <div className="mx-auto max-w-7xl space-y-1 px-3 py-3 sm:px-6">
              {/* Perfil */}
              <Link
                to="/profile"
                className="mb-2 flex items-center gap-3 rounded-xl bg-white/5 p-3 transition-colors hover:bg-white/10"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15 text-base font-semibold">
                  {initial}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{email || 'Meu perfil'}</span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-xs text-white/60">
                    {isAdmin && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/25 px-1.5 py-0.5 text-[11px] font-medium text-purple-200">
                        <Shield className="h-3 w-3" />
                        Admin
                      </span>
                    )}
                    Ver meu perfil
                  </span>
                </span>
              </Link>

              {showNav && (
                <>
                  <p className="px-3 pb-1 pt-3 text-xs font-medium text-white/50">Ferramentas</p>

                  <button type="button" onClick={handleCalculator} className={mobileItem}>
                    <Calculator className="h-5 w-5 text-blue-300" />
                    Calculadora de Notas
                  </button>

                  {CALENDARS.map(({ label, href, icon: Icon, color }) => (
                    <a
                      key={href}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={closeAll}
                      className={mobileItem}
                    >
                      <Icon className={`h-5 w-5 ${color.replace('500', '300')}`} />
                      <span className="flex-1">{label}</span>
                      <ExternalLink className="h-3.5 w-3.5 text-white/40" />
                    </a>
                  ))}

                  <p className="px-3 pb-1 pt-4 text-xs font-medium text-white/50">Comunidade</p>

                  {WHATSAPP_GROUPS.map(({ label, href }) => (
                    <a
                      key={href}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={closeAll}
                      className={mobileItem}
                    >
                      <WhatsAppIcon className="h-5 w-5 text-green-400" />
                      <span className="flex-1">{label}</span>
                      <ExternalLink className="h-3.5 w-3.5 text-white/40" />
                    </a>
                  ))}

                  <p className="px-3 pb-1 pt-4 text-xs font-medium text-white/50">Ajuda</p>

                  <Link
                    to="/tutorial"
                    className={`${mobileItem} ${isTutorialPage ? 'bg-white/10' : ''}`}
                  >
                    <HelpCircle className="h-5 w-5 text-amber-300" />
                    Tutorial
                  </Link>

                  <Link
                    to="/feedback"
                    className={`${mobileItem} ${isFeedbackPage ? 'bg-white/10' : ''}`}
                  >
                    <MessageSquare className="h-5 w-5 text-rose-300" />
                    Erros/Sugestões
                  </Link>
                </>
              )}

              {/* Conta */}
              <div className="mt-3 space-y-1 border-t border-white/10 pt-3">
                {showHome && (
                  <button type="button" onClick={handleGoHome} className={mobileItem}>
                    <Home className="h-5 w-5 text-white/70" />
                    Voltar ao Início
                  </button>
                )}

                {isAdmin && (
                  <Link to={isAdminPage ? '/' : '/admin'} className={mobileItem}>
                    {isAdminPage ? (
                      <Home className="h-5 w-5 text-white/70" />
                    ) : (
                      <Settings className="h-5 w-5 text-purple-300" />
                    )}
                    {isAdminPage ? 'Voltar ao Início' : 'Painel do Administrador'}
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => {
                    closeAll();
                    signOut();
                  }}
                  className={`${mobileItem} text-red-200 hover:bg-red-500/10`}
                >
                  <LogOut className="h-5 w-5" />
                  Sair
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
