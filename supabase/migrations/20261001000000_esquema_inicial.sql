-- =============================================================================
-- Valme · esquema inicial
--
-- Tres bloques:
--   1. Equipo y acceso: members + memberships y las funciones que usa RLS.
--   2. Cuentas (todo con client_id): clientes, Brand Kit, ofertas, creatividades,
--      campañas, landings, leads, integraciones y la contabilidad de IA (ai_jobs).
--   3. Agentes y diagnóstico: agent_runs/agent_steps, la cola pgmq y las auditorías.
--
-- Reglas que este fichero hace ciertas:
--   - Ninguna tabla sin RLS. anon no ve nada.
--   - Un miembro sólo ve los clientes de sus memberships (admin: todos).
--   - ai_jobs, agent_steps y las auditorías sólo los escribe el service_role (el worker
--     y el servidor). Desde el navegador se leen, nunca se escriben.
--   - La cola sólo se toca con funciones que únicamente puede ejecutar service_role,
--     salvo create_agent_run, que comprueba el acceso al cliente antes de encolar.
-- =============================================================================

create extension if not exists pgmq;

-- -----------------------------------------------------------------------------
-- 1. Equipo y acceso
-- -----------------------------------------------------------------------------

create table public.members (
  id            uuid primary key default gen_random_uuid(),
  -- Se rellena cuando el miembro entra por primera vez con Supabase Auth. Hasta
  -- entonces el login de la web es el falso (cookie + contraseña compartida).
  auth_user_id  uuid unique references auth.users (id) on delete set null,
  email         text not null unique check (email = lower(email)),
  name          text not null,
  role          text not null check (role in ('admin', 'strategist', 'operator')),
  created_at    timestamptz not null default now()
);

create table public.clients (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name         text not null,
  website_url  text,
  status       text not null default 'onboarding'
               check (status in ('onboarding', 'active', 'paused')),
  created_at   timestamptz not null default now()
);

create table public.memberships (
  member_id  uuid not null references public.members (id) on delete cascade,
  client_id  uuid not null references public.clients (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (member_id, client_id)
);

create index memberships_client_idx on public.memberships (client_id);

-- El miembro de la sesión actual. security definer para que RLS de members no lo
-- bloquee a sí mismo; search_path fijado para que nadie lo secuestre.
create function public.current_member_id()
returns uuid
language sql stable security definer
set search_path = ''
as $$
  select m.id from public.members m where m.auth_user_id = auth.uid()
$$;

create function public.is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.members m
    where m.auth_user_id = auth.uid() and m.role = 'admin'
  )
$$;

-- LA comprobación. La usan todas las políticas de las tablas con client_id.
create function public.has_client_access(p_client_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.members m
    where m.auth_user_id = auth.uid()
      and (
        m.role = 'admin'
        or exists (
          select 1 from public.memberships ms
          where ms.member_id = m.id and ms.client_id = p_client_id
        )
      )
  )
$$;

alter table public.members     enable row level security;
alter table public.clients     enable row level security;
alter table public.memberships enable row level security;

-- Cualquier miembro ve al resto del equipo (para asignar, firmar aprobaciones…).
create policy members_select on public.members
  for select to authenticated
  using (public.current_member_id() is not null);

create policy members_admin_write on public.members
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy clients_select on public.clients
  for select to authenticated
  using (public.has_client_access(id));

create policy clients_admin_write on public.clients
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy memberships_select on public.memberships
  for select to authenticated
  using (member_id = public.current_member_id() or public.is_admin());

create policy memberships_admin_write on public.memberships
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- 2. Cuentas
-- -----------------------------------------------------------------------------

