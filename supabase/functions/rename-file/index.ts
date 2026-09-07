import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log("[rename-file] Processando solicitação de renomeação");

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://tlcdhwjkdbrmrwueeokj.supabase.co';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada no servidor');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Sessão inválida ou expirada' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const { fileId, newName } = await req.json();
    if (!fileId || !newName || !newName.trim()) {
      return new Response(JSON.stringify({ error: 'fileId e newName são obrigatórios' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`[rename-file] Renomeando arquivo ${fileId} para "${newName.trim()}" por usuário ${user.id}`);

    const { error: updateError } = await supabase
      .from('files')
      .update({ name: newName.trim() })
      .eq('id', fileId);

    if (updateError) {
      console.error("[rename-file] Erro ao atualizar no banco:", updateError);
      throw updateError;
    }

    console.log("[rename-file] Arquivo renomeado com sucesso!");

    return new Response(
      JSON.stringify({ success: true, fileId, name: newName.trim() }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error(`[rename-file] Erro: ${error.message}`);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});