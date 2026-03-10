import { useAuth } from '../contexts/AuthContext';
import { LogOut } from 'lucide-react';

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/cederjlogo.png"
              alt="CEDERJ Logo"
              className="h-12"
            />
            <div className="border-l border-gray-300 pl-4">
              <h1 className="text-xl font-bold text-gray-900">Ciências Contábeis</h1>
              <p className="text-xs text-gray-600">Acervo Acadêmico</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.email}</p>
              <p className="text-xs text-gray-500">Conectado</p>
            </div>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg transition font-medium text-sm"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
