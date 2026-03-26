-- Create card-pdfs storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('card-pdfs', 'card-pdfs', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload PDFs
CREATE POLICY "Authenticated users can upload PDFs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'card-pdfs');

-- Allow users to read their own PDFs (path starts with pdfs/)
CREATE POLICY "Users can read own PDFs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'card-pdfs');

-- Allow service role full access (for admin/API routes)
CREATE POLICY "Service role full access to card-pdfs"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'card-pdfs');
