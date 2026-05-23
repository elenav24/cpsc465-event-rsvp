# ── Terraform state lock table ────────────────────────────────────────────────
# The tfstate S3 bucket is created manually (see main.tf backend config).
# This DynamoDB table provides state locking.

# NOTE: Flyer storage has been migrated to Cloudflare R2.
# The old aws_s3_bucket.flyers resource has been removed.
# Set R2_BUCKET, R2_ENDPOINT_URL, R2_PUBLIC_URL, and R2 credentials
# as Lambda environment variables / GitHub Actions secrets.

# NOTE: Frontend hosting has been migrated to Vercel.
# The old aws_s3_bucket.frontend and CloudFront distribution have been
# removed. See frontend/vercel.json and the deploy-frontend job in
# .github/workflows/deploy.yml.
