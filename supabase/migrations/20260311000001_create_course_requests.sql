-- Criar tabela de solicitações de disciplinas
CREATE TABLE IF NOT EXISTS public.course_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  period TEXT,
  subject_type TEXT DEFAULT 'Obrigatória',
  is_mandatory BOOLEAN DEFAULT true,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.course_requests ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can create course requests" ON public.course_requests;
DROP POLICY IF EXISTS "Users can view their own course requests" ON public.course_requests;
DROP POLICY IF EXISTS "Authenticated users can view all course requests" ON public.course_requests;
DROP POLICY IF EXISTS "Authenticated users can update course requests" ON public.course_requests;

-- Política: Usuários autenticados podem criar solicitações
CREATE POLICY "Users can create course requests"
  ON public.course_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requested_by);

-- Política: Usuários podem ver suas próprias solicitações
CREATE POLICY "Users can view their own course requests"
  ON public.course_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = requested_by);

-- Política: Todos podem ver todas as solicitações (controle de admin no frontend)
CREATE POLICY "Authenticated users can view all course requests"
  ON public.course_requests
  FOR SELECT
  TO authenticated
  USING (true);

-- Política: Todos podem atualizar (controle de admin no frontend)
CREATE POLICY "Authenticated users can update course requests"
  ON public.course_requests
  FOR UPDATE
  TO authenticated
  USING (true);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_course_requests_requested_by ON public.course_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_course_requests_status ON public.course_requests(status);