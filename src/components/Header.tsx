import { useState, useEffect } from 'react';
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
  User,
} from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { useAuth } from '../contexts/AuthContext';
import { NotificationBell } from './NotificationBell';

/* ------------------------------------------------------------------ */
/* Dados                                                               */
/* ------------------------------------------------------------------ */

const CALENDARS = [
  { label: 'Calendário Acadêmico', href: '/calendario-academico.pdf', icon: Calendar, color: 'text-emerald-500' },
  { label: 'Calendário de Provas', href: '/calendario-de-provas.pdf', icon: FileText, color: 'text-amber-500' },
];

const WHATSAPP_GROUPS = [
  { label: 'Grupo Geral - Contábeis CEDERJ', href: 'https://chat.whatsapp.com/LJ7stNpuLzf4DI2UqogMvb' },
  { label: 'Comunidade de Disciplinas', href: 'https://chat.whatsapp.com/FJ9rXB2NAorEpSk1gSgaxP?mode=ac_t' },
];

/* ------------------------------------------------------------------ */
/* Estilos                                                             */
/* ------------------------------------------------------------------ */

const ring =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00394a]/40 focus-visible:ring-offset-1';

// "Chip" no celular, botão discreto no desktop
const navChip = (active: boolean) =>
  `inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors lg:rounded-lg lg:border-transparent lg:px-3 ${
    active
      ? 'border-[#00394a] bg-[#00394a] text-white lg:bg-[#00394a]/10 lg:text-[#00394a]'
      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 lg:text-slate-600 lg:hover:bg-slate-100 lg:hover:text-[#00394a]'
  } ${ring}`;

// Itens dos painéis (bottom sheet no celular, popover no desktop)
const sheetItem = `flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left text-[15px] font-medium text-slate-700 transition-colors hover:bg-slate-50 active:bg-slate-100 lg:px-4 lg:py-2.5 lg:text-sm ${ring}`;

// Painel: sobe de baixo no celular, vira popover a partir de lg
const sheetPanel =
  'fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-white pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl animate-in fade-in duration-150 lg:absolute lg:inset-x-auto lg:bottom-auto lg:left-0 lg:top-full lg:mt-2 lg:w-64 lg:rounded-xl lg:border lg:border-slate-200 lg:pb-1.5 lg:shadow-xl';

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