create table public.brand_kits (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null unique references public.clients (id) on delete cascade,
  status       text not null default 'draft'
               check (status in ('draft', 'extracting', 'extracted', 'approved')),
  version      integer not null default 1,
  identity     jsonb not null default '{}',
  voice        jsonb not null default '{}',
  business     jsonb not null default '{}',
  personas     jsonb not null default '[]',
  legal        jsonb not null default '{}',
  origins      jsonb not null default '{}',
  approved_at  timestamptz,
  approved_by  uuid references public.members (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Una fila por aprobación: el kit que había cuando se aprobó, para poder auditarlo.
create table public.brand_kit_versions (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.clients (id) on delete cascade,
  brand_kit_id  uuid not null references public.brand_kits (id) on delete cascade,
  version       integer not null,
  snapshot      jsonb not null,
  approved_by   uuid references public.members (id) on delete set null,
  created_at    timestamptz not null default now(),
  unique (brand_kit_id, version)
);

create table public.offers (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references public.clients (id) on delete cascade,
  brand_kit_id   uuid not null references public.brand_kits (id),
  name           text not null,
  what           text not null,
  hook           text,
  persona_index  integer,
  cta            text not null check (cta in
                 ('LEARN_MORE', 'SIGN_UP', 'GET_QUOTE', 'CONTACT_US', 'BOOK_NOW', 'DOWNLOAD')),
  ends_at        timestamptz,
  created_at     timestamptz not null default now()
);

create index offers_client_idx on public.offers (client_id);

-- ai_jobs va antes que assets: un asset generado apunta al job que lo produjo.
create table public.ai_jobs (
  id                 uuid primary key default gen_random_uuid(),
  client_id          uuid not null references public.clients (id) on delete cascade,
  kind               text not null,
  provider           text not null check (provider in
                     ('anthropic', 'higgsfield', 'firecrawl', 'meta', 'resend')),
  model              text,
  status             text not null default 'running'
                     check (status in ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  input              jsonb,
  output             jsonb,
  external_id        text,
  input_tokens       integer,
  output_tokens      integer,
  cache_read_tokens  integer,
  cache_write_tokens integer,
  cost_usd           numeric(12, 6),
  error              text,
  created_at         timestamptz not null default now(),
  finished_at        timestamptz
);

create index ai_jobs_client_created_idx on public.ai_jobs (client_id, created_at desc);
-- El webhook de Higgsfield deduplica por request_id.
create unique index ai_jobs_external_idx on public.ai_jobs (provider, external_id)
  where external_id is not null;

create table public.assets (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid not null references public.clients (id) on delete cascade,
  parent_asset_id  uuid references public.assets (id) on delete set null,
  kind             text not null check (kind in ('logo', 'client_photo', 'generated', 'overlay')),
  format           text check (format in ('3:4', '4:5', '1:1', '9:16')),
  storage_path     text not null,
  width            integer,
  height           integer,
  origin           text not null check (origin in ('upload', 'firecrawl', 'higgsfield')),
  ai_job_id        uuid references public.ai_jobs (id) on delete set null,
  created_at       timestamptz not null default now()
);

create index assets_client_idx on public.assets (client_id);

create table public.ad_creatives (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid not null references public.clients (id) on delete cascade,
  offer_id         uuid not null references public.offers (id) on delete cascade,
  angle            text not null check (angle in
                   ('pain', 'benefit', 'social_proof', 'urgency', 'objection')),
  variant          integer not null,
  primary_text     text not null,
  headline         text not null,
  description      text not null,
  cta              text not null,
  master_asset_id  uuid references public.assets (id) on delete set null,
  status           text not null default 'generated' check (status in
                   ('generating', 'generated', 'reviewed', 'approved', 'discarded')),
  meta_ad_id       text,
  created_at       timestamptz not null default now()
);

create index ad_creatives_offer_idx on public.ad_creatives (client_id, offer_id);

create table public.campaigns (
  id                  uuid primary key default gen_random_uuid(),
  client_id           uuid not null references public.clients (id) on delete cascade,
  offer_id            uuid not null references public.offers (id) on delete cascade,
  objective           text not null check (objective in ('OUTCOME_LEADS', 'OUTCOME_TRAFFIC')),
  daily_budget_cents  integer not null check (daily_budget_cents > 0),
  geo                 text not null,
  age_min             integer not null,
  age_max             integer not null,
  meta_campaign_id    text,
  meta_adset_id       text,
  status              text not null default 'draft'
                      check (status in ('draft', 'creating', 'created_paused', 'failed')),
  error               text,
  created_at          timestamptz not null default now()
);

create index campaigns_offer_idx on public.campaigns (client_id, offer_id);

create table public.landings (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid not null references public.clients (id) on delete cascade,
  offer_id          uuid not null references public.offers (id) on delete cascade,
  slug              text not null,
  blocks            jsonb not null default '[]',
  published_blocks  jsonb,
  form_fields       jsonb not null default '[]',
  email_template    jsonb,
  status            text not null default 'draft' check (status in ('draft', 'published')),
  published_at      timestamptz,
  created_at        timestamptz not null default now(),
  unique (client_id, slug)
);

create table public.leads (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.clients (id) on delete cascade,
  landing_id      uuid references public.landings (id) on delete set null,
  ad_creative_id  uuid references public.ad_creatives (id) on delete set null,
  name            text,
  email           text,
  phone           text,
  answers         jsonb not null default '{}',
  utm             jsonb not null default '{}',
  fbclid          text,
  consent         boolean not null default false,
  consent_text    text,
  -- El mismo event_id va al píxel y a la Conversions API: es la deduplicación de Meta.
  event_id        text not null,
  email_status    text not null default 'queued' check (email_status in
                  ('queued', 'sent', 'delivered', 'bounced', 'complained', 'failed')),
  created_at      timestamptz not null default now(),
  unique (client_id, event_id)
);

create index leads_client_created_idx on public.leads (client_id, created_at desc);

create table public.integrations (
  client_id   uuid not null references public.clients (id) on delete cascade,
  provider    text not null check (provider in ('meta', 'resend')),
  connected   boolean not null default false,
  -- Identificadores públicos (cuenta publicitaria, píxel…). Los secretos NO van aquí.
  meta        jsonb not null default '{}',
  updated_at  timestamptz not null default now(),
  primary key (client_id, provider)
);

-- RLS de las tablas de cuentas: lectura y escritura con acceso al cliente.
do $$
declare t text;
begin
  foreach t in array array[
    'brand_kits', 'brand_kit_versions', 'offers', 'assets', 'ad_creatives',
    'campaigns', 'landings', 'leads', 'integrations'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy %I on public.%I for all to authenticated '
      'using (public.has_client_access(client_id)) '
      'with check (public.has_client_access(client_id))',
      t || '_por_cliente', t);
  end loop;
end $$;

-- ai_jobs: se lee con acceso al cliente; sólo lo escribe service_role (runJob).
alter table public.ai_jobs enable row level security;

create policy ai_jobs_select on public.ai_jobs
  for select to authenticated
  using (public.has_client_access(client_id));

-- -----------------------------------------------------------------------------
-- 3. Agentes
-- -----------------------------------------------------------------------------

create table public.agent_runs (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references public.clients (id) on delete cascade,
  -- La tarea en lenguaje natural. Es lo que recibe el modelo como primer mensaje.
  goal         text not null check (length(goal) between 1 and 20000),
  -- Herramientas permitidas en esta ejecución. Vacío = todas las de v0.
  tools        text[] not null default '{}',
  max_steps    integer not null default 40 check (max_steps between 1 and 200),
  model        text,
  status       text not null default 'queued'
               check (status in ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  -- Respuesta final del agente (texto) y lo que haya querido devolver estructurado.
  result       jsonb,
  error        text,
  -- Cuántas veces la ha cogido un worker. Sube con cada reintento de la cola.
  attempts     integer not null default 0,
  ai_job_id    uuid references public.ai_jobs (id) on delete set null,
  created_by   uuid references public.members (id) on delete set null,
  created_at   timestamptz not null default now(),
  started_at   timestamptz,
  finished_at  timestamptz
);

create index agent_runs_client_created_idx on public.agent_runs (client_id, created_at desc);
create index agent_runs_status_idx on public.agent_runs (status) where status in ('queued', 'running');

-- La traza: una fila por llamada a herramienta y por respuesta del modelo.
create table public.agent_steps (
  id          bigint generated always as identity primary key,
  run_id      uuid not null references public.agent_runs (id) on delete cascade,
  client_id   uuid not null references public.clients (id) on delete cascade,
  attempt     integer not null,
  idx         integer not null,
  kind        text not null check (kind in ('assistant', 'tool_call')),
  tool_name   text,
  input       jsonb,
  output      jsonb,
  is_error    boolean not null default false,
  duration_ms integer,
  created_at  timestamptz not null default now(),
  unique (run_id, attempt, idx)
);

alter table public.agent_runs  enable row level security;
alter table public.agent_steps enable row level security;

create policy agent_runs_select on public.agent_runs
  for select to authenticated
  using (public.has_client_access(client_id));

create policy agent_steps_select on public.agent_steps
  for select to authenticated
  using (public.has_client_access(client_id));

-- La cola. Un mensaje = { "run_id": "<uuid>" }; todo lo demás vive en agent_runs.
select pgmq.create('agent_runs');

-- Crea la ejecución y la encola en la misma transacción: no puede quedar una fila
-- 'queued' sin mensaje ni un mensaje sin fila. La puede llamar la web (con sesión de
-- Supabase Auth y acceso al cliente) o el servidor/worker con service_role.
create function public.create_agent_run(
  p_client_id uuid,
  p_goal      text,
  p_tools     text[] default '{}',
  p_max_steps integer default 40,
  p_model     text default null
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if coalesce(auth.role(), '') <> 'service_role' and not public.has_client_access(p_client_id) then
    raise exception 'sin acceso al cliente %', p_client_id using errcode = '42501';
  end if;

  insert into public.agent_runs (client_id, goal, tools, max_steps, model, created_by)
  values (p_client_id, p_goal, coalesce(p_tools, '{}'), coalesce(p_max_steps, 40), p_model,
          public.current_member_id())
  returning id into v_id;

  perform pgmq.send('agent_runs', jsonb_build_object('run_id', v_id));
  return v_id;
end $$;

-- Envoltorios de pgmq para el worker. PostgREST no expone el esquema pgmq y no hace
-- falta: el worker llama a estas funciones por RPC con la clave de servicio.
create function public.agent_queue_read(p_vt integer, p_qty integer default 1)
returns table (msg_id bigint, read_ct integer, enqueued_at timestamptz, message jsonb)
language sql security definer
set search_path = ''
as $$
  select r.msg_id, r.read_ct, r.enqueued_at, r.message
  from pgmq.read('agent_runs', p_vt, p_qty) r
$$;

-- Latido: alarga la invisibilidad mientras el agente sigue trabajando.
create function public.agent_queue_extend(p_msg_id bigint, p_vt integer)
returns void
language sql security definer
set search_path = ''
as $$
  select null::void from pgmq.set_vt('agent_runs', p_msg_id, p_vt)
$$;

create function public.agent_queue_archive(p_msg_id bigint)
returns boolean
language sql security definer
set search_path = ''
as $$
  select pgmq.archive('agent_runs', p_msg_id)
$$;

revoke all on function public.create_agent_run(uuid, text, text[], integer, text) from public, anon;
grant execute on function public.create_agent_run(uuid, text, text[], integer, text) to authenticated, service_role;

revoke all on function public.agent_queue_read(integer, integer)  from public, anon, authenticated;
revoke all on function public.agent_queue_extend(bigint, integer) from public, anon, authenticated;
revoke all on function public.agent_queue_archive(bigint)         from public, anon, authenticated;
grant execute on function public.agent_queue_read(integer, integer)  to service_role;
grant execute on function public.agent_queue_extend(bigint, integer) to service_role;
grant execute on function public.agent_queue_archive(bigint)         to service_role;

-- -----------------------------------------------------------------------------
-- 4. Diagnóstico (datos de Valme, sin cliente: los ve cualquiera del equipo)
-- -----------------------------------------------------------------------------

create table public.dx_leads (
  id           uuid primary key default gen_random_uuid(),
  empresa      text not null,
  dominio      text not null,
  contacto     text,
  email        text,
  telefono     text,
  mensaje      text,
  origen       text not null default 'web',
  estado       text not null default 'nuevo'
               check (estado in ('nuevo', 'auditado', 'contactado', 'ganado', 'perdido')),
  cliente_id   uuid references public.clients (id) on delete set null,
  recibido_en  timestamptz not null default now()
);

-- Una ejecución del auditor: desde la ficha de un lead, desde la consola o desde un
-- agente (auditar_dominio). El informe entero va en hallazgos.
create table public.audits (
  id                      uuid primary key default gen_random_uuid(),
  dominio                 text not null,
  herramientas            text[] not null,
  lead_id                 uuid references public.dx_leads (id) on delete set null,
  client_id               uuid references public.clients (id) on delete set null,
  agent_run_id            uuid references public.agent_runs (id) on delete set null,
  duracion_ms             integer not null,
  senales                 integer not null,
  resumen                 jsonb not null,
  hallazgos               jsonb not null,
  fuentes_no_disponibles  jsonb not null default '[]',
  ejecutada_en            timestamptz not null default now()
);

create index audits_dominio_idx on public.audits (dominio, ejecutada_en desc);

alter table public.dx_leads enable row level security;
alter table public.audits   enable row level security;

create policy dx_leads_equipo on public.dx_leads
  for all to authenticated
  using (public.current_member_id() is not null)
  with check (public.current_member_id() is not null);

-- Una auditoría de un cliente sólo la ve quien tiene acceso a ese cliente; las de
-- prospectos (sin cliente), todo el equipo.
create policy audits_select on public.audits
  for select to authenticated
  using (
    public.current_member_id() is not null
    and (client_id is null or public.has_client_access(client_id))
  );
