export function Footer() {
  return (
    <footer className="bg-[#0f172a] text-gray-400 py-12 mt-20 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
            CEDERJ — Centro de Educação Superior a Distância do Estado do Rio de Janeiro
          </p>
          <div className="h-px w-12 bg-blue-500/30 mx-auto"></div>
          <p className="text-[11px] text-gray-500 max-w-2xl mx-auto leading-relaxed font-medium">
            Plataforma colaborativa para estudantes de Ciências Contábeis. 
            <br />
            Criado com carinho por uma contadora, jornalista e programadora ❤️ 
            <span className="block mt-1 text-blue-400/60">thaisverissimomello@gmail.com</span>
          </p>
        </div>
        
        <div className="pt-8 space-y-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">
            Instituições de Ensino Superior Consorciadas
          </p>
          <div className="relative group">
            <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <img 
              src="/instituicoes-consorciadas.png" 
              alt="Instituições Consorciadas" 
              className="relative max-w-4xl w-full mx-auto opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700 ease-in-out transform hover:scale-[1.02]" 
            />
          </div>
        </div>

        <div className="pt-8 flex justify-center items-center gap-4 opacity-30">
          <img src="/cederjlogo.png" alt="CEDERJ" className="h-6 brightness-0 invert" />
          <span className="text-[10px] font-medium tracking-tighter">© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}