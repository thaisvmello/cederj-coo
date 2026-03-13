import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import Dashboard from './components/Dashboard';
import { Toaster } from 'react-hot-toast';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  return user ? <Dashboard /> : <Auth />;
}

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <AppContent />
    </AuthProvider>
  );
}

export default App;