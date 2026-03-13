-- Criar tabela de solicitações de pastas
CREATE TABLE IF NOT EXISTS public.folder_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_name TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.folder_requests ENABLE ROW LEVEL SECURITY;

-- Política: Usuários autenticados podem criar solicitações
CREATE POLICY "Users can create folder requests"
  ON public.folder_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requested_by);

-- Política: Usuários podem ver suas próprias solicitações
CREATE POLICY "Users can view their own requests"
  ON public.folder_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = requested_by);

-- Política: Admin pode ver todas as solicitações
CREATE POLICY "Admin can view all requests"
  ON public.folder_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'thaisverissimomello@gmail.com'
    )
  );

-- Política: Admin pode atualizar solicitações
CREATE POLICY "Admin can update requests"
  ON public.folder_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'thaisverissimomello@gmail.com'
    )
  );

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_folder_requests_course_id ON public.folder_requests(course_id);
CREATE INDEX IF NOT EXISTS idx_folder_requests_requested_by ON public.folder_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_folder_requests_status ON public.folder_requests(status);