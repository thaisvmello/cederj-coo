import { Footer } from '../components/Footer';
import {
  Shield,
  LayoutDashboard,
  FolderPlus,
  BookOpen,
  MessageSquare,
  FileText,
  Settings,
} from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { Navigate } from 'react-router-dom';
import { AdminFolderRequests } from '../components/AdminFolderRequests';
import { AdminCourseRequests } from '../components/AdminCourseRequests';
import { AdminFileActions } from '../components/AdminFileActions';
import { AdminCommentsManager } from '../components/AdminCommentsManager';
import { AdminBulkRename } from '../components/AdminBulkRename';
import { AdminAnnouncements } from '../components/AdminAnnouncements';
import { useState } from 'react';
import { Header } from '../components/Header';

type AdminTab =
  | 'overview'
  | 'folders'
  | 'courses'
  | 'files'
  | 'comments'
  | 'maintenance'
  | 'announcements';

export function AdminPanel() {
  const { isAdmin } = useAdmin();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  if (!isAdmin) return <Navigate to="/" />;

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'folders', label: 'Pastas', icon: FolderPlus },
    { id: 'courses', label: 'Disciplinas', icon: BookOpen },
    { id: 'files', label: 'Arquivos', icon: FileText },
    { id: 'comments', label: 'Comentários', icon: MessageSquare },
    { id: 'maintenance', label: 'Manutenção', icon: Settings },
    { id: 'announcements', label: 'Anúncios', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <Header showHomeButton={true} onGoHome={() => (window.location.href = '/')} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-purple-600 rounded-xl shadow-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Painel de Controle
            </h2>
            <p className="text-sm text-gray-500 font-medium">
              Gerencie solicitações e modere o conteúdo do acervo
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Tabs */}
          <aside className="w-full lg:w-64 shrink-0">
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
          <div className="flex-1 space-y-8">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 gap-8">
                <AdminFolderRequests />
                <AdminCourseRequests />
                <AdminFileActions />
                <AdminCommentsManager />
              </div>
            )}
            {activeTab === 'folders' && <AdminFolderRequests />}
            {activeTab === 'courses' && <AdminCourseRequests />}
            {activeTab === 'files' && <AdminFileActions />}
            {activeTab === 'comments' && <AdminCommentsManager />}
            {activeTab === 'maintenance' && <AdminBulkRename />}
            {activeTab === 'announcements' && <AdminAnnouncements />}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}