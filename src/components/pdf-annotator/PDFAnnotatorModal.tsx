"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
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
  Check,
  Highlighter,
  MessageSquare,
  MoreVertical
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

// Configuração do Worker do PDF.js via CDN compatível
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFAnnotatorModalProps {
  fileUrl: string;
  fileName: string;
  documentId?: string;
  onClose: () => void;
}

type ToolMode = 'select' | 'draw' | 'highlighter' | 'text' | 'pin';

interface ActivePinData {
  id: string;
  commentText: string;
  screenX: number;
  screenY: number;
  fabricObject: fabric.FabricObject;
}

export function PDFAnnotatorModal({ fileUrl, fileName, documentId, onClose }: PDFAnnotatorModalProps) {
  const { user } = useAuth();

  // Estados de documento e dimensões originais (em pontos PDF unscaled)
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [originalWidth, setOriginalWidth] = useState<number>(595); // A4 padrão como fallback inicial
  const [originalHeight, setOriginalHeight] = useState<number>(842);

  // Escala dinâmica e zoom do usuário
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [userZoom, setUserZoom] = useState<number>(1.0);
  const [scale, setScale] = useState<number>(1.0);
  const [loadingPdf, setLoadingPdf] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [hasSelection, setHasSelection] = useState<boolean>(false);

  // Estados de ferramentas
  const [activeTool, setActiveTool] = useState<ToolMode>('select');
  const [brushColor, setBrushColor] = useState<string>('#ef4444');
  const [brushWidth, setBrushWidth] = useState<number>(3);
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);

  // Estado da Janela Flutuante de Comentário (Pin)
  const [activePin, setActivePin] = useState<ActivePinData | null>(null);

  // Cache das anotações em JSON indexado por página (salvo em coordenadas base 1.0)
  const annotationsRef = useRef<Record<number, any>>({});
  
  // Referências de DOM e Fabric
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasElementRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeToolRef = useRef<ToolMode>('select');
  activeToolRef.current = activeTool;

  const colorOptions = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#000000'];

  // Cap de devicePixelRatio para dispositivos mobile para economizar memória e GPU
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 1.5) : 1;

  /* -------------------------------------------------------------
     1. CALCULO DINÂMICO DE ESCALA VIA RESIZEOBSERVER
  ------------------------------------------------------------- */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      if (!container) return;
      const width = container.clientWidth;
      setContainerWidth(width);
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Recalcula a escala final combinando largura da tela e zoom do usuário
  useEffect(() => {
    if (!containerWidth || !originalWidth) return;

    // Subtrai margens de respiro (16px no mobile, 48px no desktop)
    const padding = containerWidth < 640 ? 16 : 48;
    const availableWidth = Math.max(280, containerWidth - padding);
    
    // Escala base que ajusta o PDF perfeitamente à largura disponível
    const baseFitScale = availableWidth / originalWidth;
    const finalScale = Number((baseFitScale * userZoom).toFixed(3));
    setScale(finalScale);
  }, [containerWidth, originalWidth, userZoom]);

  /* -------------------------------------------------------------
     2. FUNÇÃO REVIVER & SERIALIZAÇÃO CUSTOMIZADA PARA PINS
  ------------------------------------------------------------- */
  const attachPinProperties = (pinObj: any, initialText = '') => {
    pinObj.isPin = true;
    if (initialText !== undefined && initialText !== null) {
      pinObj.commentText = initialText;
    }
    pinObj.hasControls = false;
    pinObj.lockScalingX = true;
    pinObj.lockScalingY = true;
    pinObj.lockRotation = true;
    pinObj.hoverCursor = 'pointer';

    const originalToObject = pinObj.toObject.bind(pinObj);
    pinObj.toObject = function (propertiesToInclude?: string[]) {
      return originalToObject([
        'id',
        'isPin',
        'commentText',
        'globalCompositeOperation',
        ...(propertiesToInclude || []),
      ]);
    };
  };

  const reviverCallback = useCallback((serializedObj: any, fabricObj: any) => {
    if (!serializedObj || !fabricObj) return;
    if (serializedObj.id) fabricObj.id = serializedObj.id;
    if (serializedObj.isPin || serializedObj.commentText !== undefined) {
      attachPinProperties(fabricObj, serializedObj.commentText || '');
    }
    if (serializedObj.globalCompositeOperation) {
      fabricObj.globalCompositeOperation = serializedObj.globalCompositeOperation;
    }
  }, []);

  const handleLoadAnnotations = useCallback(async (jsonPayload: any) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !jsonPayload) return;

    try {
      await (canvas as any).loadFromJSON(jsonPayload, reviverCallback);
      canvas.requestRenderAll();
      canvas.renderAll();
    } catch (err) {
      console.error('[PDFAnnotator] Erro ao carregar anotações no canvas:', err);
    }
  }, [reviverCallback]);

  /* -------------------------------------------------------------
     3. CARREGAR ANOTAÇÕES DO SUPABASE
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
          if (fabricCanvasRef.current && annotationsRef.current[pageNumber]) {
            await handleLoadAnnotations(annotationsRef.current[pageNumber]);
          }
        }
      } catch (err) {
        console.error('[PDFAnnotator] Falha ao recuperar anotações:', err);
      }
    };

    fetchSavedAnnotations();
  }, [documentId, user, pageNumber, handleLoadAnnotations]);

  /* -------------------------------------------------------------
     4. PERSISTÊNCIA: EXPORTAR E SALVAR ANOTAÇÕES
  ------------------------------------------------------------- */
  const snapshotCurrentPage = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    const json = (fabricCanvasRef.current as any).toJSON([
      'id',
      'isPin',
      'commentText',
      'globalCompositeOperation',
    ]);
    if (json.objects && json.objects.length > 0) {
      annotationsRef.current[pageNumber] = json;
    } else {
      delete annotationsRef.current[pageNumber];
    }
  }, [pageNumber]);

  const handleSaveAnnotations = useCallback(
    async (silent = false) => {
      snapshotCurrentPage();

      if (!user || !documentId) {
        if (!silent) toast.success('Anotações salvas localmente nesta sessão!');
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
        if (!silent) toast.success('Anotações salvas com sucesso!');
      } catch (err: any) {
        console.error('[PDFAnnotator] Erro ao salvar anotações:', err);
        if (!silent) toast.error('Erro ao salvar no banco.');
      } finally {
        setIsSaving(false);
      }
    },
    [snapshotCurrentPage, user, documentId]
  );

  /* -------------------------------------------------------------
     5. EXCLUSÃO INDIVIDUAL DE ITENS SELECIONADOS
  ------------------------------------------------------------- */
  const handleDeleteSelected = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const activeObjects = canvas.getActiveObjects();
    if (activeObjects && activeObjects.length > 0) {
      activeObjects.forEach((obj) => {
        if (activePin?.fabricObject === obj) {
          setActivePin(null);
        }
        canvas.remove(obj);
      });
      canvas.discardActiveObject();
      canvas.requestRenderAll();
      setHasSelection(false);
      handleSaveAnnotations(true);
      toast.success('Item excluído!');
    } else {
      toast('Selecione um elemento para excluir.', { icon: 'ℹ️' });
    }
  }, [activePin, handleSaveAnnotations]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'TEXTAREA' ||
          target.tagName === 'INPUT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (fabricCanvasRef.current?.getActiveObjects().length) {
          e.preventDefault();
          handleDeleteSelected();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDeleteSelected]);

  /* -------------------------------------------------------------
     6. HELPER: CRIAÇÃO DO PINO DE COMENTÁRIO
  ------------------------------------------------------------- */
  const createCommentPin = (x: number, y: number, initialText: string = '') => {
    const pinId = `pin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const circle = new fabric.Circle({
      radius: 14,
      fill: '#f59e0b',
      stroke: '#ffffff',
      strokeWidth: 2,
      originX: 'center',
      originY: 'center',
      shadow: new fabric.Shadow({
        color: 'rgba(0,0,0,0.35)',
        blur: 6,
        offsetX: 1,
        offsetY: 2,
      }),
    });

    const icon = new fabric.IText('💬', {
      fontSize: 14,
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false,
    });

    const pinGroup = new fabric.Group([circle, icon], {
      left: x,
      top: y,
      originX: 'center',
      originY: 'center',
      subTargetCheck: false,
    });

    (pinGroup as any).id = pinId;
    attachPinProperties(pinGroup, initialText);

    return pinGroup;
  };

  /* -------------------------------------------------------------
     7. INICIALIZAÇÃO E EVENTOS DO FABRIC.JS
  ------------------------------------------------------------- */
  useEffect(() => {
    if (!canvasElementRef.current || !originalWidth || !originalHeight || !scale) return;

    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.dispose();
      fabricCanvasRef.current = null;
    }

    const actualWidth = originalWidth * scale;
    const actualHeight = originalHeight * scale;

    const canvas = new fabric.Canvas(canvasElementRef.current, {
      width: actualWidth,
      height: actualHeight,
      selection: true,
      preserveObjectStacking: true,
      fireRightClick: false,
      stopContextMenu: true,
    });

    fabricCanvasRef.current = canvas;

    // Carregar anotações salvas na página atual
    if (annotationsRef.current[pageNumber]) {
      handleLoadAnnotations(annotationsRef.current[pageNumber]);
    } else {
      canvas.requestRenderAll();
    }

    // Evento ao criar traços de desenho (Marca-texto)
    canvas.on('path:created', (e: any) => {
      const path = e.path;
      if (!path) return;

      if (activeToolRef.current === 'highlighter') {
        path.set({
          globalCompositeOperation: 'multiply',
          stroke: 'rgba(255, 255, 0, 0.4)',
          strokeWidth: Math.max(16, 20 * scale),
          strokeLineCap: 'square',
          strokeLineJoin: 'round',
        });
        canvas.requestRenderAll();
      }
    });

    const openPinPopover = (pinObj: any) => {
      const bound = pinObj.getBoundingRect();
      const canvasRect = canvasElementRef.current?.getBoundingClientRect();

      let screenX = 160;
      let screenY = 200;
      if (canvasRect) {
        screenX = canvasRect.left + bound.left + bound.width / 2;
        screenY = canvasRect.top + bound.top + bound.height + 10;
      }

      // Clamping seguro para caber em telas mobile de 320px / 360px / 390px
      const modalWidth = typeof window !== 'undefined' ? window.innerWidth : 400;
      const modalHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
      const popoverWidth = Math.min(300, modalWidth - 32);

      setActivePin({
        id: pinObj.id || `pin_${Date.now()}`,
        commentText: pinObj.commentText || '',
        screenX: Math.min(modalWidth - popoverWidth - 16, Math.max(16, screenX - popoverWidth / 2)),
        screenY: Math.min(modalHeight - 260, Math.max(80, screenY)),
        fabricObject: pinObj,
      });
    };

    canvas.on('mouse:down', (options: any) => {
      let targetObj = options.target;
      if (targetObj && !(targetObj as any).isPin && (targetObj as any).group?.isPin) {
        targetObj = (targetObj as any).group;
      }

      if (targetObj && (targetObj as any).isPin) {
        canvas.setActiveObject(targetObj);
        canvas.requestRenderAll();
        openPinPopover(targetObj);
        return;
      }

      if (activeToolRef.current === 'pin') {
        const pointer = canvas.getScenePoint(options.e);
        const pin = createCommentPin(pointer.x, pointer.y, '');
        canvas.add(pin);
        canvas.setActiveObject(pin);
        canvas.requestRenderAll();

        handleSelectTool('select');

        const clientX =
          options.e.clientX ||
          (options.e.touches && options.e.touches[0]?.clientX) ||
          180;
        const clientY =
          options.e.clientY ||
          (options.e.touches && options.e.touches[0]?.clientY) ||
          220;

        const modalWidth = typeof window !== 'undefined' ? window.innerWidth : 400;
        const popoverWidth = Math.min(300, modalWidth - 32);

        setActivePin({
          id: (pin as any).id,
          commentText: '',
          screenX: Math.min(modalWidth - popoverWidth - 16, Math.max(16, clientX - popoverWidth / 2)),
          screenY: Math.min(window.innerHeight - 260, Math.max(80, clientY + 15)),
          fabricObject: pin,
        });
        return;
      }

      if (!options.target && activePin) {
        setActivePin(null);
      }
    });

    const handleSelectionChanged = (e: any) => {
      let selected = e.selected?.[0] || canvas.getActiveObject();
      if (selected && !(selected as any).isPin && (selected as any).group?.isPin) {
        selected = (selected as any).group;
      }

      setHasSelection(!!selected);

      if (selected && (selected as any).isPin) {
        openPinPopover(selected);
      } else {
        setActivePin(null);
      }
    };

    canvas.on('selection:created', handleSelectionChanged);
    canvas.on('selection:updated', handleSelectionChanged);
    canvas.on('selection:cleared', () => {
      setHasSelection(false);
      setActivePin(null);
    });

    applyToolMode(activeTool, canvas);

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, [pageNumber, originalWidth, originalHeight, scale, handleLoadAnnotations]);

  /* -------------------------------------------------------------
     8. CONTROLE E SETUP DE FERRAMENTAS
  ------------------------------------------------------------- */
  const applyToolMode = (tool: ToolMode, canvasInstance?: fabric.Canvas | null) => {
    const canvas = canvasInstance || fabricCanvasRef.current;
    if (!canvas) return;

    if (tool === 'highlighter') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = 'rgba(255, 255, 0, 0.4)';
      canvas.freeDrawingBrush.width = Math.max(16, 20 * scale);
      canvas.selection = false;
    } else if (tool === 'draw') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = brushColor;
      canvas.freeDrawingBrush.width = Math.max(2, brushWidth * scale);
      canvas.selection = false;
    } else {
      canvas.isDrawingMode = false;
      canvas.selection = tool === 'select';
    }
  };

  const handleSelectTool = (tool: ToolMode) => {
    setActiveTool(tool);
    applyToolMode(tool);
    if (tool !== 'select') {
      setActivePin(null);
    }
    if (tool === 'pin') {
      toast('Toque ou clique no documento para posicionar o comentário.', {
        icon: '💬',
        duration: 3000,
      });
    }
  };

  const handleChangeColor = (color: string) => {
    setBrushColor(color);
    if (activeTool === 'draw' && fabricCanvasRef.current?.freeDrawingBrush) {
      fabricCanvasRef.current.freeDrawingBrush.color = color;
    }
    const activeObj = fabricCanvasRef.current?.getActiveObject();
    if (activeObj && activeObj.type === 'i-text') {
      (activeObj as fabric.IText).set('fill', color);
      fabricCanvasRef.current?.requestRenderAll();
    }
    setShowColorPicker(false);
  };

  const handleChangeBrushWidth = (width: number) => {
    setBrushWidth(width);
    if (activeTool === 'draw' && fabricCanvasRef.current?.freeDrawingBrush) {
      fabricCanvasRef.current.freeDrawingBrush.width = Math.max(2, width * scale);
    }
  };

  const handleAddText = () => {
    if (!fabricCanvasRef.current) return;
    handleSelectTool('select');
    setShowMoreMenu(false);

    const actualW = originalWidth * scale;
    const text = new fabric.IText('Digite sua anotação...', {
      left: Math.max(20, actualW * 0.1),
      top: 100,
      fontFamily: 'sans-serif',
      fontSize: Math.max(14, 18 * scale),
      fill: brushColor,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      padding: 6,
      cornerColor: '#3b82f6',
      cornerSize: 8,
      transparentCorners: false,
    });

    fabricCanvasRef.current.add(text);
    fabricCanvasRef.current.setActiveObject(text);
    text.enterEditing();
    fabricCanvasRef.current.requestRenderAll();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricCanvasRef.current) return;
    setShowMoreMenu(false);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      try {
        const img = await fabric.Image.fromURL(dataUrl);
        const maxImgWidth = (originalWidth * scale) * 0.6;
        if (img.width && img.width > maxImgWidth) {
          img.scaleToWidth(maxImgWidth);
        }
        img.set({
          left: Math.max(20, (originalWidth * scale) * 0.1),
          top: 150,
          cornerColor: '#3b82f6',
          cornerSize: 8,
          transparentCorners: false,
        });

        fabricCanvasRef.current?.add(img);
        fabricCanvasRef.current?.setActiveObject(img);
        fabricCanvasRef.current?.requestRenderAll();
        handleSelectTool('select');
      } catch (err) {
        console.error('[PDFAnnotator] Erro ao carregar imagem:', err);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleClearPage = () => {
    if (!fabricCanvasRef.current) return;
    setShowMoreMenu(false);
    if (confirm('Deseja limpar todas as anotações desta página?')) {
      fabricCanvasRef.current.clear();
      delete annotationsRef.current[pageNumber];
      fabricCanvasRef.current.requestRenderAll();
      setActivePin(null);
      setHasSelection(false);
      handleSaveAnnotations(true);
      toast.success('Página limpa!');
    }
  };

  const handleUndo = () => {
    if (!fabricCanvasRef.current) return;
    const objects = fabricCanvasRef.current.getObjects();
    if (objects.length > 0) {
      const last = objects[objects.length - 1];
      if (activePin?.fabricObject === last) {
        setActivePin(null);
      }
      fabricCanvasRef.current.remove(last);
      fabricCanvasRef.current.requestRenderAll();
    }
  };

  /* -------------------------------------------------------------
     9. GERENCIADOR DA JANELA DE PIN
  ------------------------------------------------------------- */
  const handleUpdatePinText = (text: string) => {
    if (!activePin || !activePin.fabricObject) return;

    const obj = activePin.fabricObject;
    (obj as any).commentText = text;
    (obj as any).set?.('commentText', text);
    obj.setCoords();
    fabricCanvasRef.current?.requestRenderAll();

    setActivePin((prev) => (prev ? { ...prev, commentText: text } : null));
    snapshotCurrentPage();
  };

  const handleDeletePin = () => {
    if (!activePin || !fabricCanvasRef.current) return;
    fabricCanvasRef.current.remove(activePin.fabricObject);
    fabricCanvasRef.current.discardActiveObject();
    fabricCanvasRef.current.requestRenderAll();
    setActivePin(null);
    setHasSelection(false);
    handleSaveAnnotations(true);
    toast.success('Comentário removido');
  };

  /* -------------------------------------------------------------
     10. PAGINAÇÃO E CARREGAMENTO DO PDF
  ------------------------------------------------------------- */
  const changePage = (offset: number) => {
    const newPage = pageNumber + offset;
    if (newPage >= 1 && newPage <= numPages) {
      snapshotCurrentPage();
      handleSaveAnnotations(true);
      setActivePin(null);
      setHasSelection(false);
      setPageNumber(newPage);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoadingPdf(false);
  };

  const onPageLoadSuccess = (page: any) => {
    const viewport = page.getViewport({ scale: 1.0 });
    setOriginalWidth(viewport.width);
    setOriginalHeight(viewport.height);
  };

  const handleDownloadOriginal = () => {
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = fileName;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleClose = async () => {
    await handleSaveAnnotations(true);
    onClose();
  };

  const actualWidth = originalWidth * scale;
  const actualHeight = originalHeight * scale;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col h-[100dvh] w-full max-w-[100vw] overflow-hidden select-none animate-in fade-in duration-200">
      
      {/* =========================================================
          BARRA SUPERIOR (HEADER) RESPONSIVA
      ========================================================= */}
      <header className="h-14 sm:h-16 bg-[#002f3e] text-white px-3 sm:px-4 flex items-center justify-between border-b border-white/10 shrink-0 z-20 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1.5 sm:p-2 bg-blue-500/20 text-blue-400 rounded-xl shrink-0">
            <Pencil className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-xs sm:text-base text-white truncate max-w-[130px] xs:max-w-[180px] sm:max-w-md">
              {fileName}
            </h2>
            <p className="text-[9px] sm:text-[10px] text-gray-400 hidden sm:block truncate">
              Leitura e anotações ativas
            </p>
          </div>
        </div>

        {/* Paginador Central */}
        <div className="flex items-center gap-1 bg-black/40 border border-white/10 px-1.5 py-0.5 sm:py-1 rounded-xl shrink-0">
          <button
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1}
            className="p-1 text-gray-300 hover:text-white disabled:opacity-20 transition rounded-lg hover:bg-white/10"
            title="Página Anterior"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <span className="text-[11px] sm:text-xs font-bold text-gray-200 px-1 min-w-[42px] sm:min-w-[50px] text-center">
            {pageNumber}/{numPages || '–'}
          </span>
          <button
            onClick={() => changePage(1)}
            disabled={pageNumber >= numPages}
            className="p-1 text-gray-300 hover:text-white disabled:opacity-20 transition rounded-lg hover:bg-white/10"
            title="Próxima Página"
          >
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Ações da Direita */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Zoom (Desktop) */}
          <div className="hidden lg:flex items-center gap-1 bg-black/30 border border-white/10 rounded-xl p-0.5">
            <button
              onClick={() => setUserZoom((z) => Math.max(0.6, z - 0.15))}
              className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition"
              title="Diminuir Zoom"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-bold text-gray-300 px-1">
              {Math.round(userZoom * 100)}%
            </span>
            <button
              onClick={() => setUserZoom((z) => Math.min(2.2, z + 0.15))}
              className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => handleSaveAnnotations(false)}
            disabled={isSaving}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
            title="Salvar Anotações"
          >
            {isSaving ? (
              <Loader className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Salvar</span>
          </button>

          <button
            onClick={handleDownloadOriginal}
            className="p-1.5 sm:p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition"
            title="Baixar Arquivo"
          >
            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            onClick={handleClose}
            className="p-1.5 sm:p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition"
            title="Fechar Visualizador"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </header>

      {/* =========================================================
          CORPO PRINCIPAL (ÁREA DE LEITURA 100% RESPONSIVA)
      ========================================================= */}
      <div
        ref={containerRef}
        className="flex-1 w-full max-w-full overflow-x-hidden overflow-y-auto p-2 sm:p-6 md:p-8 flex justify-center items-start custom-scrollbar bg-neutral-900/70 relative"
      >
        {loadingPdf && (
          <div className="flex flex-col items-center justify-center my-auto py-20 gap-3 text-white/70">
            <Loader className="w-8 h-8 animate-spin text-blue-400" />
            <p className="text-xs font-semibold uppercase tracking-wider">
              Carregando documento...
            </p>
          </div>
        )}

        {scale > 0 && (
          <div
            className="relative shadow-2xl rounded-sm overflow-hidden bg-white my-auto transition-all duration-75 max-w-full"
            style={{
              width: actualWidth ? `${actualWidth}px` : '100%',
              height: actualHeight ? `${actualHeight}px` : 'auto',
              display: loadingPdf ? 'none' : 'block',
            }}
          >
            {/* CAMADA 1: Renderização do PDF via react-pdf */}
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
                  devicePixelRatio={dpr}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                  onLoadSuccess={onPageLoadSuccess}
                />
              </Document>
            </div>

            {/* CAMADA 2: Canvas transparente via Fabric.js */}
            <div className="absolute inset-0 z-10 touch-none">
              <canvas ref={canvasElementRef} />
            </div>
          </div>
        )}
      </div>

      {/* =========================================================
          POPOVER FLUTUANTE DE COMENTÁRIO (PIN) RESPONSIVO
      ========================================================= */}
      {activePin && (
        <div
          className="fixed z-[120] w-[calc(100vw-32px)] max-w-[300px] bg-white rounded-2xl shadow-2xl border border-gray-200 p-3.5 space-y-2.5 animate-in zoom-in-95 duration-150"
          style={{
            left: `${activePin.screenX}px`,
            top: `${activePin.screenY}px`,
          }}
        >
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
              <span className="p-1 bg-amber-100 text-amber-700 rounded-md">
                💬
              </span>
              <span>Nota de Comentário</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleDeletePin}
                className="p-1 text-gray-400 hover:text-red-500 rounded-lg transition"
                title="Excluir este comentário"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setActivePin(null);
                  handleSaveAnnotations(true);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition"
                title="Fechar nota"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <textarea
            autoFocus
            rows={3}
            value={activePin.commentText}
            onChange={(e) => handleUpdatePinText(e.target.value)}
            placeholder="Escreva sua anotação ou resolução aqui..."
            className="w-full text-xs text-gray-800 p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none resize-none leading-relaxed"
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-gray-400">Salvo no PDF</span>
            <button
              onClick={() => {
                setActivePin(null);
                handleSaveAnnotations(true);
              }}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg transition"
            >
              Concluído
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          TOOLBAR FLUTUANTE ADAPTÁVEL (MOBILE-FIRST)
      ========================================================= */}
      <div className="fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/95 backdrop-blur-md text-white border border-white/20 rounded-2xl shadow-2xl px-2 sm:px-3 py-1.5 sm:py-2 flex items-center gap-1 sm:gap-2 max-w-[96vw] overflow-x-auto">
        
        {/* 1. Mover / Selecionar */}
        <button
          onClick={() => handleSelectTool('select')}
          className={`p-2 sm:p-2.5 rounded-xl transition flex items-center justify-center shrink-0 ${
            activeTool === 'select'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`}
          title="Modo Seleção / Mover"
        >
          <MousePointer className="w-4 h-4" />
        </button>

        {/* 2. Marca-Texto (Highlighter) */}
        <button
          onClick={() => handleSelectTool('highlighter')}
          className={`p-2 sm:p-2.5 rounded-xl transition flex items-center justify-center shrink-0 relative ${
            activeTool === 'highlighter'
              ? 'bg-amber-500 text-white shadow-md ring-2 ring-amber-300/40'
              : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`}
          title="Marca-Texto Amarelo"
        >
          <Highlighter className="w-4 h-4 text-amber-300" />
        </button>

        {/* 3. Lápis / Caneta */}
        <button
          onClick={() => handleSelectTool('draw')}
          className={`p-2 sm:p-2.5 rounded-xl transition flex items-center justify-center shrink-0 relative ${
            activeTool === 'draw'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`}
          title="Lápis / Caneta Livre"
        >
          <Pencil className="w-4 h-4" />
          <span
            className="absolute bottom-1 right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full border border-neutral-900"
            style={{ backgroundColor: brushColor }}
          />
        </button>

        {/* 4. Inserir Pin de Comentário */}
        <button
          onClick={() => handleSelectTool('pin')}
          className={`p-2 sm:p-2.5 rounded-xl transition flex items-center justify-center shrink-0 relative ${
            activeTool === 'pin'
              ? 'bg-amber-500 text-white shadow-md ring-2 ring-amber-300/40'
              : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`}
          title="Adicionar Comentário (Pin)"
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        {/* 5. Inserir Texto (Visível no Desktop, em More no mobile) */}
        <button
          onClick={handleAddText}
          className="hidden sm:flex p-2 sm:p-2.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition items-center justify-center shrink-0"
          title="Inserir Caixa de Texto"
        >
          <Type className="w-4 h-4" />
        </button>

        {/* 6. Paleta de Cor (Desktop) */}
        <div className="relative shrink-0 hidden sm:block">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-2 sm:p-2.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition flex items-center justify-center"
            title="Escolher Cor do Lápis"
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
                      borderColor: brushColor === c ? '#ffffff' : 'transparent',
                    }}
                  >
                    {brushColor === c && (
                      <Check className="w-3 h-3 text-white drop-shadow" />
                    )}
                  </button>
                ))}
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-bold block">
                  Espessura: {brushWidth}px
                </span>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={brushWidth}
                  onChange={(e) =>
                    handleChangeBrushWidth(Number(e.target.value))
                  }
                  className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* 7. Desfazer */}
        <button
          onClick={handleUndo}
          className="p-2 sm:p-2.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition flex items-center justify-center shrink-0"
          title="Desfazer Última Ação"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        {/* 8. Excluir Selecionado */}
        <button
          onClick={handleDeleteSelected}
          disabled={!hasSelection}
          className={`p-2 sm:p-2.5 rounded-xl transition flex items-center justify-center shrink-0 ${
            hasSelection
              ? 'text-red-400 hover:text-red-300 hover:bg-red-500/20 bg-red-500/10'
              : 'text-gray-500 opacity-40 cursor-not-allowed'
          }`}
          title="Excluir Elemento Selecionado"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* 9. Menu Mais Opções (Kebab ⋮ no Mobile / Ações Secundárias) */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`p-2 sm:p-2.5 rounded-xl transition flex items-center justify-center ${
              showMoreMenu ? 'bg-white/20 text-white' : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
            title="Mais Opções"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMoreMenu && (
            <div className="absolute bottom-12 right-0 bg-neutral-900 border border-white/20 p-2 rounded-2xl shadow-2xl flex flex-col gap-1 z-50 min-w-[180px] animate-in fade-in zoom-in-95 text-xs">
              
              {/* Cores no Menu Mobile */}
              <div className="p-2 border-b border-white/10">
                <span className="text-[10px] text-gray-400 font-bold block mb-1.5 uppercase tracking-wider">
                  Cor da caneta
                </span>
                <div className="flex items-center gap-1.5 justify-between">
                  {colorOptions.map((c) => (
                    <button
                      key={c}
                      onClick={() => handleChangeColor(c)}
                      className="w-5 h-5 rounded-full border-2 transition flex items-center justify-center"
                      style={{
                        backgroundColor: c,
                        borderColor: brushColor === c ? '#ffffff' : 'transparent',
                      }}
                    >
                      {brushColor === c && (
                        <Check className="w-2.5 h-2.5 text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Caixa de Texto */}
              <button
                onClick={handleAddText}
                className="w-full text-left px-3 py-2 text-gray-200 hover:bg-white/10 rounded-xl flex items-center gap-2 font-medium"
              >
                <Type className="w-4 h-4 text-blue-400" />
                <span>Inserir Texto</span>
              </button>

              {/* Inserir Imagem */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full text-left px-3 py-2 text-gray-200 hover:bg-white/10 rounded-xl flex items-center gap-2 font-medium"
              >
                <ImageIcon className="w-4 h-4 text-purple-400" />
                <span>Inserir Imagem / Selo</span>
              </button>

              {/* Zoom Controls no Mobile */}
              <div className="flex sm:hidden items-center justify-between px-3 py-2 text-gray-200 border-t border-white/10 mt-1">
                <span className="text-[11px] font-bold text-gray-400">Zoom</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setUserZoom((z) => Math.max(0.6, z - 0.15))}
                    className="p-1 hover:bg-white/10 rounded-lg"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-bold min-w-[32px] text-center">
                    {Math.round(userZoom * 100)}%
                  </span>
                  <button
                    onClick={() => setUserZoom((z) => Math.min(2.2, z + 0.15))}
                    className="p-1 hover:bg-white/10 rounded-lg"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Limpar Página */}
              <button
                onClick={handleClearPage}
                className="w-full text-left px-3 py-2 text-red-400 hover:bg-red-500/20 rounded-xl flex items-center gap-2 font-bold border-t border-white/10 mt-1"
              >
                <Trash2 className="w-4 h-4" />
                <span>Limpar Página</span>
              </button>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>
    </div>
  );
}