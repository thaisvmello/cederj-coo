"use client";

import type { File } from '../lib/types';
import { PDFAnnotatorModal } from './pdf-annotator/PDFAnnotatorModal';

interface PDFViewerProps {
  file: File;
  onClose: () => void;
}

export function PDFViewer({ file, onClose }: PDFViewerProps) {
  return (
    <PDFAnnotatorModal
      fileUrl={file.file_path}
      fileName={file.name}
      documentId={file.id}
      onClose={onClose}
    />
  );
}