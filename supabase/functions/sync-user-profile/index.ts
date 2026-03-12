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
    console.log("[sync-user-profile] Requisição recebida");

    // 1. Validar Autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // 2. Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://tlcdhwjkdbrmrwueeokj.supabase.co';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Verificar token e obter usuário
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`[sync-user-profile] Sincronizando perfil para usuário: ${user.id}`);

    // 4. Extrair dados do usuário
    let firstName = '';
    let lastName = '';
    let avatarUrl = '';

    // Se vier do Google
    if (user.user_metadata?.full_name) {
      const fullName = user.user_metadata.full_name;
      firstName = fullName.split(' ')[0];
      lastName = fullName.split(' ').slice(1).join(' ');
      avatarUrl = user.user_metadata.avatar_url || '';
    } 
    // Se vier de cadastro manual
    else if (user.user_metadata?.first_name || user.user_metadata?.last_name) {
      firstName = user.user_metadata.first_name || '';
      lastName = user.user_metadata.last_name || '';
    }
    // Se não tiver nome, usar email como fallback
    else {
      const emailParts = user.email?.split('@')[0] || 'Usuário';
      firstName = emailParts;
    }

    // 5. Criar ou atualizar perfil
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        first_name: firstName,
        last_name: lastName,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      });

    if (upsertError) {
      console.error(`[sync-user-profile] Erro ao upsert perfil: ${upsertError.message}`);
      throw upsertError;
    }

    console.log(`[sync-user-profile] Perfil sincronizado com sucesso para: ${firstName} ${lastName}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: { 
          id: user.id, 
          email: user.email,
          first_name: firstName,
          last_name: lastName,
          avatar_url: avatarUrl
        } 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error(`[sync-user-profile] Erro: ${error.message}`);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});