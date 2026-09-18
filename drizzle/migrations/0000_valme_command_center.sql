-- Clientes
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  sector text NOT NULL DEFAULT 'General',
  estado text NOT NULL DEFAULT 'onboarding',
  progreso integer NOT NULL DEFAULT 0,
  objetivo text,
  especialidades integer NOT NULL DEFAULT 8,
  sla_vence timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Equipo puede leer clientes" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Equipo puede crear clientes" ON public.clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Equipo puede actualizar clientes" ON public.clients FOR UPDATE TO authenticated USING (true);

-- Agentes
CREATE TABLE public.agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  especialidad text NOT NULL,
  carga integer NOT NULL DEFAULT 0,
  disponibilidad text NOT NULL DEFAULT 'disponible',
  calidad integer NOT NULL DEFAULT 0,
  errores integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agents TO authenticated;
GRANT ALL ON public.agents TO service_role;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Equipo puede leer agentes" ON public.agents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Equipo puede actualizar agentes" ON public.agents FOR UPDATE TO authenticated USING (true);

-- Cola de supervision
CREATE TABLE public.approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  accion text NOT NULL,
  tipo text NOT NULL DEFAULT 'contenido',
  estado text NOT NULL DEFAULT 'propuesto_ia',
  prioridad text NOT NULL DEFAULT 'normal',
  confianza integer NOT NULL DEFAULT 0,
  evidencia text,
  impacto text,
  sla_vence timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.approvals TO authenticated;
GRANT ALL ON public.approvals TO service_role;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Equipo puede leer aprobaciones" ON public.approvals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Equipo puede crear aprobaciones" ON public.approvals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Equipo puede actualizar aprobaciones" ON public.approvals FOR UPDATE TO authenticated USING (true);

-- Registro de decisiones
CREATE TABLE public.decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_id uuid NOT NULL REFERENCES public.approvals(id) ON DELETE CASCADE,
  decision text NOT NULL,
  motivo text,
  decidido_por uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.decisions TO authenticated;
GRANT ALL ON public.decisions TO service_role;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Equipo puede leer decisiones" ON public.decisions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Equipo puede registrar decisiones" ON public.decisions FOR INSERT TO authenticated WITH CHECK (true);

-- Actividad automatizada
CREATE TABLE public.activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  descripcion text NOT NULL,
  resultado text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.activity TO authenticated;
GRANT ALL ON public.activity TO service_role;
ALTER TABLE public.activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Equipo puede leer actividad" ON public.activity FOR SELECT TO authenticated USING (true);
CREATE POLICY "Equipo puede registrar actividad" ON public.activity FOR INSERT TO authenticated WITH CHECK (true);

-- Agentes de demostracion (8 especialidades)
INSERT INTO public.agents (nombre, especialidad, carga, disponibilidad, calidad, errores) VALUES
  ('Agente Técnico', 'SEO técnico', 78, 'saturado', 92, 3),
  ('Agente Contenido', 'Contenido', 64, 'disponible', 88, 1),
  ('Agente Enlaces', 'Autoridad y enlaces', 52, 'disponible', 81, 2),
  ('Agente Local', 'SEO local', 41, 'disponible', 90, 0),
  ('Agente AEO', 'Respuestas AEO', 83, 'saturado', 86, 4),
  ('Agente GEO', 'Visibilidad GEO', 57, 'disponible', 79, 2),
  ('Agente Analítica', 'Analítica', 35, 'disponible', 94, 0),
  ('Agente Informes', 'Informes', 46, 'disponible', 91, 1);

-- Clientes destacados de demostracion
INSERT INTO public.clients (nombre, sector, estado, progreso, objetivo, sla_vence) VALUES
  ('Clínica Arenal', 'Salud', 'bloqueado', 38, 'Captación local en Valencia', now() - interval '6 hours'),
  ('Ferretería Sanz', 'Retail', 'revision', 61, 'Ficha de producto y AEO', now() + interval '9 hours'),
  ('Bufete Oliva', 'Legal', 'revision', 54, 'Autoridad temática', now() + interval '20 hours'),
  ('Hotel Marfil', 'Turismo', 'piloto_automatico', 72, 'Reservas directas', now() + interval '2 days'),
  ('Academia Nodo', 'Formación', 'onboarding', 12, 'Alta y auditoría inicial', now() + interval '3 days'),
  ('Taller Beltrán', 'Automoción', 'bloqueado', 27, 'Accesos pendientes', now() - interval '2 hours');

