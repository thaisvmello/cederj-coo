import { useState } from 'react';
import { Header } from './Header';
import { CourseBrowser } from './CourseBrowser';
import { AdminFolderRequests } from './AdminFolderRequests';
import { AdminCourseRequests } from './AdminCourseRequests';
import { Calculator } from './Calculator';
import { Footer } from './Footer';

type Page = 'home' | 'calculator';

export function Dashboard() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [isInSubPage, setIsInSubPage] = useState(false);
  const [goHomeTrigger, setGoHomeTrigger] = useState(0);

  const handleGoHome = () => {
    setGoHomeTrigger(prev => prev + 1);
    setCurrentPage('home');
  };

  const handleNavigateToCalculator = () => {
    setCurrentPage('calculator');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <Header 
        showHomeButton={isInSubPage || currentPage !== 'home'} 
        onGoHome={handleGoHome}
        onNavigateToCalculator={handleNavigateToCalculator}
        currentPage={currentPage}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {currentPage === 'calculator' ? (
          <Calculator />
        ) : (
          <>
            <AdminFolderRequests />
            <AdminCourseRequests />
            <CourseBrowser 
              onNavigateToSubPage={setIsInSubPage}
              goHomeTrigger={goHomeTrigger}
            />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}