import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { S3Client } from "https://deno.land/x/s3_lite_client@0.7.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Lidar com preflight do CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log("[get-r2-upload-url] Requisição recebida");

    // 1. Validar Autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // 2. Extrair dados do corpo
    const { fileName, fileType, folderId } = await req.json();
    if (!fileName || !folderId) {
      throw new Error("Dados insuficientes: fileName e folderId são obrigatórios.");
    }

    // 3. Carregar Configurações (Secrets)
    const endpoint = Deno.env.get("R2_ENDPOINT");
    const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
    const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY");
    const bucketName = Deno.env.get("R2_BUCKET_NAME");
    const publicDomain = Deno.env.get("R2_PUBLIC_DOMAIN");

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName || !publicDomain) {
      console.error("[get-r2-upload-url] Erro: Variáveis de ambiente ausentes");
      throw new Error("Configuração do R2 incompleta no servidor.");
    }

    // 4. Configurar Cliente S3 (Otimizado para R2 no Deno)
    const s3Client = new S3Client({
      endPoint: endpoint.replace(/^https?:\/\//, ''), // Remove protocolo se existir
      accessKey: accessKeyId,
      secretKey: secretAccessKey,
      region: "auto",
      useSSL: true,
      pathStyle: true, // Essencial para R2
    });

    // 5. Gerar Caminho do Arquivo
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = fileName.split('.').pop();
    const key = `materials/${folderId}/${timestamp}-${randomStr}.${extension}`;

    // 6. Gerar URL Assinada (PUT)
    console.log(`[get-r2-upload-url] Gerando URL para: ${key}`);
    const uploadUrl = await s3Client.getPresignedUrl("PUT", key, {
      bucketName: bucketName,
      expirySeconds: 3600,
    });

    // 7. Construir URL Pública
    const publicUrl = `${publicDomain.replace(/\/$/, '')}/${key}`;

    return new Response(
      JSON.stringify({ uploadUrl, publicUrl }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error(`[get-r2-upload-url] Erro: ${error.message}`);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});