import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { S3Client, PutObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.454.0"
import { getSignedUrl } from "https://esm.sh/@aws-sdk/s3-request-presigner@3.454.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { fileName, fileType, folderId } = await req.json()
    
    const r2Client = new S3Client({
      region: "auto",
      endpoint: Deno.env.get("R2_ENDPOINT") || "",
      credentials: {
        accessKeyId: Deno.env.get("R2_ACCESS_KEY_ID") || "",
        secretAccessKey: Deno.env.get("R2_SECRET_ACCESS_KEY") || "",
      },
    })

    const key = `materials/${folderId}/${Date.now()}-${fileName}`
    const command = new PutObjectCommand({
      Bucket: Deno.env.get("R2_BUCKET_NAME"),
      Key: key,
      ContentType: fileType,
    })

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 })
    const publicUrl = `${Deno.env.get("R2_PUBLIC_DOMAIN")}/${key}`

    return new Response(
      JSON.stringify({ uploadUrl, publicUrl, key }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})