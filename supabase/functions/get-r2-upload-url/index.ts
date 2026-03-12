import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { S3Client, PutObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.454.0?target=deno&no-check"
import { getSignedUrl } from "https://esm.sh/@aws-sdk/s3-request-presigner@3.454.0?target=deno&no-check"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log("[get-r2-upload-url] Nova requisição recebida");

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // 1. Validar Autenticação
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error("[get-r2-upload-url] Erro: Cabeçalho de autorização ausente");
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: corsHeaders })
    }

    // 2. Validar Body
    const body = await req.json();
    const { fileName, fileType, folderId } = body;

    if (!fileName || !fileType || !folderId) {
      console.error("[get-r2-upload-url] Erro: Dados incompletos no body", body);
      return new Response(JSON.stringify({ error: 'fileName, fileType e folderId são obrigatórios' }), { status: 400, headers: corsHeaders });
    }

    // 3. Obter Secrets
    const endpoint = Deno.env.get("R2_ENDPOINT");
    const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
    const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY");
    const bucketName = Deno.env.get("R2_BUCKET_NAME");
    const publicDomain = Deno.env.get("R2_PUBLIC_DOMAIN");

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName || !publicDomain) {
      console.error("[get-r2-upload-url] Erro: Configurações do R2 incompletas nos Secrets");
      return new Response(JSON.stringify({ error: 'Configuração do servidor incompleta (Secrets)' }), { status: 500, headers: corsHeaders });
    }

    // 4. Configurar Cliente S3 (R2)
    // Usamos region "auto" para R2, mas forçamos as credenciais para evitar buscas no sistema de arquivos
    const r2Client = new S3Client({
      region: "auto",
      endpoint: endpoint,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
      // Importante para evitar o erro de "path" no Deno
      forcePathStyle: true,
    })

    const fileExtension = fileName.split('.').pop();
    const safeFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExtension}`;
    const key = `materials/${folderId}/${safeFileName}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: fileType,
    })

    // 5. Gerar URL assinada
    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 })
    const publicUrl = `${publicDomain.replace(/\/$/, '')}/${key}`

    console.log("[get-r2-upload-url] Sucesso! Key:", key);

    return new Response(
      JSON.stringify({ uploadUrl, publicUrl, key }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error("[get-r2-upload-url] Erro crítico:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})