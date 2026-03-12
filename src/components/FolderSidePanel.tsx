import { X, Folder, FileText, MessageSquare } from 'lucide-react';
import { FileList } from './FileList';
import { FolderComments } from './FolderComments';
import type { Folder as FolderType, Course } from '../lib/types';

interface FolderSidePanelProps {
  folder: FolderType;
  course: Course;
  onClose: () => void;
}

export function FolderSidePanel({ folder, course, onClose }: FolderSidePanelProps) {
  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 bg-[#0f172a] text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Folder className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">{folder.name}</h2>
              <p className="text-xs text-gray-400 uppercase tracking-wider">{course.name}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <FileText className="w-4 h-4 text-blue-600" />
            Arquivos Disponíveis
          </div>
          <FileList folderId={folder.id} />
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            Discussão e Dicas
          </div>
          <FolderComments folderId={folder.id} />
        </section>
      </div>
    </div>
  );
}