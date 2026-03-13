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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const contentType = req.headers.get('content-type') || '';
    
    // Configurações R2
    const endpoint = Deno.env.get("R2_ENDPOINT");
    const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
    const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY");
    const bucketName = Deno.env.get("R2_BUCKET_NAME");
    const publicDomain = Deno.env.get("R2_PUBLIC_DOMAIN");

    const s3Client = new S3Client({
      endPoint: endpoint!.replace(/^https?:\/\//, ''),
      accessKey: accessKeyId!,
      secretKey: secretAccessKey!,
      region: "auto",
      useSSL: true,
      pathStyle: true,
    });

    // Se for multipart/form-data, fazer upload direto via proxy
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const folderId = formData.get('folderId') as string;
      
      if (!file || !folderId) {
        return new Response(JSON.stringify({ error: 'Arquivo ou folderId não fornecido' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      const timestamp = Date.now();
      const extension = file.name.split('.').pop();
      const key = `materials/${folderId}/${timestamp}.${extension}`;

      // Upload direto para R2 via servidor
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      await s3Client.putObject({
        bucketName: bucketName!,
        objectName: key,
        body: uint8Array,
        contentType: file.type || 'application/octet-stream',
      });

      const publicUrl = `${publicDomain!.replace(/\/$/, '')}/${key}`;

      return new Response(
        JSON.stringify({ 
          success: true,
          publicUrl,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Caso contrário, gerar URL pré-assinada (comportamento original)
    const { fileName, folderId } = await req.json();
    
    const timestamp = Date.now();
    const extension = fileName.split('.').pop();
    const key = `materials/${folderId}/${timestamp}.${extension}`;

    const uploadUrl = await s3Client.getPresignedUrl("PUT", key, {
      bucketName: bucketName!,
      expirySeconds: 3600,
    });

    const publicUrl = `${publicDomain!.replace(/\/$/, '')}/${key}`;

    return new Response(
      JSON.stringify({ uploadUrl, publicUrl }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Edge Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});