-- Custom ENUM types
CREATE TYPE tipo_reporte_enum AS ENUM ('PERSONAL_FALTANTE', 'HSE_ESTADO', 'AFORO');
CREATE TYPE frecuencia_enum AS ENUM ('DIARIO', 'SEMANAL', 'MENSUAL');

-- Dependencias (Tablas Padre)
CREATE TABLE proyectos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  estado TEXT DEFAULT 'ACTIVO',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE trabajadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  empresa TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tablas principales según especificación técnica
CREATE TABLE programacion_turnos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trabajador_id UUID NOT NULL REFERENCES trabajadores(id) ON DELETE CASCADE,
  proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  fecha_esperada DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE reportes_programados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_reporte tipo_reporte_enum NOT NULL,
  frecuencia frecuencia_enum NOT NULL,
  destinatarios TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security) para Supabase
ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE trabajadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE programacion_turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportes_programados ENABLE ROW LEVEL SECURITY;

-- Políticas temporales (Permitir todo para desarrollo)
CREATE POLICY "Permitir todo a usuarios autenticados" ON proyectos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir todo a usuarios autenticados" ON trabajadores FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir todo a usuarios autenticados" ON programacion_turnos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir todo a usuarios autenticados" ON reportes_programados FOR ALL USING (auth.role() = 'authenticated');
