import { ExternalLink } from 'lucide-react';

export function QuickLinksBar() {
  const links = [
    {
      name: 'Plataforma de Estudos',
      url: 'https://plataforma.cederj.edu.br',
    },
    {
      name: 'Sistema Acadêmico',
      url: 'https://sistema.cederj.edu.br',
    },
    {
      name: 'Calculadora de Notas',
      url: 'https://calculadora.cederj.edu.br',
    },
  ];

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 sticky top-[73px] z-20">
      <div className="px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center gap-4 overflow-x-auto">
          {links.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition whitespace-nowrap text-sm font-medium backdrop-blur-sm"
            >
              {link.name}
              <ExternalLink className="w-4 h-4" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
