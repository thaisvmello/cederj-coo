import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { S3Client } from "https://deno.land/x/s3_lite_client@0.7.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Lidar com CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // 2. Verificar Autenticação
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: corsHeaders })
    }

    // 3. Pegar dados da requisição
    const { fileName, fileType, folderId } = await req.json();

    // 4. Pegar variáveis de ambiente
    const endpoint = Deno.env.get("R2_ENDPOINT");
    const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
    const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY");
    const bucketName = Deno.env.get("R2_BUCKET_NAME");
    const publicDomain = Deno.env.get("R2_PUBLIC_DOMAIN");

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName || !publicDomain) {
      throw new Error('Secrets do R2 não configurados no Supabase');
    }

    // 5. Configurar o cliente S3 Lite (específico para Deno)
    // Removemos o 'https://' do endpoint pois a lib espera apenas o hostname
    const s3Client = new S3Client({
      endPoint: endpoint.replace('https://', ''),
      accessKey: accessKeyId,
      secretKey: secretAccessKey,
      region: "auto",
      useSSL: true,
    });

    // 6. Gerar nome de arquivo seguro e caminho
    const fileExtension = fileName.split('.').pop();
    const safeFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExtension}`;
    const key = `materials/${folderId}/${safeFileName}`;

    // 7. Gerar a URL assinada para upload (PUT)
    // Esta lib é muito mais estável no Supabase
    const uploadUrl = await s3Client.getPresignedUrl("PUT", key, {
      bucketName: bucketName,
      expirySeconds: 3600,
    });
    
    // 8. URL final para visualização pública
    const publicUrl = `${publicDomain.replace(/\/$/, '')}/${key}`;

    console.log(`[get-r2-upload-url] Sucesso: ${fileName}`);

    return new Response(
      JSON.stringify({ uploadUrl, publicUrl }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("[get-r2-upload-url] Erro:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})