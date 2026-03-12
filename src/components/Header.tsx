import { useAuth } from '../contexts/AuthContext';
import { LogOut, BookOpen, GraduationCap, Calculator } from 'lucide-react';

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="w-full z-40">
      {/* Main Header */}
      <div className="bg-[#0f172a] text-white px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/cederjlogo.png"
              alt="CEDERJ Logo"
              className="h-10 brightness-0 invert"
            />
            <div className="border-l border-gray-600 pl-4">
              <h1 className="text-lg font-bold leading-tight">Ciências Contábeis</h1>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Acervo Acadêmico</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-gray-300">{user?.email}</p>
            </div>
            <button
              onClick={signOut}
              className="p-2 hover:bg-gray-800 rounded-full transition text-gray-400 hover:text-white"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Nav */}
      <div className="bg-[#1e293b] text-gray-300 border-b border-gray-800 px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex items-center gap-6 text-xs font-medium overflow-x-auto whitespace-nowrap no-scrollbar">
          <a
            href="https://graduacao.cederj.edu.br/login/index.php"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-white transition"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Plataforma de Estudos
          </a>
          <div className="w-px h-3 bg-gray-700"></div>
          <a
            href="https://sistacad.cederj.edu.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-white transition"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Sistema Acadêmico (SISTACAD)
          </a>
          <div className="w-px h-3 bg-gray-700"></div>
          <a
            href="https://script.google.com/macros/s/AKfycbwyoOeDtL-nGdXmFstf7nHNJtC0j0STrxGwuRvnKV34K7tVvi6PEhqIe6uhSnXLe-Q1/exec"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-white transition"
          >
            <Calculator className="w-3.5 h-3.5" />
            Calculadora de Notas
          </a>
        </div>
      </div>
    </header>
  );
}