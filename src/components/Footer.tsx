export function Footer() {
  return (
    <footer className="bg-white text-gray-600 py-12 mt-20 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
            CEDERJ — Centro de Educação Superior a Distância do Estado do Rio de Janeiro
          </p>
          <div className="h-px w-12 bg-blue-500/20 mx-auto"></div>
          <p className="text-[11px] text-gray-500 max-w-2xl mx-auto leading-relaxed font-medium">
            Plataforma colaborativa para estudantes de Ciências Contábeis. 
            <br />
            Criado com carinho por uma contadora, jornalista e programadora ❤️ 
            <span className="block mt-1 text-blue-600/60">thaisverissimomello@gmail.com</span>
          </p>
        </div>
        
        <div className="pt-4 space-y-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Instituições de Ensino Superior Consorciadas
          </p>
          <div className="flex justify-center">
            <img 
              src="/instituicoes-consorciadas.png" 
              alt="Instituições Consorciadas" 
              className="max-w-4xl w-full mx-auto" 
            />
          </div>
        </div>

        <div className="pt-8 flex justify-center items-center gap-4 opacity-40">
          <img src="/cederjlogo.png" alt="CEDERJ" className="h-6 grayscale" />
          <span className="text-[10px] font-medium tracking-tighter">© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}