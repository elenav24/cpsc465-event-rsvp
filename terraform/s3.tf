resource "aws_s3_bucket" "flyers" {
  bucket = "event-rsvp-flyers"
}

resource "aws_s3_bucket_public_access_block" "flyers" {
  bucket = aws_s3_bucket.flyers.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Allow public read on flyer objects
resource "aws_s3_bucket_policy" "flyers_public_read" {
  bucket     = aws_s3_bucket.flyers.id
  depends_on = [aws_s3_bucket_public_access_block.flyers]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "PublicReadGetObject"
      Effect    = "Allow"
      Principal = "*"
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.flyers.arn}/*"
    }]
  })
}

resource "aws_s3_bucket_cors_configuration" "flyers" {
  bucket = aws_s3_bucket.flyers.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = ["*"]
    max_age_seconds = 3000
  }
}