-- Cartera restante hasta 84 clientes (datos ficticios)
INSERT INTO public.clients (nombre, sector, estado, progreso, objetivo, sla_vence)
SELECT
  'Cliente demo ' || g,
  (ARRAY['Retail','Salud','Legal','Turismo','Industria','Servicios'])[1 + (g % 6)],
  CASE WHEN g <= 58 THEN 'piloto_automatico' WHEN g <= 68 THEN 'revision' WHEN g <= 72 THEN 'bloqueado' ELSE 'onboarding' END,
  20 + (g % 70),
  'Objetivo de demostración',
  now() + ((g % 10) || ' hours')::interval
FROM generate_series(1, 78) AS g;

-- Cola de supervision de demostracion
INSERT INTO public.approvals (client_id, agent_id, accion, tipo, estado, prioridad, confianza, evidencia, impacto, sla_vence)
SELECT c.id, a.id, v.accion, v.tipo, v.estado, v.prioridad, v.confianza, v.evidencia, v.impacto, v.sla
FROM (VALUES
  ('Clínica Arenal', 'Agente Técnico', 'Corregir indexación de 38 páginas', 'tecnico', 'bloqueado', 'critica', 72, 'Informe de rastreo con 38 URLs excluidas.', 'Riesgo de pérdida de visibilidad en servicios principales.', now() - interval '5 hours'),
  ('Ferretería Sanz', 'Agente Contenido', 'Publicar 6 fichas de producto reescritas', 'contenido', 'propuesto_ia', 'alta', 88, 'Borradores con criterios de aceptación cumplidos.', 'Mejora esperada de conversión en catálogo.', now() + interval '8 hours'),
  ('Bufete Oliva', 'Agente AEO', 'Añadir bloque de respuestas a 12 consultas', 'aeo', 'propuesto_ia', 'alta', 81, 'Consultas extraídas de búsquedas reales del sector.', 'Posible aparición en respuestas directas.', now() + interval '18 hours'),
  ('Hotel Marfil', 'Agente Informes', 'Autorizar envío del informe mensual', 'informe', 'en_revision', 'normal', 90, 'Informe validado con datos de septiembre.', 'Comunicación al cliente pendiente de autorización.', now() + interval '1 day'),
  ('Taller Beltrán', 'Agente Local', 'Solicitar accesos a la ficha local', 'acceso', 'bloqueado', 'critica', 64, 'Dos solicitudes de acceso sin respuesta.', 'Bloqueo de todo el trabajo local.', now() - interval '1 hour'),
  ('Academia Nodo', 'Agente Analítica', 'Validar medición de formularios', 'analitica', 'propuesto_ia', 'normal', 76, 'Eventos duplicados detectados en la última semana.', 'Datos de captación poco fiables.', now() + interval '2 days'),
  ('Hotel Marfil', 'Agente GEO', 'Ampliar cobertura GEO a 4 ciudades', 'geo', 'propuesto_ia', 'normal', 69, 'Demanda estimada en ciudades limítrofes.', 'Alcance nuevo sin coste de medios.', now() + interval '3 days'),
  ('Bufete Oliva', 'Agente Enlaces', 'Aprobar plan de autoridad temática', 'enlaces', 'en_revision', 'alta', 74, 'Selección de 9 medios especializados.', 'Autoridad en materia de compliance.', now() + interval '14 hours')
) AS v(cliente, agente, accion, tipo, estado, prioridad, confianza, evidencia, impacto, sla)
JOIN public.clients c ON c.nombre = v.cliente
JOIN public.agents a ON a.nombre = v.agente;

-- Actividad reciente de demostracion
INSERT INTO public.activity (client_id, agent_id, descripcion, resultado)
SELECT c.id, a.id, v.descripcion, v.resultado
FROM (VALUES
  ('Hotel Marfil', 'Agente Analítica', 'Auditoría de medición completada', 'Sin incidencias'),
  ('Ferretería Sanz', 'Agente Contenido', '6 borradores preparados para revisión', 'Pendiente de decisión'),
  ('Clínica Arenal', 'Agente Técnico', 'Rastreo técnico ejecutado', '38 URLs con problemas'),
  ('Bufete Oliva', 'Agente AEO', 'Investigación de consultas finalizada', '12 oportunidades'),
  ('Academia Nodo', 'Agente Informes', 'Ficha de onboarding generada', 'Falta documentación'),
  ('Taller Beltrán', 'Agente Local', 'Verificación de ficha local', 'Sin acceso')
) AS v(cliente, agente, descripcion, resultado)
JOIN public.clients c ON c.nombre = v.cliente
JOIN public.agents a ON a.nombre = v.agente;