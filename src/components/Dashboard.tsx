import { useState } from 'react';
import { Header } from './Header';
import { QuickLinksBar } from './QuickLinksBar';
import { QuickAccessBar } from './QuickAccessBar';
import { CourseBrowser } from './CourseBrowser';
import { Footer } from './Footer';
import type { Folder } from '../lib/types';

export function Dashboard() {
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <QuickLinksBar />
      <QuickAccessBar
        onSelectFolder={setSelectedFolder}
        selectedFolderId={selectedFolder?.id}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <CourseBrowser
          initialSelectedFolder={selectedFolder}
          onFolderSelect={setSelectedFolder}
        />
      </main>

      <Footer />
    </div>
  );
}
