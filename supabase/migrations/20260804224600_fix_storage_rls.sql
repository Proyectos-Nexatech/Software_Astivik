-- Drop previous policies that required authenticated users
DROP POLICY IF EXISTS "Autenticados pueden leer archivos HSE" ON storage.objects;
DROP POLICY IF EXISTS "Autenticados pueden subir archivos HSE" ON storage.objects;
DROP POLICY IF EXISTS "Autenticados pueden actualizar archivos HSE" ON storage.objects;

-- Create new policies allowing public/anon access for the prototype
CREATE POLICY "Public puede leer archivos HSE" ON storage.objects FOR SELECT USING (bucket_id = 'hse_docs');
CREATE POLICY "Public puede subir archivos HSE" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'hse_docs');
CREATE POLICY "Public puede actualizar archivos HSE" ON storage.objects FOR UPDATE USING (bucket_id = 'hse_docs');
CREATE POLICY "Public puede eliminar archivos HSE" ON storage.objects FOR DELETE USING (bucket_id = 'hse_docs');

-- Also relax RLS on documentos_hse table just in case
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON documentos_hse;
CREATE POLICY "Permitir todo a anonimos y autenticados" ON documentos_hse FOR ALL USING (true);
