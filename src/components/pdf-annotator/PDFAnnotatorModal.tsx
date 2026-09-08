"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import * as fabric from 'fabric';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Pencil, 
  MousePointer, 
  Type, 
  Image as ImageIcon, 
  Trash2, 
  Save, 
  Download, 
  Loader, 
  ZoomIn, 
  ZoomOut,
  Palette,
  Undo2,
  Check
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

// Configuração do Worker do PDF.js via CDN compatível
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFAnnotatorModalProps {
  fileUrl: string;
  fileName: string;
  documentId?: string; // ID para persistência no Supabase
  onClose: () => void;
}

type ToolMode = 'select' | 'draw' | 'text';

export function PDFAnnotatorModal({ fileUrl, fileName, documentId, onClose }: PDFAnnotatorModalProps) {
  const { user } = useAuth();

  // Estados de navegação do documento
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pageWidth, setPageWidth] = useState<number>(800);
  const [pageHeight, setPageHeight] = useState<number>(1100);
  const [scale, setScale] = useState<number>(1.1);
  const [loadingPdf, setLoadingPdf] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Estados das ferramentas
  const [activeTool, setActiveTool] = useState<ToolMode>('select');
  const [brushColor, setBrushColor] = useState<string>('#ef4444');
  const [brushWidth, setBrushWidth] = useState<number>(3);
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);

  // Cache das anotações em JSON indexado por número de página
  const annotationsRef = useRef<Record<number, any>>({});
  
  // Referências de DOM e Fabric
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasElementRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Paleta de cores rápida para marcação
  const colorOptions = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#000000'];

  /* -------------------------------------------------------------
     1. CARREGAR ANOTAÇÕES DO BANCO DE DADOS (SUPABASE)
  ------------------------------------------------------------- */
  useEffect(() => {
    if (!user || !documentId) return;

    const fetchSavedAnnotations = async () => {
      try {
        const { data, error } = await supabase
          .from('document_annotations')
          .select('annotations')
          .eq('document_id', documentId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.warn('[PDFAnnotator] Erro ao buscar anotações:', error);
          return;
        }

        if (data?.annotations && typeof data.annotations === 'object') {
          annotationsRef.current = data.annotations;
          // Se o canvas já estiver pronto na página atual, carregar
          if (fabricCanvasRef.current && annotationsRef.current[pageNumber]) {
            handleLoadAnnotations(annotationsRef.current[pageNumber]);
          }
        }
      } catch (err) {
        console.error('[PDFAnnotator] Falha ao recuperar anotações:', err);
      }
    };

    fetchSavedAnnotations();
  }, [documentId, user]);

  /* -------------------------------------------------------------
     2. PERSISTÊNCIA: EXPORTAR E IMPORTAR JSON DO CANVAS
  ------------------------------------------------------------- */
  // Salva o estado da página atual para o cache local
  const snapshotCurrentPage = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    const json = fabricCanvasRef.current.toJSON();
    // Salvar somente se tiver objetos, senão limpa
    if (json.objects && json.objects.length > 0) {
      annotationsRef.current[pageNumber] = json;
    } else {
      delete annotationsRef.current[pageNumber];
    }
  }, [pageNumber]);

  // Carrega um payload JSON no Fabric Canvas
  const handleLoadAnnotations = useCallback((jsonPayload: any) => {
    if (!fabricCanvasRef.current || !jsonPayload) return;
    fabricCanvasRef.current.loadFromJSON(jsonPayload, () => {
      fabricCanvasRef.current?.renderAll();
    });
  }, []);

  // Salva no Supabase (ou dispara callback externo)
  const handleSaveAnnotations = async () => {
    snapshotCurrentPage();

    if (!user) {
      toast.success('Anotações salvas localmente nesta sessão!');
      return;
    }

    if (!documentId) {
      toast.success('Anotações gravadas!');
      return;
    }

    setIsSaving(true);
    try {
      const payload = annotationsRef.current;
      const { error } = await supabase
        .from('document_annotations')
        .upsert(
          {
            user_id: user.id,
            document_id: documentId,
            annotations: payload,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,document_id' }
        );

      if (error) throw error;
      toast.success('Anotações salvas na nuvem com sucesso!');
    } catch (err: any) {
      console.error('[PDFAnnotator] Erro ao salvar anotações:', err);
      toast.error('Erro ao salvar no banco. Suas anotações continuam nesta sessão.');
    } finally {
      setIsSaving(false);
    }
  };

  /* -------------------------------------------------------------
     3. INICIALIZAÇÃO E SINCRONIZAÇÃO DO FABRIC.JS
  ------------------------------------------------------------- */
  useEffect(() => {
    if (!canvasElementRef.current) return;

    // Destruir instância prévia se existir
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.dispose();
      fabricCanvasRef.current = null;
    }

    const actualWidth = pageWidth * scale;
    const actualHeight = pageHeight * scale;

    // Criar o canvas interativo
    const canvas = new fabric.Canvas(canvasElementRef.current, {
      width: actualWidth,
      height: actualHeight,
      selection: true,
      preserveObjectStacking: true,
      fireRightClick: false,
      stopContextMenu: true,
    });

    fabricCanvasRef.current = canvas;

    // Configurar pincel padrão
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = brushColor;
      canvas.freeDrawingBrush.width = brushWidth;
    }

    // Carregar anotações salvas para a página atual
    if (annotationsRef.current[pageNumber]) {
      canvas.loadFromJSON(annotationsRef.current[pageNumber], () => {
        canvas.renderAll();
      });
    }

    // Ajustar ferramenta ativa
    applyToolMode(activeTool, canvas);

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, [pageNumber, pageWidth, pageHeight, scale]);

  /* -------------------------------------------------------------
     4. CONTROLE DE FERRAMENTAS (SELETOR, LÁPIS, TEXTO)
  ------------------------------------------------------------- */
  const applyToolMode = (tool: ToolMode, canvasInstance?: fabric.Canvas | null) => {
    const canvas = canvasInstance || fabricCanvasRef.current;
    if (!canvas) return;

    if (tool === 'draw') {
      canvas.isDrawingMode = true;
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = brushColor;
        canvas.freeDrawingBrush.width = brushWidth;
      }
      canvas.selection = false;
    } else {
      canvas.isDrawingMode = false;
      canvas.selection = tool === 'select';
    }
  };

  const handleSelectTool = (tool: ToolMode) => {
    setActiveTool(tool);
    applyToolMode(tool);
  };

  const handleChangeColor = (color: string) => {
    setBrushColor(color);
    if (fabricCanvasRef.current?.freeDrawingBrush) {
      fabricCanvasRef.current.freeDrawingBrush.color = color;
    }
    // Se houver texto selecionado, muda a cor do texto também
    const activeObj = fabricCanvasRef.current?.getActiveObject();
    if (activeObj && activeObj.type === 'i-text') {
      (activeObj as fabric.IText).set('fill', color);
      fabricCanvasRef.current?.renderAll();
    }
    setShowColorPicker(false);
  };

  const handleChangeBrushWidth = (width: number) => {
    setBrushWidth(width);
    if (fabricCanvasRef.current?.freeDrawingBrush) {
      fabricCanvasRef.current.freeDrawingBrush.width = width;
    }
  };

  const handleAddText = () => {
    if (!fabricCanvasRef.current) return;
    handleSelectTool('select');

    const text = new fabric.IText('Digite aqui sua nota...', {
      left: 100,
      top: 100,
      fontFamily: 'sans-serif',
      fontSize: 18,
      fill: brushColor,
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      padding: 6,
      cornerColor: '#3b82f6',
      cornerSize: 8,
      transparentCorners: false,
    });

    fabricCanvasRef.current.add(text);
    fabricCanvasRef.current.setActiveObject(text);
    text.enterEditing();
    fabricCanvasRef.current.renderAll();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricCanvasRef.current) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      fabric.Image.fromURL(dataUrl, (img) => {
        // Redimensiona proporcionalmente para caber bem no PDF
        const maxWidth = (pageWidth * scale) * 0.4;
        if (img.width && img.width > maxWidth) {
          img.scaleToWidth(maxWidth);
        }
        img.set({
          left: 100,
          top: 150,
          cornerColor: '#3b82f6',
          cornerSize: 8,
          transparentCorners: false,
        });

        fabricCanvasRef.current?.add(img);
        fabricCanvasRef.current?.setActiveObject(img);
        fabricCanvasRef.current?.renderAll();
        handleSelectTool('select');
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleClearPage = () => {
    if (!fabricCanvasRef.current) return;
    if (confirm('Deseja limpar todas as anotações desta página?')) {
      fabricCanvasRef.current.clear();
      delete annotationsRef.current[pageNumber];
      fabricCanvasRef.current.renderAll();
      toast.success('Página limpa!');
    }
  };

  const handleUndo = () => {
    if (!fabricCanvasRef.current) return;
    const objects = fabricCanvasRef.current.getObjects();
    if (objects.length > 0) {
      fabricCanvasRef.current.remove(objects[objects.length - 1]);
      fabricCanvasRef.current.renderAll();
    }
  };

  /* -------------------------------------------------------------
     5. PAGINAÇÃO E DIMENSIONAMENTO DO PDF
  ------------------------------------------------------------- */
  const changePage = (offset: number) => {
    const newPage = pageNumber + offset;
    if (newPage >= 1 && newPage <= numPages) {
      snapshotCurrentPage();
      setPageNumber(newPage);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoadingPdf(false);
  };

  const onPageLoadSuccess = (page: any) => {
    const viewport = page.getViewport({ scale: 1.0 });
    setPageWidth(viewport.width);
    setPageHeight(viewport.height);
  };

  // Download do arquivo PDF original
  const handleDownloadOriginal = () => {
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = fileName;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const actualWidth = pageWidth * scale;
  const actualHeight = pageHeight * scale;

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex flex-col h-screen overflow-hidden select-none animate-in fade-in duration-200">
      
      {/* =========================================================
          BARRA SUPERIOR (HEADER)
      ========================================================= */}
      <header className="h-16 bg-[#002f3e] text-white px-4 flex items-center justify-between border-b border-white/10 shrink-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl shrink-0">
            <Pencil className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-sm sm:text-base text-white truncate max-w-[220px] sm:max-w-md">
              {fileName}
            </h2>
            <p className="text-[10px] text-gray-400 hidden sm:block">
              Leitura e anotações em tempo real
            </p>
          </div>
        </div>

        {/* Paginador Central Superior */}
        <div className="flex items-center gap-1.5 bg-black/30 border border-white/10 px-2 py-1 rounded-xl">
          <button
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1}
            className="p-1 text-gray-300 hover:text-white disabled:opacity-30 transition rounded-lg hover:bg-white/10"
            title="Página Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-gray-200 px-1 min-w-[50px] text-center">
            {pageNumber} / {numPages || '–'}
          </span>
          <button
            onClick={() => changePage(1)}
            disabled={pageNumber >= numPages}
            className="p-1 text-gray-300 hover:text-white disabled:opacity-30 transition rounded-lg hover:bg-white/10"
            title="Próxima Página"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Ações da Direita */}
        <div className="flex items-center gap-2">
          {/* Zoom */}
          <div className="hidden md:flex items-center gap-1 bg-black/30 border border-white/10 rounded-xl p-0.5">
            <button
              onClick={() => setScale(s => Math.max(0.7, s - 0.15))}
              className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition"
              title="Diminuir Zoom"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-bold text-gray-300 px-1">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale(s => Math.min(2.0, s + 0.15))}
              className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleSaveAnnotations}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
            title="Salvar Anotações"
          >
            {isSaving ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Salvar</span>
          </button>

          <button
            onClick={handleDownloadOriginal}
            className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition"
            title="Baixar Arquivo"
          >
            <Download className="w-5 h-5" />
          </button>

          <button
            onClick={() => {
              snapshotCurrentPage();
              onClose();
            }}
            className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition ml-1"
            title="Fechar Visualizador"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* =========================================================
          CORPO PRINCIPAL (ÁREA DE LEITURA & CANVAS)
      ========================================================= */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center items-start custom-scrollbar bg-neutral-900/60"
      >
        {loadingPdf && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-white/70">
            <Loader className="w-8 h-8 animate-spin text-blue-400" />
            <p className="text-xs font-semibold uppercase tracking-wider">Carregando PDF...</p>
          </div>
        )}

        {/* CONTAINER SOBREPOSTO COM AS DUAS CAMADAS */}
        <div 
          className="relative shadow-2xl rounded-sm overflow-hidden bg-white my-auto"
          style={{ 
            width: actualWidth || 'auto', 
            height: actualHeight || 'auto',
            display: loadingPdf ? 'none' : 'block'
          }}
        >
          {/* CAMADA 1 (FUNDO): Renderização visual via react-pdf */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading=""
              className="flex justify-center"
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderAnnotationLayer={false}
                renderTextLayer={false}
                onLoadSuccess={onPageLoadSuccess}
              />
            </Document>
          </div>

          {/* CAMADA 2 (TOPO): Canvas Transparente interativo via Fabric.js */}
          <div className="absolute inset-0 z-10 touch-none">
            <canvas ref={canvasElementRef} />
          </div>
        </div>
      </div>

      {/* =========================================================
          BARRA DE FERRAMENTAS FLUTUANTE / RESPONSIVA
      ========================================================= */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/95 backdrop-blur-md text-white border border-white/20 rounded-2xl shadow-2xl px-3 py-2 flex items-center gap-1.5 sm:gap-2 max-w-[95vw] overflow-x-auto">
        
        {/* Seletor */}
        <button
          onClick={() => handleSelectTool('select')}
          className={`p-2.5 rounded-xl transition flex items-center justify-center ${
            activeTool === 'select'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`}
          title="Modo Seleção / Mover"
        >
          <MousePointer className="w-4 h-4" />
        </button>

        {/* Lápis / Desenho livre */}
        <button
          onClick={() => handleSelectTool('draw')}
          className={`p-2.5 rounded-xl transition flex items-center justify-center relative ${
            activeTool === 'draw'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`}
          title="Lápis / Desenho Livre"
        >
          <Pencil className="w-4 h-4" />
          <span 
            className="absolute bottom-1 right-1 w-2 h-2 rounded-full border border-neutral-900"
            style={{ backgroundColor: brushColor }}
          />
        </button>

        {/* Cor e Espessura */}
        <div className="relative">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-2.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition flex items-center justify-center"
            title="Escolher Cor"
          >
            <Palette className="w-4 h-4" />
          </button>

          {showColorPicker && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-neutral-900 border border-white/20 p-3 rounded-2xl shadow-xl flex flex-col gap-3 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-1.5">
                {colorOptions.map((c) => (
                  <button
                    key={c}
                    onClick={() => handleChangeColor(c)}
                    className="w-6 h-6 rounded-full border-2 transition flex items-center justify-center"
                    style={{ 
                      backgroundColor: c, 
                      borderColor: brushColor === c ? '#ffffff' : 'transparent' 
                    }}
                  >
                    {brushColor === c && <Check className="w-3 h-3 text-white drop-shadow" />}
                  </button>
                ))}
              </div>

              {/* Slider de espessura */}
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-bold block">Espessura: {brushWidth}px</span>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={brushWidth}
                  onChange={(e) => handleChangeBrushWidth(Number(e.target.value))}
                  className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Inserir Texto */}
        <button
          onClick={handleAddText}
          className="p-2.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition flex items-center justify-center"
          title="Inserir Caixa de Texto"
        >
          <Type className="w-4 h-4" />
        </button>

        {/* Inserir Imagem */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition flex items-center justify-center"
          title="Inserir Imagem / Selo"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        <div className="w-px h-5 bg-white/20 mx-1" />

        {/* Desfazer */}
        <button
          onClick={handleUndo}
          className="p-2.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition flex items-center justify-center"
          title="Desfazer Última Ação"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        {/* Limpar Página */}
        <button
          onClick={handleClearPage}
          className="p-2.5 text-gray-300 hover:text-red-400 hover:bg-white/10 rounded-xl transition flex items-center justify-center"
          title="Limpar Anotações desta Página"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}