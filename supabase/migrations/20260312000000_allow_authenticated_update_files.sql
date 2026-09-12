-- Permitir que todos os usuários autenticados (não-admin incluídos) possam editar/renomear nomes dos arquivos
DROP POLICY IF EXISTS "Authenticated users can update files" ON public.files;
DROP POLICY IF EXISTS "Authenticated users can rename files" ON public.files;
DROP POLICY IF EXISTS "files_update_policy" ON public.files;

CREATE POLICY "Authenticated users can update files"
  ON public.files FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
