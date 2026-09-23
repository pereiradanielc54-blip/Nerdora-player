-- Crônicas de Nerdora — Mestre Máquina
-- Banco central de memória adaptativa v0.1
-- Projetado para PostgreSQL. A Web Alpha 0.2.5 usa IndexedDB local;
-- este esquema é a base para aprendizado compartilhado quando houver backend.

create table if not exists master_player_profiles (
  player_id text primary key,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  total_actions integer not null default 0,
  successful_checks integer not null default 0,
  failed_checks integer not null default 0,
  exploration_score integer not null default 0,
  social_score integer not null default 0,
  combat_score integer not null default 0,
  stealth_score integer not null default 0,
  magic_score integer not null default 0,
  support_score integer not null default 0,
  risk_score integer not null default 0
);

create table if not exists master_player_facts (
  id bigserial primary key,
  player_id text not null references master_player_profiles(player_id) on delete cascade,
  fact_key text not null,
  fact_type text not null,
  label text not null,
  fact_value text not null,
  confidence numeric(4,3) not null default 0.700,
  source_kind text not null default 'player_statement',
  campaign_id text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique(player_id, fact_key)
);

create table if not exists master_session_events (
  id uuid primary key,
  session_id uuid not null,
  campaign_id text not null,
  player_id text,
  character_id text,
  location_id text,
  event_type text not null,
  action_style text,
  normalized_action text,
  raw_action_excerpt text,
  result_kind text,
  state_changed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_master_session_events_campaign
  on master_session_events(campaign_id, created_at desc);

create index if not exists idx_master_session_events_player
  on master_session_events(player_id, created_at desc);

create table if not exists master_route_patterns (
  id bigserial primary key,
  campaign_id text not null,
  location_id text not null,
  action_key text not null,
  attempts integer not null default 0,
  successes integer not null default 0,
  failures integer not null default 0,
  story_advances integer not null default 0,
  dead_end_rescues integer not null default 0,
  unique(campaign_id, location_id, action_key)
);

create table if not exists master_campaign_summaries (
  session_id uuid primary key,
  campaign_id text not null,
  ending_id text,
  ending_label text,
  duration_minutes integer,
  locations_visited integer not null default 0,
  clues_found integer not null default 0,
  player_choices jsonb not null default '[]'::jsonb,
  route_flags jsonb not null default '[]'::jsonb,
  consequences jsonb not null default '[]'::jsonb,
  summary_text text,
  created_at timestamptz not null default now()
);

create table if not exists master_story_insights (
  insight_key text primary key,
  campaign_id text,
  insight_type text not null,
  sample_count integer not null default 0,
  weight numeric(8,4) not null default 0,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Guardrails:
-- 1. Não guardar áudio bruto por padrão.
-- 2. Não guardar dados pessoais reais sem necessidade explícita.
-- 3. Memórias usadas pelo Mestre devem ser sobre personagem, decisões de jogo,
--    preferências de abordagem e padrões narrativos.
-- 4. "Aprender" não significa alterar regras canônicas automaticamente.
--    O Mestre pode ajustar prioridade e improvisação, mas não reescrever cânone,
--    resultados de dados, HP, inventário ou fatos permanentes sem autorização.
-- 5. Dados agregados devem orientar diversidade e reduzir loops, nunca limitar
--    escolhas do jogador a um perfil previsto.


-- Narrative Director / relationships — v0.2
create table if not exists master_npc_relationships (
  campaign_instance_id uuid not null,
  npc_id text not null,
  player_id text,
  trust integer not null default 0,
  respect integer not null default 0,
  fear integer not null default 0,
  suspicion integer not null default 0,
  notes jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (campaign_instance_id, npc_id, player_id)
);

create table if not exists master_director_state (
  campaign_instance_id uuid primary key,
  beats integer not null default 0,
  stagnation integer not null default 0,
  tension integer not null default 1,
  rest_need integer not null default 0,
  last_style text,
  style_streak integer not null default 0,
  last_intervention_beat integer not null default -99,
  world_beat integer not null default 0,
  personal_hook_used boolean not null default false,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists master_world_events (
  id uuid primary key,
  campaign_instance_id uuid not null,
  campaign_id text not null,
  event_key text not null,
  event_type text not null,
  location_id text,
  payload jsonb not null default '{}'::jsonb,
  fired_at timestamptz not null default now(),
  unique(campaign_instance_id, event_key)
);

create table if not exists master_character_hooks (
  character_id text primary key,
  player_id text not null,
  important_person text,
  fear text,
  personal_goal text,
  updated_at timestamptz not null default now()
);

-- The Director uses these tables to preserve continuity and pacing.
-- It may change presentation, event timing, NPC reactions and route emphasis.
-- It must not secretly change dice, canonical facts, HP, inventory or rules.
