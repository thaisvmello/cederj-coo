-- Remover política restritiva de perfis
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;

-- Criar nova política permitindo que qualquer usuário autenticado veja nomes e avatares
CREATE POLICY "profiles_read_all" ON public.profiles
FOR SELECT TO authenticated USING (true);

-- Garantir que comentários podem ser lidos por todos os autenticados
DROP POLICY IF EXISTS "Permitir leitura para usuários autenticados" ON public.folder_comments;
CREATE POLICY "folder_comments_read_all" ON public.folder_comments
FOR SELECT TO authenticated USING (true);

-- Permitir que todos os usuários autenticados (não-admin incluídos) possam editar/renomear nomes dos arquivos
DROP POLICY IF EXISTS "Authenticated users can update files" ON public.files;
DROP POLICY IF EXISTS "Authenticated users can rename files" ON public.files;
DROP POLICY IF EXISTS "files_update_policy" ON public.files;

CREATE POLICY "Authenticated users can update files"
  ON public.files FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);