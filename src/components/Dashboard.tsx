import { Header } from './Header';
import { CourseBrowser } from './CourseBrowser';
import { Footer } from './Footer';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <CourseBrowser />
      </main>
      <Footer />
    </div>
  );
}