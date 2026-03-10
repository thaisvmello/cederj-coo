import { ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-12">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="font-semibold text-white mb-3">Acesso Rápido</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://graduacao.cederj.edu.br/login/index.php"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white hover:underline inline-flex items-center gap-1"
                >
                  Plataforma de Estudos
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://sistacad.cederj.edu.br/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white hover:underline inline-flex items-center gap-1"
                >
                  Sistema Acadêmico
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://script.google.com/macros/s/AKfycbwyoOeDtL-nGdXmFstf7nHNJtC0j0STrxGwuRvnKV34K7tVvi6PEhqIe6uhSnXLe-Q1/exec"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white hover:underline inline-flex items-center gap-1"
                >
                  Calculadora de Notas
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-3">Sobre</h3>
            <p className="text-sm text-gray-400">
              Plataforma colaborativa para armazenamento de materiais de estudo do curso de Ciências Contábeis.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-3">Recursos</h3>
            <ul className="space-y-1 text-sm text-gray-400">
              <li>Compartilhamento seguro</li>
              <li>Visualizador PDF</li>
              <li>Organização por disciplinas</li>
              <li>Autenticação Google</li>
            </ul>
          </div>
        </div>

        <div className="py-8 border-t border-gray-800">
          <h3 className="text-center font-semibold text-white mb-6 text-lg">
            Instituições de Ensino Superior Consorciadas
          </h3>
          <div className="flex flex-wrap justify-center items-center gap-8 mb-8">
            <img
              src="/cederjlogo.png"
              alt="Fundação CECIERJ"
              className="h-10 opacity-80 hover:opacity-100 transition"
            />
            <p className="text-xs text-gray-500 w-full text-center">
              CEFET/RJ • FAETEC • Instituto Federal Fluminense • Instituto Federal Rio de Janeiro
            </p>
            <p className="text-xs text-gray-500 w-full text-center">
              UENF • UERJ • UEZO • UFF • UFRJ • UFRRIO • UNIRIO
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-800">
          <p className="text-center text-xs text-gray-500">
            CEDERJ — Centro de Educação Superior a Distância do Estado do Rio de Janeiro
          </p>
          <p className="text-center text-xs text-gray-600 mt-2">
            Ciências Contábeis — Acervo Acadêmico de Provas e Materiais
          </p>
        </div>
      </div>
    </footer>
  );
}
