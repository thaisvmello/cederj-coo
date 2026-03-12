export CLOUDFLARE_ACCOUNT_ID=35d6dd493dab232d970d07fbb9ec554a
export R2_BUCKET=coo-cederj
export CLOUDFLARE_API_TOKEN=JndFMsfrE1ofj1QUZMhSMcUNWIuQnouXW4xECLLi

# Exemplo de comando S3
aws s3 ls s3://$R2_BUCKET \
  --endpoint-url=https://$CLOUDFLARE_ACCOUNT_ID.r2.cloudflarestorage.com \
  --profile cloudflare-r2
