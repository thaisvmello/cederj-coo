-- Remover política restritiva de perfis
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;

-- Criar nova política permitindo que qualquer usuário autenticado veja nomes e avatares
CREATE POLICY "profiles_read_all" ON public.profiles
FOR SELECT TO authenticated USING (true);

-- Garantir que comentários podem ser lidos por todos os autenticados
DROP POLICY IF EXISTS "Permitir leitura para usuários autenticados" ON public.folder_comments;
CREATE POLICY "folder_comments_read_all" ON public.folder_comments
FOR SELECT TO authenticated USING (true);