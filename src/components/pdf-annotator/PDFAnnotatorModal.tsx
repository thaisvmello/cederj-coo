"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import * as fabric from 'fabric';
import { 
  X, ChevronLeft, ChevronRight, Pencil, MousePointer, Type, 
  Image as ImageIcon, Trash2, Save, Download, Loader, 
  ZoomIn, ZoomOut, Palette, Undo2, Check, Highlighter, MessageSquare
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFAnnotatorModalProps {
  fileUrl: string;
  fileName: string;
  documentId?: string;
  onClose: () => void;
}

type ToolMode = 'select' | 'draw' | 'highlighter' | 'text' | 'pin';

export function PDFAnnotatorModal({ fileUrl, fileName, documentId, onClose }: PDFAnnotatorModalProps) {
  const { user } = useAuth();
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pageWidth, setPageWidth] = useState<number>(800);
  const [pageHeight, setPageHeight] = useState<number>(1100);
  const [scale, setScale] = useState<number>(1.1);
  const [activeTool, setActiveTool] = useState<ToolMode>('select');
  const [activePin, setActivePin] = useState<fabric.FabricObject | null>(null);
  
  const annotationsRef = useRef<Record<number, any>>({});
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const canvasElementRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasElementRef.current) return;
    const canvas = new fabric.Canvas(canvasElementRef.current, {
      width: pageWidth * scale,
      height: pageHeight * scale,
    });
    fabricCanvasRef.current = canvas;

    canvas.on('mouse:down', (e) => {
      // Lógica de Pin: Criar ou Selecionar
      if (activeTool === 'pin' && !e.target) {
        const pointer = canvas.getScenePoint(e.e);
        const pin = createPin(pointer.x, pointer.y);
        canvas.add(pin);
        setActivePin(pin);
      } else if (e.target && (e.target as any).isPin) {
        setActivePin(e.target);
      } else {
        setActivePin(null);
      }
    });

    return () => { canvas.dispose(); };
  }, [pageNumber, scale]);

  const createPin = (x: number, y: number) => {
    const circle = new fabric.Circle({ radius: 14, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 });
    const icon = new fabric.IText('💬', { fontSize: 14, top: 7, left: 7, selectable: false });
    const pin = new fabric.Group([circle, icon], { left: x, top: y, originX: 'center', originY: 'center' });
    (pin as any).isPin = true;
    (pin as any).commentText = '';
    return pin;
  };

  const applyTool = (tool: ToolMode) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    
    canvas.isDrawingMode = tool === 'draw' || tool === 'highlighter';
    if (canvas.isDrawingMode) {
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.width = tool === 'highlighter' ? 20 : 3;
      canvas.freeDrawingBrush.color = tool === 'highlighter' ? 'rgba(255, 255, 0, 0.4)' : '#ef4444';
      if (tool === 'highlighter') (canvas.freeDrawingBrush as any).globalCompositeOperation = 'multiply';
    }
    setActiveTool(tool);
  };

  const saveToSupabase = async () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !user || !documentId) return;
    const json = canvas.toJSON(['id', 'isPin', 'commentText', 'globalCompositeOperation']);
    annotationsRef.current[pageNumber] = json;
    
    await supabase.from('document_annotations').upsert({
      user_id: user.id, document_id: documentId, annotations: annotationsRef.current
    });
    toast.success('Salvo!');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      <header className="h-16 bg-gray-900 text-white flex items-center justify-between px-4">
        <button onClick={onClose}><X /></button>
        <button onClick={saveToSupabase} className="bg-emerald-600 px-4 py-2 rounded-lg">Salvar</button>
      </header>

      <div className="flex-1 overflow-auto flex justify-center items-center">
        <canvas ref={canvasElementRef} />
      </div>

      {activePin && (
        <div className="fixed top-20 right-4 w-72 bg-white p-4 rounded-xl shadow-2xl">
          <textarea
            className="w-full h-32 border p-2"
            value={(activePin as any).commentText}
            onChange={(e) => {
              (activePin as any).commentText = e.target.value;
              fabricCanvasRef.current?.renderAll();
            }}
          />
        </div>
      )}

      <div className="fixed bottom-4 flex gap-2 bg-neutral-900 p-2 rounded-xl">
        <button onClick={() => applyTool('select')}><MousePointer /></button>
        <button onClick={() => applyTool('draw')}><Pencil /></button>
        <button onClick={() => applyTool('highlighter')}><Highlighter /></button>
        <button onClick={() => applyTool('pin')}><MessageSquare /></button>
      </div>
    </div>
  );
}