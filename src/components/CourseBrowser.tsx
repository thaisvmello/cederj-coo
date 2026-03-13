export default function CourseBrowser() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <header className="bg-[#00394a] text-white px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src="/57002beae21c30a2d583825b8ea17010.png"               alt="Logo Acervo Acadêmico" 
              className="h-14 w-auto object-contain" 
            />
            <div className="border-l border-white/20 pl-4">
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight">
                Acervo Acadêmico
              </h1>
              <p className="text-xs sm:text-sm font-medium text-blue-300/80 uppercase tracking-[0.2em] mt-0.5">
                Ciências Contábeis
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-0.5">Usuário</p>
              <p className="text-sm font-bold text-white">usuario@exemplo.com</p>
            </div>
            <button 
              onClick={() => {}}
              className="p-2.5 hover:bg-white/10 rounded-full transition-all text-gray-400 hover:text-white border border-transparent hover:border-white/10"
              title="Sair"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Bem-vindo ao Acervo Acadêmico</h1>
          <p className="text-lg text-gray-600">
            Plataforma colaborativa de materiais para o curso de Ciências Contábeis do CEDERJ.
          </p>
        </div>
      </main>
      <footer className="bg-[#103d51] text-gray-300 py-8 mt-12 border-t border-[#1a4b5f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
              Acervo Acadêmico — Ciências Contábeis
            </p>
          </div>
          <div className="pt-2">
            {/* Removendo logos das instituições */}
          </div>
          <div className="space-y-1">
            <p className="text-[11px] text-gray-400 max-w-2xl mx-auto leading-relaxed font-medium">
              Plataforma colaborativa para estudantes de Ciências Contábeis.               <br />
              Criado com carinho por uma contadora, jornalista e (wannabe) programadora ❤️ 
            </p>
          </div>
          <div className="pt-4 flex justify-center items-center gap-4 opacity-40">
            {/* Removendo logo pequena do footer */}
            <span className="text-[10px] font-medium tracking-tighter text-gray-500">© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}