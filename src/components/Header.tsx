import { useAuth } from '../contexts/AuthContext';
import { LogOut, Calculator } from 'lucide-react';

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="w-full z-40">
      {/* Main Header */}
      <div className="bg-[#00394a] text-white px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
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
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-0.5">Usuário</p>
              <p className="text-sm font-bold text-white">{user?.email}</p>
            </div>
            <button 
              onClick={signOut}
              className="p-2.5 hover:bg-white/10 rounded-full transition-all text-gray-400 hover:text-white border border-transparent hover:border-white/10"
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
            className="flex items-center gap-1.5 hover:text-white transition-colors py-1"
          >
            <Calculator className="w-3.5 h-3.5 text-blue-400" />
            Calculadora de Notas
          </a>
        </div>
      </div>
    </header>
  );
}