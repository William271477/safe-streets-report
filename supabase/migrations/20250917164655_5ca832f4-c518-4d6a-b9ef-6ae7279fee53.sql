-- Create storage bucket for incident images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('incident-images', 'incident-images', true);

-- Create policies for incident image uploads
CREATE POLICY "Users can view incident images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'incident-images');

CREATE POLICY "Users can upload incident images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'incident-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own incident images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'incident-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own incident images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'incident-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add image_url column to incidents table
ALTER TABLE public.incidents 
ADD COLUMN image_url TEXT;