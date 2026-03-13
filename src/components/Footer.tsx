export function Footer() {
  return (
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
            Plataforma colaborativa para estudantes de Ciências Contábeis. 
            <br />
            Criado com carinho por uma futura contadora, jornalista e (wannabe) programadora ❤️ 
          </p>
        </div>

        <div className="pt-4 flex justify-center items-center gap-4 opacity-40">
          {/* Removendo logo pequena do footer */}
          <span className="text-[10px] font-medium tracking-tighter text-gray-500">© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}