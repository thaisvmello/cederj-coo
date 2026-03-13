import { useState } from 'react';
import { Header } from './Header';
import { CourseBrowser } from './CourseBrowser';
import { AdminFolderRequests } from './AdminFolderRequests';
import { AdminCourseRequests } from './AdminCourseRequests';
import { Footer } from './Footer';

export function Dashboard() {
  const [isInSubPage, setIsInSubPage] = useState(false);

  const handleGoHome = () => {
    setIsInSubPage(false);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <Header 
        showHomeButton={isInSubPage} 
        onGoHome={handleGoHome} 
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <AdminFolderRequests />
        <AdminCourseRequests />
        <CourseBrowser 
          onNavigateToSubPage={setIsInSubPage}
          goHome={!isInSubPage}
        />
      </main>

      <Footer />
    </div>
  );
}