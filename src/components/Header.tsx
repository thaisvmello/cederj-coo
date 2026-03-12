import { useAuth } from '../contexts/AuthContext';
import { LogOut, Calculator } from 'lucide-react';

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="w-full z-40">
      {/* Main Header */}
      <div className="bg-[#00394a] text-white px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Nova logo oficial */}
            <img 
              src="dyad-media://media/cederj-coo/.dyad/media/67e67f1b067bd9be1b349ec7ee9384ed.png" 
              alt="CEDERJ Logo" 
              className="h-20 brightness-0 invert"
            />
            <div className="border-l border-gray-600 pl-6">
              <h1 className="text-3xl font-bold leading-tight">Acervo de Materiais</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-300">{user?.email}</p>
            </div>
            <button
              onClick={signOut}
              className="p-2 hover:bg-white/10 rounded-full transition text-gray-400 hover:text-white"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Nav */}
      <div className="bg-[#004157] text-gray-300 border-b border-gray-800 px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex items-center gap-6 text-sm font-medium overflow-x-auto whitespace-nowrap no-scrollbar">
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