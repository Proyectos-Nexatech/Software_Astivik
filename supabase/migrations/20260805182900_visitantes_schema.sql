CREATE TABLE visitantes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  documento TEXT NOT NULL,
  nombre TEXT NOT NULL,
  empresa_origen TEXT,
  motivo_visita TEXT,
  fecha_inicio TIMESTAMPTZ NOT NULL,
  fecha_fin TIMESTAMPTZ NOT NULL,
  creado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE visitantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso total visitantes para autenticados" ON visitantes FOR ALL TO authenticated USING (true) WITH CHECK (true);

