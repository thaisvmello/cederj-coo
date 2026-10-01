import { Footer } from '../components/Footer';
import {
  Shield,
  FolderPlus,
  BookOpen,
  MessageSquare,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { Navigate } from 'react-router-dom';
import { AdminFolderRequests } from '../components/AdminFolderRequests';
import { AdminCourseRequests } from '../components/AdminCourseRequests';
import { AdminFileActions } from '../components/AdminFileActions';
import { AdminCommentsManager } from '../components/AdminCommentsManager';
import { AdminAnnouncements } from '../components/AdminAnnouncements';
import { AdminFeedback } from '../components/AdminFeedback';
import { useState } from 'react';
import { Header } from '../components/Header';

type AdminTab =
  | 'folders'
  | 'courses'
  | 'files'
  | 'comments'
  | 'announcements'
  | 'feedback';

export function AdminPanel() {
  const { isAdmin } = useAdmin();
  const [activeTab, setActiveTab] = useState<AdminTab>('folders');

  if (!isAdmin) return <Navigate to="/" />;

  const tabs = [
    { id: 'folders', label: 'Pastas', icon: FolderPlus },
    { id: 'courses', label: 'Disciplinas', icon: BookOpen },
    { id: 'files', label: 'Arquivos', icon: FileText },
    { id: 'comments', label: 'Comentários', icon: MessageSquare },
    { id: 'announcements', label: 'Anúncios', icon: Shield },
    { id: 'feedback', label: 'Erros e Sugestões', icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <Header showHomeButton={true} onGoHome={() => (window.location.href = '/')} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <div className="p-2.5 sm:p-3 bg-purple-600 rounded-xl shadow-lg shrink-0">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Painel de Controle
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">
              Gerencie solicitações e modere o conteúdo do acervo
            </p>
          </div>
        </div>

        {/* Navegação mobile: quadrados compactos (padrão das pastas) */}
        <nav className="lg:hidden bg-white rounded-2xl border border-gray-200 shadow-sm p-3 mb-6">
          <div className="grid grid-cols-3 gap-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as AdminTab)}
                  aria-pressed={isActive}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition ${
                    isActive
                      ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                      : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700 active:bg-gray-100'
                  }`}
                >
                  <tab.icon className={`w-5 h-5 mb-1 shrink-0 ${isActive ? 'text-white' : 'text-purple-600'}`} />
                  <span className="text-[11px] font-bold leading-tight line-clamp-2">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Navegação desktop */}
          <aside className="hidden lg:block w-64 shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as AdminTab)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    activeTab === tab.id
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-gray-500 hover:bg-white hover:text-purple-600'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content Area */}
          <div className="flex-1 min-w-0 space-y-8">
            {activeTab === 'folders' && <AdminFolderRequests />}
            {activeTab === 'courses' && <AdminCourseRequests />}
            {activeTab === 'files' && <AdminFileActions />}
            {activeTab === 'comments' && <AdminCommentsManager />}
            {activeTab === 'announcements' && <AdminAnnouncements />}
            {activeTab === 'feedback' && <AdminFeedback />}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}