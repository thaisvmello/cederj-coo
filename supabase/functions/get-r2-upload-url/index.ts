import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { S3Client, PutObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.454.0?target=deno&no-check"
import { getSignedUrl } from "https://esm.sh/@aws-sdk/s3-request-presigner@3.454.0?target=deno&no-check"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log("[get-r2-upload-url] Processando requisição...");

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Verificação manual de autenticação
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    console.error("[get-r2-upload-url] Não autorizado: Cabeçalho ausente");
    return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: corsHeaders })
  }

  try {
    const { fileName, fileType, folderId } = await req.json()
    
    const endpoint = Deno.env.get("R2_ENDPOINT");
    const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
    const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY");
    const bucketName = Deno.env.get("R2_BUCKET_NAME");
    const publicDomain = Deno.env.get("R2_PUBLIC_DOMAIN");

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName) {
      throw new Error("Configurações do R2 ausentes no Supabase (Secrets).");
    }

    const r2Client = new S3Client({
      region: "auto",
      endpoint: endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    })

    const key = `materials/${folderId}/${Date.now()}-${fileName}`
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: fileType,
    })

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 })
    const publicUrl = `${publicDomain}/${key}`

    console.log("[get-r2-upload-url] URL gerada com sucesso para:", key);

    return new Response(
      JSON.stringify({ uploadUrl, publicUrl, key }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error("[get-r2-upload-url] Erro:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})