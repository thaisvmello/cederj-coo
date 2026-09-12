"use client";

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Link, useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  AlertTriangle, 
  Star, 
  Upload, 
  X, 
  Send, 
  Loader, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Info,
  LogIn,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AttachedFile {
  file: File;
  url: string;
}

export function Feedback() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'bug' | 'suggestion'>('bug');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Limpeza dos Object URLs criados para as prévias de imagem
  useEffect(() => {
    return () => {
      attachedFiles.forEach(item => URL.revokeObjectURL(item.url));
    };
  }, []);

  const handleAddFiles = (filesList: FileList | File[]) => {
    const imageFiles = Array.from(filesList).filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      toast.error('Selecione arquivos de imagem válidos (PNG, JPG, WEBP).');
      return;
    }

    if (attachedFiles.length + imageFiles.length > 5) {
      toast.error('Você pode enviar no máximo 5 imagens como anexo.');
      return;
    }

    const newEntries: AttachedFile[] = imageFiles.map(file => ({
      file,
      url: URL.createObjectURL(file)
    }));

    setAttachedFiles(prev => [...prev, ...newEntries]);
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles(prev => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Você precisa estar conectado para enviar.');
      return;
    }

    if (!title.trim() || !description.trim()) {
      toast.error('Por favor, preencha o título e a descrição.');
      return;
    }

    setLoading(true);

    try {
      const attachmentUrls: string[] = [];

      for (const item of attachedFiles) {
        const fileExt = item.file.name.split('.').pop() || 'png';
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}.${fileExt}`;
        
        const { data, error: uploadError } = await supabase.storage
          .from('feedback-attachments')
          .upload(fileName, item.file);

        if (!uploadError && data) {
          const { data: { publicUrl } } = supabase.storage
            .from('feedback-attachments')
            .getPublicUrl(data.path);
          attachmentUrls.push(publicUrl);
        } else if (uploadError) {
          console.warn('Aviso: falha ao enviar anexo para o storage:', uploadError);
        }
      }

      const { error: dbError } = await supabase.from('feedback_reports').insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        type,
        attachments: attachmentUrls
      });

      if (dbError) throw dbError;

      toast.success(
        type === 'bug' 
          ? 'Erro reportado com sucesso! Obrigado por colaborar.' 
          : 'Sugestão enviada com sucesso! Agradecemos sua ideia.'
      );

      setIsSubmitted(true);
      setTitle('');
      setDescription('');
      attachedFiles.forEach(item => URL.revokeObjectURL(item.url));
      setAttachedFiles([]);
    } catch (error: any) {
      console.error('Erro ao enviar feedback:', error);
      toast.error(error.message || 'Erro ao enviar. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setIsSubmitted(false);
    setTitle('');
    setDescription('');
    setType('bug');
    attachedFiles.forEach(item => URL.revokeObjectURL(item.url));
    setAttachedFiles([]);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <Header showHomeButton={true} onGoHome={() => navigate('/')} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Cabeçalho da Página */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Erros e Sugestões
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">
              Ajude a melhorar o acervo reportando falhas, links corrompidos ou propondo novas ideias.
            </p>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition shadow-xs w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Acervo
          </Link>
        </div>

        {/* Alerta caso usuário não esteja autenticado */}
        {!user && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3 text-amber-800 text-xs sm:text-sm">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>Você precisa estar conectado para registrar um relato ou sugestão.</span>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              Fazer Login
            </Link>
          </div>
        )}

        {/* Estado de Sucesso */}
        {isSubmitted ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 sm:p-12 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="text-xl font-bold text-gray-900">
                Relato Enviado com Sucesso!
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Muito obrigado por contribuir com a comunidade do Acervo CEDERJ. A moderação irá analisar seu relato em breve.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetForm}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
              >
                <RefreshCw className="w-4 h-4" />
                Enviar Outro Relato
              </button>

              <Link
                to="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar à Página Inicial
              </Link>
            </div>
          </div>
        ) : (
          /* Formulário Principal */
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
              
              {/* Seletor de Tipo (Bug vs Sugestão) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
                  Qual é o objetivo do seu relato? *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setType('bug')}
                    className={`p-4 rounded-xl border text-left flex items-start gap-3.5 transition ${
                      type === 'bug'
                        ? 'border-rose-500 bg-rose-50/50 ring-2 ring-rose-500/20'
                        : 'border-gray-200 hover:bg-gray-50 bg-white'
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${type === 'bug' ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${type === 'bug' ? 'text-rose-900' : 'text-gray-900'}`}>
                          Reportar um Erro
                        </span>
                        {type === 'bug' && (
                          <span className="text-[10px] font-bold uppercase bg-rose-200 text-rose-800 px-1.5 py-0.5 rounded">
                            Selecionado
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                        Arquivo corrompido, link quebrado, erro visual ou falha técnica.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType('suggestion')}
                    className={`p-4 rounded-xl border text-left flex items-start gap-3.5 transition ${
                      type === 'suggestion'
                        ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
                        : 'border-gray-200 hover:bg-gray-50 bg-white'
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${type === 'suggestion' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      <Star className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${type === 'suggestion' ? 'text-blue-900' : 'text-gray-900'}`}>
                          Enviar uma Sugestão
                        </span>
                        {type === 'suggestion' && (
                          <span className="text-[10px] font-bold uppercase bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded">
                            Selecionado
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                        Nova pasta, melhorias de usabilidade, novas ferramentas e materiais.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Campo Título */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Título *
                </label>
                <input 
                  type="text"
                  required
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder={
                    type === 'bug' 
                      ? 'Ex: Erro ao tentar abrir o PDF de Contabilidade Geral II (2024.1)' 
                      : 'Ex: Sugestão de link externo para aulas de Direito Tributário'
                  }
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>

              {/* Campo Descrição */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Descrição detalhada *
                </label>
                <textarea 
                  required
                  rows={4}
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder={
                    type === 'bug'
                      ? 'Descreva o que ocorreu, em qual disciplina/pasta e, se possível, os passos que você fez antes do erro...'
                      : 'Explique sua sugestão com detalhes e como ela pode ajudar os estudantes no dia a dia...'
                  }
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none leading-relaxed"
                />
              </div>

              {/* Área de Anexos (Imagens / Capturas) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Capturas de Tela / Imagens (Opcional)
                  </label>
                  <span className="text-[11px] text-gray-400 font-medium">
                    {attachedFiles.length}/5 imagens
                  </span>
                </div>

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={(e) => {
                    if (e.target.files) {
                      handleAddFiles(e.target.files);
                      e.target.value = '';
                    }
                  }} 
                  multiple 
                  accept="image/*" 
                  className="hidden" 
                />

                {/* Zona de Arrastar / Clicar */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
                    isDragging 
                      ? 'border-blue-500 bg-blue-50/50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 bg-gray-50/20'
                  }`}
                >
                  <div className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center mx-auto mb-2.5 text-gray-500 shadow-2xs">
                    <Upload className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-xs font-bold text-gray-700">
                    Clique aqui ou arraste imagens para anexar
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Formatos suportados: PNG, JPG ou WEBP (máximo 5 arquivos)
                  </p>
                </div>

                {/* Lista de Imagens Pré-visualizadas */}
                {attachedFiles.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                    {attachedFiles.map((item, index) => (
                      <div 
                        key={index}
                        className="relative group bg-white border border-gray-200 rounded-xl overflow-hidden p-1.5 shadow-2xs flex items-center gap-2.5"
                      >
                        <img 
                          src={item.url} 
                          alt={`Anexo ${index + 1}`} 
                          className="w-12 h-12 rounded-lg object-cover bg-gray-100 shrink-0"
                        />
                        <div className="min-w-0 flex-1 pr-5">
                          <p className="text-xs font-medium text-gray-800 truncate" title={item.file.name}>
                            {item.file.name}
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium">
                            {(item.file.size / 1024).toFixed(0)} KB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile(index);
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-md transition shadow-xs"
                          title="Remover anexo"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Botão de Envio */}
              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={loading || !user}
                  className={`w-full py-3.5 px-6 rounded-xl text-white font-bold text-xs sm:text-sm transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 ${
                    type === 'bug' 
                      ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800' 
                      : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Enviando relato...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{type === 'bug' ? 'Enviar Relato de Erro' : 'Enviar Sugestão'}</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        )}

        {/* Dicas para um bom relato */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wider">
            <Info className="w-4 h-4 text-blue-600" />
            Dicas para um relato eficiente
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600 leading-relaxed">
            <div className="p-3 bg-gray-50 rounded-xl">
              <span className="font-bold text-gray-800 block mb-1">1. Seja específico</span>
              Cite o nome da disciplina, semestre e pasta exata onde você encontrou o problema.
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <span className="font-bold text-gray-800 block mb-1">2. Anexe fotos</span>
              Uma captura de tela do erro ou do material ajuda a equipe a resolver a questão muito mais rápido.
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <span className="font-bold text-gray-800 block mb-1">3. Sugira melhorias</span>
              Sentiu falta de uma função ou disciplina? Descreva o que tornaria seus estudos mais práticos.
            </div>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}

