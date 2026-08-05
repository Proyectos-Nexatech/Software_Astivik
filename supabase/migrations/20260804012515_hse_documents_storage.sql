-- Create Enum for Doc Types
CREATE TYPE tipo_documento_enum AS ENUM ('ss', 'examen', 'alturas', 'confinados', 'soldadura');

-- Create Documentos HSE Table
CREATE TABLE documentos_hse (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trabajador_id UUID NOT NULL REFERENCES trabajadores(id) ON DELETE CASCADE,
  tipo_documento tipo_documento_enum NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  archivo_url TEXT NOT NULL,
  estado TEXT DEFAULT 'Vigente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trabajador_id, tipo_documento)
);

ALTER TABLE documentos_hse ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo a usuarios autenticados" ON documentos_hse FOR ALL USING (auth.role() = 'authenticated');

-- Create Storage Bucket for HSE Docs (Insert only if it does not exist)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('hse_docs', 'hse_docs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Autenticados pueden leer archivos HSE" ON storage.objects FOR SELECT USING (bucket_id = 'hse_docs' AND auth.role() = 'authenticated');
CREATE POLICY "Autenticados pueden subir archivos HSE" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'hse_docs' AND auth.role() = 'authenticated');
CREATE POLICY "Autenticados pueden actualizar archivos HSE" ON storage.objects FOR UPDATE USING (bucket_id = 'hse_docs' AND auth.role() = 'authenticated');
