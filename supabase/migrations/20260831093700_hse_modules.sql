-- Enums
CREATE TYPE tipo_permiso_enum AS ENUM ('ALTURAS', 'CONFINADO', 'CALIENTE', 'IZAJE', 'ELECTRICO', 'OTRO');
CREATE TYPE estado_permiso_enum AS ENUM ('BORRADOR', 'SOLICITADO', 'APROBADO', 'CERRADO');
CREATE TYPE tipo_evento_enum AS ENUM ('INCIDENTE', 'ACCIDENTE');
CREATE TYPE severidad_enum AS ENUM ('BAJA', 'MEDIA', 'ALTA', 'FATALIDAD');
CREATE TYPE tipo_novedad_enum AS ENUM ('CLIMA', 'EQUIPO', 'INSPECCION', 'OTRO');

-- Permisos de Trabajo
CREATE TABLE permisos_trabajo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE,
  tipo tipo_permiso_enum NOT NULL,
  solicitante_nombre TEXT,
  fecha_inicio TIMESTAMPTZ,
  fecha_fin TIMESTAMPTZ,
  estado estado_permiso_enum DEFAULT 'BORRADOR',
  documento_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Incidentes y Accidentes (Eventos HSE)
CREATE TABLE hse_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_evento tipo_evento_enum NOT NULL,
  severidad severidad_enum,
  fecha_evento TIMESTAMPTZ,
  lugar_exacto TEXT,
  descripcion TEXT,
  estado_investigacion TEXT DEFAULT 'ABIERTA',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Novedades (Clasificadas por contratista/empresa)
CREATE TABLE novedades_diarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL,
  empresa TEXT NOT NULL, -- Para clasificar por contratista
  tipo_novedad tipo_novedad_enum NOT NULL,
  descripcion TEXT,
  reportado_por TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inasistencias
CREATE TABLE inasistencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trabajador_id UUID REFERENCES trabajadores(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  motivo TEXT,
  es_justificada BOOLEAN DEFAULT false,
  soporte_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configuración de Sistema (Para el límite horario de inasistencias)
CREATE TABLE configuracion_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clave TEXT UNIQUE NOT NULL,
  valor TEXT NOT NULL,
  descripcion TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar configuración por defecto (Hora máxima para marcar ausencia)
INSERT INTO configuracion_sistema (clave, valor, descripcion) 
VALUES ('HORA_LIMITE_INASISTENCIA', '08:00', 'Hora límite de ingreso antes de marcar inasistencia automática')
ON CONFLICT (clave) DO NOTHING;

-- RLS
ALTER TABLE permisos_trabajo ENABLE ROW LEVEL SECURITY;
ALTER TABLE hse_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE novedades_diarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE inasistencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_sistema ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo a autenticados pt" ON permisos_trabajo FOR ALL USING (true);
CREATE POLICY "Permitir todo a autenticados he" ON hse_eventos FOR ALL USING (true);
CREATE POLICY "Permitir todo a autenticados nd" ON novedades_diarias FOR ALL USING (true);
CREATE POLICY "Permitir todo a autenticados ina" ON inasistencias FOR ALL USING (true);
CREATE POLICY "Permitir todo a autenticados cfg" ON configuracion_sistema FOR ALL USING (true);
