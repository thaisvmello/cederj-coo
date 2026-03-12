export function Footer() {
  return (
    <footer className="bg-[#00394a] text-gray-300 py-8 mt-12 border-t border-[#1a4b5f]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
            CEDERJ — Centro de Educação Superior a Distância do Estado do Rio de Janeiro
          </p>
          <div className="h-px w-12 bg-blue-400/30 mx-auto"></div>
        </div>
        
        <div className="pt-2">
          <div className="flex justify-center">
            <img 
              src="/logos-consorciadas.png" 
              alt="Instituições Consorciadas" 
              className="max-w-4xl w-full mx-auto" 
            />
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[11px] text-gray-400 max-w-2xl mx-auto leading-relaxed font-medium">
            Plataforma colaborativa para estudantes de Ciências Contábeis. 
            <br />
            Criado com carinho por uma contadora, jornalista e (wannabe) programadora ❤️ 
            <span className="block mt-1 text-blue-300/60">thaisverissimomello@gmail.com</span>
          </p>
        </div>

        <div className="pt-4 flex justify-center items-center gap-4 opacity-40">
          <img src="/cederjlogo.png" alt="CEDERJ" className="h-6 brightness-0 invert" />
          <span className="text-[10px] font-medium tracking-tighter text-gray-500">© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}