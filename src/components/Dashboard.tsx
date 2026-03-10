import { Header } from './Header';
import { CourseBrowser } from './CourseBrowser';
import { Footer } from './Footer';

export function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <CourseBrowser />
      </main>

      <Footer />
    </div>
  );
}
