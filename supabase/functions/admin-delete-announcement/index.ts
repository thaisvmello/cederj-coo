import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ADMIN_EMAIL = 'thaisverissimomello@gmail.com';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log("[admin-delete-announcement] Iniciando processo de exclusão");

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Verificar se o usuário é realmente o administrador
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      console.error("[admin-delete-announcement] Acesso negado para:", user?.email);
      return new Response(JSON.stringify({ error: 'Acesso negado: Apenas administradores podem excluir anúncios.' }), { 
        status: 403, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // 2. Obter dados do anúncio para excluir todas as cópias
    const { title, content } = await req.json();
    if (!title || !content) {
      throw new Error("Título e conteúdo são obrigatórios para identificar o anúncio.");
    }

    console.log(`[admin-delete-announcement] Excluindo anúncio: "${title}"`);

    // 3. Excluir todas as notificações que correspondem ao anúncio global
    const { error: deleteError, count } = await supabase
      .from('notifications')
      .delete({ count: 'exact' })
      .eq('type', 'announcement')
      .eq('title', title)
      .eq('content', content);

    if (deleteError) throw deleteError;

    console.log(`[admin-delete-announcement] Sucesso. Registros removidos: ${count}`);

    return new Response(
      JSON.stringify({ success: true, deletedCount: count }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error(`[admin-delete-announcement] Erro: ${error.message}`);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});