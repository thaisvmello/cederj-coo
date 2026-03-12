import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { S3Client, PutObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.454.0"
import { getSignedUrl } from "https://esm.sh/@aws-sdk/s3-request-presigner@3.454.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Log inicial para depuração
  console.log("[get-r2-upload-url] Requisição recebida:", req.method);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // 1. Validar Autenticação
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: corsHeaders })
    }

    // 2. Validar Body
    const { fileName, fileType, folderId } = await req.json();

    if (!fileName || !fileType || !folderId) {
      return new Response(JSON.stringify({ error: 'Dados incompletos' }), { status: 400, headers: corsHeaders });
    }

    // 3. Obter Secrets
    const endpoint = Deno.env.get("R2_ENDPOINT");
    const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
    const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY");
    const bucketName = Deno.env.get("R2_BUCKET_NAME");
    const publicDomain = Deno.env.get("R2_PUBLIC_DOMAIN");

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName || !publicDomain) {
      console.error("[get-r2-upload-url] Erro: Secrets não configurados corretamente");
      return new Response(JSON.stringify({ error: 'Configuração do servidor incompleta' }), { status: 500, headers: corsHeaders });
    }

    // 4. Configurar Cliente S3 (R2)
    // Forçamos as credenciais e a região para evitar que o SDK tente ler arquivos locais
    const r2Client = new S3Client({
      region: "auto",
      endpoint: endpoint,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
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
    // O tempo de expiração é de 1 hora (3600 segundos)
    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 })
    const publicUrl = `${publicDomain.replace(/\/$/, '')}/${key}`

    console.log("[get-r2-upload-url] URL gerada com sucesso para:", key);

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