import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { S3Client, PutObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.454.0"
import { getSignedUrl } from "https://esm.sh/@aws-sdk/s3-request-presigner@3.454.0"

// Correção para o erro "The path argument must be of type string"
// O SDK da AWS tenta ler a pasta HOME para buscar configurações.
if (!Deno.env.get("HOME")) {
  Deno.env.set("HOME", "/tmp");
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: corsHeaders })
    }

    const { fileName, fileType, folderId } = await req.json();

    const endpoint = Deno.env.get("R2_ENDPOINT");
    const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
    const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY");
    const bucketName = Deno.env.get("R2_BUCKET_NAME");
    const publicDomain = Deno.env.get("R2_PUBLIC_DOMAIN");

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName || !publicDomain) {
      throw new Error('Secrets do R2 não configurados no Supabase');
    }

    // Criando o cliente com configurações que evitam buscas no sistema de arquivos
    const r2Client = new S3Client({
      region: "auto",
      endpoint: endpoint,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
      forcePathStyle: true,
    });

    const fileExtension = fileName.split('.').pop();
    const safeFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExtension}`;
    const key = `materials/${folderId}/${safeFileName}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: fileType,
    });

    // Gera a URL para o upload (expira em 1 hora)
    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
    
    // URL final para salvar no banco de dados
    const publicUrl = `${publicDomain.replace(/\/$/, '')}/${key}`;

    console.log(`[get-r2-upload-url] URL gerada com sucesso para: ${fileName}`);

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