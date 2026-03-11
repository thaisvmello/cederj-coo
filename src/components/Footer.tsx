export function Footer() {
  return (
    <footer className="bg-[#0f172a] text-gray-400 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <p className="text-xs font-medium uppercase tracking-widest">
          CEDERJ — Centro de Educação Superior a Distância do Estado do Rio de Janeiro
        </p>
        <p className="text-[10px] text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Criado com carinho por uma contadora, jornalista e programadora ❤️ thaisverissimomello@gmail.com
        </p>
        
        <div className="pt-8 flex flex-wrap justify-center items-center gap-x-8 gap-y-4 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
          <img src="/cederjlogo.png" alt="CEDERJ" className="h-8 brightness-0 invert" />
        </div>
      </div>
    </footer>
  );
}