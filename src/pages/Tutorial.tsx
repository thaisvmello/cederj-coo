"use client";

import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Search, 
  Star, 
  LayoutGrid, 
  List, 
  Plus, 
  FolderPlus, 
  Upload, 
  Download, 
  Eye, 
  Pencil, 
  Trash2, 
  MessageSquare, 
  Link as LinkIcon, 
  ArrowLeft,
  CheckCircle,
  LogIn,
  Folder
} from 'lucide-react';

export function Tutorial() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <Header showHomeButton={true} onGoHome={() => (window.location.href = '/')} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <BookOpen className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                Guia e Tutorial do Acervo
              </h1>
            </div>
            <p className="text-sm text-gray-500 font-medium">
              Aprenda a utilizar todos os recursos da plataforma colaborativa de Ciências Contábeis.
            </p>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition shadow-sm w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Acervo
          </Link>
        </div>

        {/* Sumário Rápido */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <span>📑</span> Índice do Conteúdo
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <a href="#login" className="p-2.5 rounded-lg bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 font-semibold transition flex items-center gap-2">
              <LogIn className="w-3.5 h-3.5 text-blue-600" /> 1. Login & Autenticação
            </a>
            <a href="#busca" className="p-2.5 rounded-lg bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 font-semibold transition flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-blue-600" /> 2. Busca e Visualização
            </a>
            <a href="#favoritos" className="p-2.5 rounded-lg bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 font-semibold transition flex items-center gap-2">
              <Star className="w-3.5 h-3.5 text-amber-500" /> 3. Disciplinas Favoritas
            </a>
            <a href="#solicitar-disciplina" className="p-2.5 rounded-lg bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 font-semibold transition flex items-center gap-2">
              <Plus className="w-3.5 h-3.5 text-blue-600" /> 4. Solicitar Disciplina
            </a>
            <a href="#pastas" className="p-2.5 rounded-lg bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 font-semibold transition flex items-center gap-2">
              <Folder className="w-3.5 h-3.5 text-blue-600" /> 5. Tipos de Pastas
            </a>
            <a href="#arquivos" className="p-2.5 rounded-lg bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 font-semibold transition flex items-center gap-2">
              <Upload className="w-3.5 h-3.5 text-emerald-600" /> 6. Enviar e Baixar Arquivos
            </a>
            <a href="#editar-arquivos" className="p-2.5 rounded-lg bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 font-semibold transition flex items-center gap-2">
              <Pencil className="w-3.5 h-3.5 text-amber-600" /> 7. Renomear & Excluir
            </a>
            <a href="#links" className="p-2.5 rounded-lg bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 font-semibold transition flex items-center gap-2">
              <LinkIcon className="w-3.5 h-3.5 text-blue-600" /> 8. Links e Referências
            </a>
            <a href="#comentarios" className="p-2.5 rounded-lg bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 font-semibold transition flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-600" /> 9. Comentários & Dicas
            </a>
          </div>
        </div>

        {/* 1. Login */}
        <section id="login" className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Acesso e Login</h2>
              <p className="text-xs text-gray-500">Como entrar ou cadastrar sua conta no Acervo</p>
            </div>
          </div>

          <div className="p-6 space-y-4 text-sm text-gray-700 leading-relaxed">
            <p>
              Para acessar os materiais, enviar novos arquivos e fazer comentários, você pode fazer login utilizando seu e-mail e senha ou com um clique via <strong>Google</strong>.
            </p>

            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase">
                  <CheckCircle className="w-4 h-4 text-blue-600" /> Passos rápidos:
                </div>
                <ul className="text-xs text-blue-800 space-y-1.5 list-disc list-inside">
                  <li><strong>Conta Google:</strong> Clique no botão "Google" para login imediato sem precisar criar senha.</li>
                  <li><strong>E-mail institucional/pessoal:</strong> Digite seu e-mail e senha.</li>
                  <li><strong>Novo cadastro:</strong> Clique em "Criar nova" caso ainda não possua cadastro.</li>
                  <li><strong>Esqueceu a senha:</strong> Use o link "Esqueci minha senha" para redefinir via e-mail.</li>
                </ul>
              </div>

              <div className="w-full md:w-64 bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-2.5 shrink-0 text-xs">
                <div className="text-center font-bold text-gray-800 pb-1 border-b border-gray-100">Simulação de Tela</div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-gray-400">seu.email@exemplo.com</div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-gray-400">••••••••</div>
                <button className="w-full py-1.5 bg-blue-600 text-white font-bold rounded-lg text-[11px]">Entrar</button>
                <div className="text-center text-[10px] text-gray-400">ou</div>
                <button className="w-full py-1.5 border border-gray-300 text-gray-700 font-bold rounded-lg text-[11px] bg-white">Continuar com Google</button>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Busca */}
        <section id="busca" className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Página Inicial: Busca & Modos de Exibição</h2>
              <p className="text-xs text-gray-500">Encontre qualquer matéria em segundos</p>
            </div>
          </div>

          <div className="p-6 space-y-4 text-sm text-gray-700 leading-relaxed">
            <p>
              Na tela inicial do acervo, você tem uma barra de busca em tempo real e pode alternar entre a exibição em <strong>Cards (Grade)</strong> e <strong>Árvore de Pastas (Lista)</strong>.
            </p>

            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/70 space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full bg-white border border-gray-300 rounded-xl p-2.5 flex items-center gap-2 shadow-sm text-xs text-gray-500">
                  <Search className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>Ex: "Contabilidade Introdutória" ou código "EAD17001"</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white p-1 border border-gray-200 rounded-xl shadow-sm shrink-0">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg flex items-center gap-1 text-[11px] font-bold">
                    <LayoutGrid className="w-4 h-4" /> Grade
                  </div>
                  <div className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg flex items-center gap-1 text-[11px] font-medium">
                    <List className="w-4 h-4" /> Lista
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-1 shadow-sm">
                  <span className="text-[11px] font-bold text-blue-600 uppercase">Modo Grade (Cards)</span>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Mostra os cards com período, obrigatoriedade, total de arquivos e estrela para favoritar.
                  </p>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-1 shadow-sm">
                  <span className="text-[11px] font-bold text-purple-600 uppercase">Modo Árvore (Lista)</span>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Permite agrupar as disciplinas por Período ou Tipo e navegar nas subpastas diretamente sem mudar de página.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Favoritos */}
        <section id="favoritos" className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Disciplinas Favoritas & Solicitar Nova Disciplina</h2>
              <p className="text-xs text-gray-500">Organize suas matérias em curso e peça inclusão de novas</p>
            </div>
          </div>

          <div className="p-6 space-y-6 text-sm text-gray-700 leading-relaxed">
            <div className="space-y-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-current" /> Como favoritar disciplinas em curso:
              </h3>
              <p>
                Basta clicar no ícone de <strong>Estrela (★)</strong> no canto superior de qualquer card de disciplina. As matérias favoritadas ficarão fixadas no topo na seção <em>"Disciplinas em Curso"</em> para acesso rápido durante o semestre.
              </p>
            </div>

            <hr className="border-gray-100" />

            <div id="solicitar-disciplina" className="space-y-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-600" /> Como solicitar uma disciplina que não está na lista:
              </h3>
              <p>
                Se faltar alguma disciplina da grade curricular ou optativa:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-xs text-gray-600 bg-amber-50/50 border border-amber-200/60 rounded-xl p-4">
                <li>Clique no botão amarelo <strong>"+ Solicitar Disciplina"</strong> na tela inicial.</li>
                <li>Preencha o nome da matéria, código da disciplina e o período recomendado.</li>
                <li>A solicitação é enviada para moderação e aprovada rapidamente.</li>
              </ol>
            </div>
          </div>
        </section>

        {/* 4. Pastas */}
        <section id="pastas" className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              4
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Dentro da Disciplina: Pastas & Solicitação</h2>
              <p className="text-xs text-gray-500">Entenda a organização por tipo de prova e conteúdo</p>
            </div>
          </div>

          <div className="p-6 space-y-6 text-sm text-gray-700 leading-relaxed">
            <p>
              Ao clicar em uma disciplina, você verá as pastas padrão organizadas por ciclo avaliativo:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-center space-y-1">
                <Folder className="w-6 h-6 text-blue-600 mx-auto" />
                <p className="font-bold text-xs text-blue-900">AD1 / AD2</p>
                <p className="text-[10px] text-gray-500">Avaliações a Distância</p>
              </div>
              <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-xl text-center space-y-1">
                <Folder className="w-6 h-6 text-purple-600 mx-auto" />
                <p className="font-bold text-xs text-purple-900">AP1 / AP2 / AP3</p>
                <p className="text-[10px] text-gray-500">Provas Presenciais e Finais</p>
              </div>
              <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl text-center space-y-1">
                <Folder className="w-6 h-6 text-emerald-600 mx-auto" />
                <p className="font-bold text-xs text-emerald-900">MATERIAIS</p>
                <p className="text-[10px] text-gray-500">Apostilas, resumos e livros</p>
              </div>
              <div className="p-3 bg-red-50/60 border border-red-100 rounded-xl text-center space-y-1">
                <Folder className="w-6 h-6 text-red-600 mx-auto" />
                <p className="font-bold text-xs text-red-900">VIDEOAULAS</p>
                <p className="text-[10px] text-gray-500">Vídeos do YouTube/aulas gravadas</p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-gray-800 flex items-center gap-1.5">
                  <FolderPlus className="w-4 h-4 text-amber-600" /> Precisa de uma pasta personalizada?
                </h4>
                <p className="text-xs text-gray-500">
                  Clique no botão <strong>"Solicitar Pasta"</strong> no topo direito da disciplina (ex: "Exercícios Extras").
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Arquivos */}
        <section id="arquivos" className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              5
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Arquivos: Enviar, Visualizar e Baixar</h2>
              <p className="text-xs text-gray-500">Colaborando com provas e materiais com facilidade</p>
            </div>
          </div>

          <div className="p-6 space-y-6 text-sm text-gray-700 leading-relaxed">
            <div className="space-y-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-600" /> Como enviar novos arquivos:
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-xl p-4">
                <li>Selecione a pasta desejada (ex: AP1).</li>
                <li>Clique no botão <strong>"Enviar Arquivo"</strong>.</li>
                <li>Arraste os arquivos ou clique para escolher do seu computador/celular.</li>
                <li>
                  <strong>Conversão Automática de Imagem:</strong> Se você anexar fotos (JPG, PNG), a plataforma converte automaticamente em PDF!
                </li>
                <li>
                  <strong>Padrão de Nomenclatura:</strong> O sistema sugere o nome ideal para manter tudo padronizado.
                </li>
              </ol>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-blue-900">
                  <Eye className="w-4 h-4 text-blue-600" /> Visualizar Arquivo (Olho)
                </div>
                <p className="text-xs text-gray-600">
                  Clique no ícone de olho para abrir o leitor de PDF embutido com suporte a anotações em tempo real.
                </p>
              </div>

              <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-emerald-900">
                  <Download className="w-4 h-4 text-emerald-600" /> Download Individual ou em Massa (ZIP)
                </div>
                <p className="text-xs text-gray-600">
                  Baixe arquivos individuais, selecione múltiplos ou clique em <strong>"Baixar Tudo (ZIP)"</strong> para baixar a pasta inteira de uma vez só!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Renomear */}
        <section id="editar-arquivos" className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-sm">
              6
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Editar Nome e Excluir Arquivos</h2>
              <p className="text-xs text-gray-500">Mantenha os arquivos organizados e sem erros</p>
            </div>
          </div>

          <div className="p-6 space-y-4 text-sm text-gray-700 leading-relaxed">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
                  <Pencil className="w-4 h-4 text-amber-600" /> Renomear Arquivo (Lápis)
                </div>
                <p className="text-xs text-gray-600">
                  <strong>Todos os usuários cadastrados</strong> podem clicar no lápis ao lado do arquivo para corrigir o nome, ano ou semestre diretamente!
                </p>
              </div>

              <div className="p-4 bg-red-50/50 border border-red-100 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-red-900">
                  <Trash2 className="w-4 h-4 text-red-600" /> Solicitar Exclusão (Lixeira)
                </div>
                <p className="text-xs text-gray-600">
                  Se um arquivo estiver corrompido ou for duplicado, clique no ícone de lixeira e informe o motivo para moderação do administrador.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Links */}
        <section id="links" className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
              7
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Links Externos, Videoaulas & Comentários</h2>
              <p className="text-xs text-gray-500">Troque dicas, tire dúvidas e compartilhe mapas mentais</p>
            </div>
          </div>

          <div className="p-6 space-y-6 text-sm text-gray-700 leading-relaxed">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-blue-900">
                  <LinkIcon className="w-4 h-4 text-blue-600" /> Links & Referências
                </div>
                <p className="text-xs text-gray-600">
                  Anexe links do Notion, Miro, Canva ou materiais online compartilhados.
                </p>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-red-900">
                  <span>🎥</span> Galeria de Videoaulas
                </div>
                <p className="text-xs text-gray-600">
                  Cole links de playlists ou vídeos do YouTube da disciplina para visualização direta.
                </p>
              </div>

              <div id="comentarios" className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-indigo-900">
                  <MessageSquare className="w-4 h-4 text-indigo-600" /> Discussão e Dicas
                </div>
                <p className="text-xs text-gray-600">
                  Use o chat lateral de cada disciplina para deixar comentários, tirar dúvidas e responder colegas!
                </p>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
              <span className="text-xl">🎓</span>
              <p className="text-xs text-emerald-900 font-medium leading-relaxed">
                <strong>Bons estudos!</strong> O Acervo é mantido com a colaboração mútua de todos os estudantes de Ciências Contábeis. Faça sua parte compartilhando provas e materiais!
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}