type MenuId = 'tools' | 'whatsapp' | 'user' | null;

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

  const [open, setOpen] = useState<MenuId>(null);
  const toggle = (id: Exclude<MenuId, null>) => setOpen((cur) => (cur === id ? null : id));
  const close = () => setOpen(null);

  // Fecha com Esc e ao trocar de rota
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    setOpen(null);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 border-t-[3px] border-t-[#00394a] bg-white">
      {/* Fundo que captura cliques fora (escurece só no celular quando é um sheet) */}
      {open && (
        <button
          type="button"
          aria-label="Fechar"
          tabIndex={-1}
          onClick={close}
          className={`fixed inset-0 z-40 cursor-default ${
            open === 'user' ? 'bg-transparent' : 'bg-slate-900/40 lg:bg-transparent'
          }`}
        />
      )}

      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-2.5 px-3 py-2.5 sm:px-6 lg:flex-nowrap lg:py-3">
        {/* ------------------------------ Marca ------------------------------ */}
        <Link
          to="/"
          onClick={onGoHome}
          className={`flex min-w-0 flex-1 items-center gap-2.5 rounded-lg lg:flex-none ${ring}`}
        >
          <span className="grid h-10 min-w-10 shrink-0 place-items-center rounded-xl bg-[#00394a] px-1.5">
            <img
              src="/57002beae21c30a2d583825b8ea17010.png"
              alt="Logo Acervo Acadêmico"
              className="h-7 w-auto object-contain"
            />
          </span>
          <span className="truncate text-[17px] font-bold tracking-tight text-[#00394a] sm:text-xl">
            Acervo Acadêmico
          </span>
        </Link>

        {/* --------- Ações à direita (ficam na 1ª linha, ao lado da marca) --------- */}
        <div className="flex shrink-0 items-center gap-1.5 lg:order-3">
          <NotificationBell />

          <div className="relative">
            <button
              type="button"
              onClick={() => toggle('user')}
              aria-expanded={open === 'user'}
              aria-haspopup="menu"
              aria-label="Menu do usuário"
              className={`flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-2 transition-colors hover:bg-slate-50 ${
                open === 'user' ? 'bg-slate-50' : ''
              } ${ring}`}
            >
              <span className="relative grid h-8 w-8 place-items-center rounded-full bg-[#00394a] text-sm font-semibold text-white">
                {initial}
                {isAdmin && (
                  <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-purple-600 ring-2 ring-white">
                    <Shield className="h-2.5 w-2.5 text-white" />
                  </span>
                )}
              </span>
              <span className="hidden max-w-[160px] truncate text-sm font-medium text-slate-700 xl:block">
                {email}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                  open === 'user' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {open === 'user' && (
              <div
                role="menu"
                className="absolute right-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl animate-in fade-in slide-in-from-top-1 duration-150"
              >
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="truncate text-sm font-semibold text-slate-800">{email || 'Minha conta'}</p>
                  {isAdmin && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-medium text-purple-700">
                      <Shield className="h-3 w-3" />
                      Administrador
                    </span>
                  )}
                </div>

                <div className="py-1.5">
                  <Link to="/profile" role="menuitem" className={sheetItem}>
                    <span className="flex items-center gap-3">
                      <User className="h-4 w-4 text-slate-500" />
                      Meu perfil
                    </span>
                  </Link>

                  {showHome && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        close();
                        onGoHome?.();
                      }}
                      className={sheetItem}
                    >
                      <span className="flex items-center gap-3">
                        <Home className="h-4 w-4 text-slate-500" />
                        Voltar ao início
                      </span>
                    </button>
                  )}

                  {isAdmin && (
                    <Link to={isAdminPage ? '/' : '/admin'} role="menuitem" className={sheetItem}>
                      <span className="flex items-center gap-3">
                        {isAdminPage ? (
                          <Home className="h-4 w-4 text-slate-500" />
                        ) : (
                          <Settings className="h-4 w-4 text-purple-500" />
                        )}
                        {isAdminPage ? 'Voltar ao início' : 'Painel do administrador'}
                      </span>
                    </Link>
                  )}
                </div>

                <div className="border-t border-slate-100 py-1.5">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      close();
                      signOut();
                    }}
                    className={`${sheetItem} !text-red-600 hover:!bg-red-50`}
                  >
                    <span className="flex items-center gap-3">
                      <LogOut className="h-4 w-4" />
                      Sair
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ------------- Navegação: 2ª linha (chips) no celular, inline no desktop ------------- */}
        {showNav && (
          <nav
            aria-label="Navegação principal"
            className="-mx-3 order-last flex w-[calc(100%+1.5rem)] items-center gap-2 overflow-x-auto px-3 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:-mx-6 sm:w-[calc(100%+3rem)] sm:px-6 lg:order-2 lg:mx-0 lg:w-auto lg:flex-1 lg:gap-1 lg:overflow-visible lg:px-0 lg:pb-0 lg:pl-4 [&::-webkit-scrollbar]:hidden"
          >
            {/* Ferramentas */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => toggle('tools')}
                aria-expanded={open === 'tools'}
                aria-haspopup="menu"
                className={navChip(open === 'tools' || currentPage === 'calculator')}
              >
                <Wrench className="h-4 w-4" />
                Ferramentas
                <ChevronDown
                  className={`h-3.5 w-3.5 opacity-60 transition-transform duration-200 ${
                    open === 'tools' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {open === 'tools' && (
                <div role="menu" className={sheetPanel}>
                  <div className="mx-auto mb-1 mt-2.5 h-1 w-10 rounded-full bg-slate-200 lg:hidden" />
                  <p className="px-5 pb-1 pt-2 text-sm font-semibold text-slate-800 lg:hidden">Ferramentas</p>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      close();
                      onNavigateToCalculator?.();
                    }}
                    className={sheetItem}
                  >
                    <span className="flex items-center gap-3">
                      <Calculator className="h-5 w-5 text-blue-500 lg:h-4 lg:w-4" />
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
                      onClick={close}
                      className={sheetItem}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className={`h-5 w-5 lg:h-4 lg:w-4 ${color}`} />
                        {label}
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* WhatsApp */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => toggle('whatsapp')}
                aria-expanded={open === 'whatsapp'}
                aria-haspopup="menu"
                className={navChip(open === 'whatsapp')}
              >
                <WhatsAppIcon className="h-4 w-4" />
                WhatsApp
                <ChevronDown
                  className={`h-3.5 w-3.5 opacity-60 transition-transform duration-200 ${
                    open === 'whatsapp' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {open === 'whatsapp' && (
                <div role="menu" className={`${sheetPanel} lg:w-72`}>
                  <div className="mx-auto mb-1 mt-2.5 h-1 w-10 rounded-full bg-slate-200 lg:hidden" />
                  <p className="px-5 pb-1 pt-2 text-sm font-semibold text-slate-800 lg:hidden">
                    Grupos de WhatsApp
                  </p>

                  {WHATSAPP_GROUPS.map(({ label, href }) => (
                    <a
                      key={href}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      role="menuitem"
                      onClick={close}
                      className={sheetItem}
                    >
                      <span className="flex items-center gap-3">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
                        {label}
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            <Link to="/tutorial" className={navChip(isTutorialPage)}>
              <HelpCircle className="h-4 w-4" />
              Tutorial
            </Link>

            <Link to="/feedback" className={navChip(isFeedbackPage)}>
              <MessageSquare className="h-4 w-4" />
              Erros/Sugestões
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
