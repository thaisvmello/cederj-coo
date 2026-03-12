import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { S3Client } from "https://deno.land/x/s3_lite_client@0.7.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // 1. Lidar com Preflight (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log("[get-r2-upload-url] Nova requisição iniciada");

    // 2. Validar Autenticação (apenas presença do header para evitar bloqueios de rede)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("[get-r2-upload-url] Erro: Sem header de autorização");
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // 3. Extrair e Validar Corpo
    const body = await req.json().catch(() => ({}));
    const { fileName, folderId } = body;
    
    if (!fileName || !folderId) {
      console.error("[get-r2-upload-url] Erro: Dados ausentes no corpo", { fileName, folderId });
      throw new Error("fileName e folderId são obrigatórios.");
    }

    // 4. Carregar Secrets
    const endpoint = Deno.env.get("R2_ENDPOINT");
    const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
    const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY");
    const bucketName = Deno.env.get("R2_BUCKET_NAME");
    const publicDomain = Deno.env.get("R2_PUBLIC_DOMAIN");

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName || !publicDomain) {
      throw new Error("Configuração do servidor R2 incompleta (Secrets faltando).");
    }

    // 5. Configurar Cliente S3
    const s3Client = new S3Client({
      endPoint: endpoint.replace(/^https?:\/\//, ''),
      accessKey: accessKeyId,
      secretKey: secretAccessKey,
      region: "auto",
      useSSL: true,
      pathStyle: true,
    });

    // 6. Gerar Caminho e URL Assinada
    const timestamp = Date.now();
    const extension = fileName.split('.').pop();
    const key = `materials/${folderId}/${timestamp}.${extension}`;

    const uploadUrl = await s3Client.getPresignedUrl("PUT", key, {
      bucketName: bucketName,
      expirySeconds: 3600,
    });

    const publicUrl = `${publicDomain.replace(/\/$/, '')}/${key}`;

    console.log(`[get-r2-upload-url] Sucesso gerando URL para: ${key}`);

    return new Response(
      JSON.stringify({ uploadUrl, publicUrl }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    console.error(`[get-r2-upload-url] Erro Crítico: ${message}`);
    return new Response(
      JSON.stringify({ error: message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});