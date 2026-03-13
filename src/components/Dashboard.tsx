import { useState } from 'react';
import { Header } from './Header';
import { CourseBrowser } from './CourseBrowser';
import { AdminFolderRequests } from './AdminFolderRequests';
import { AdminCourseRequests } from './AdminCourseRequests';
import { Footer } from './Footer';

export function Dashboard() {
  const [isSubPage, setIsSubPage] = useState(false);

  const handleHomeClick = () => {
    console.log('Home button clicked, returning to main page');
    setIsSubPage(false);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <Header 
        showHomeButton={isSubPage} 
        onHomeClick={handleHomeClick} 
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <AdminFolderRequests />
        <AdminCourseRequests />
        <CourseBrowser onSubPageChange={setIsSubPage} isSubPage={isSubPage} />
      </main>

      <Footer />
    </div>
  );
}