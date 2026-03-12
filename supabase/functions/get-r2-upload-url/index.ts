import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { S3Client } from "https://deno.land/x/s3_lite_client@0.7.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log("[get-r2-upload-url] Iniciando processo de geração de URL...");

    // 1. Verificar Autenticação
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error("[get-r2-upload-url] Erro: Cabeçalho de autorização ausente");
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: corsHeaders })
    }

    // 2. Pegar dados da requisição
    const { fileName, fileType, folderId } = await req.json();
    console.log(`[get-r2-upload-url] Arquivo: ${fileName}, Tipo: ${fileType}, Pasta: ${folderId}`);

    // 3. Pegar variáveis de ambiente
    const endpoint = Deno.env.get("R2_ENDPOINT");
    const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
    const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY");
    const bucketName = Deno.env.get("R2_BUCKET_NAME");
    const publicDomain = Deno.env.get("R2_PUBLIC_DOMAIN");

    // Log de verificação (sem mostrar as chaves completas por segurança)
    console.log("[get-r2-upload-url] Verificando variáveis de ambiente...");
    if (!endpoint) console.error("[get-r2-upload-url] R2_ENDPOINT está faltando");
    if (!accessKeyId) console.error("[get-r2-upload-url] R2_ACCESS_KEY_ID está faltando");
    if (!bucketName) console.error("[get-r2-upload-url] R2_BUCKET_NAME está faltando");

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName || !publicDomain) {
      throw new Error('Configurações do R2 incompletas no Supabase (verifique os Secrets)');
    }

    // 4. Configurar o cliente S3 Lite
    // Importante: R2 funciona melhor com pathStyle: true
    const s3Client = new S3Client({
      endPoint: endpoint.replace('https://', ''),
      accessKey: accessKeyId,
      secretKey: secretAccessKey,
      region: "auto",
      useSSL: true,
      pathStyle: true, // Força o uso de /bucket/objeto em vez de bucket.endpoint/objeto
    });

    // 5. Gerar nome de arquivo seguro
    const fileExtension = fileName.split('.').pop();
    const safeFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExtension}`;
    const key = `materials/${folderId}/${safeFileName}`;

    // 6. Gerar a URL assinada
    console.log("[get-r2-upload-url] Gerando URL assinada...");
    const uploadUrl = await s3Client.getPresignedUrl("PUT", key, {
      bucketName: bucketName,
      expirySeconds: 3600,
    });
    
    const publicUrl = `${publicDomain.replace(/\/$/, '')}/${key}`;

    console.log("[get-r2-upload-url] URL gerada com sucesso!");

    return new Response(
      JSON.stringify({ uploadUrl, publicUrl }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("[get-r2-upload-url] Erro fatal:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})