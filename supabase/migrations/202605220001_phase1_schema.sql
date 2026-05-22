create extension if not exists "pgcrypto";

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null,
  topic text not null,
  category text not null,
  tags text[] not null default '{}',
  language text not null default 'en',
  difficulty text not null check (difficulty in ('introductory', 'standard', 'advanced')),
  target_audience text not null check (target_audience in ('youth', 'adult', 'older_adult', 'general')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  visibility text not null default 'private' check (visibility in ('private', 'unlisted', 'public')),
  public_slug text unique,
  disclaimer text not null,
  publisher_display_name text not null default 'Community Financial Learning Lab',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists public.source_materials (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text not null,
  source_text text not null,
  approved boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.lesson_content (
  lesson_id uuid primary key references public.lessons(id) on delete cascade,
  content jsonb not null,
  generation_model text,
  generation_warnings text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.review_checklists (
  lesson_id uuid primary key references public.lessons(id) on delete cascade,
  source_approved boolean not null default false,
  no_personalized_advice boolean not null default false,
  no_product_recommendation boolean not null default false,
  claims_supported boolean not null default false,
  audience_appropriate boolean not null default false,
  disclaimer_present boolean not null default false,
  respectful_feedback boolean not null default false,
  public_metadata_accurate boolean not null default false,
  warnings_acknowledged boolean not null default false,
  reviewed_at timestamptz
);

create table if not exists public.learner_sessions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  choices jsonb not null default '[]'::jsonb,
  knowledge_check_results jsonb not null default '[]'::jsonb,
  confidence_before integer check (confidence_before between 1 and 5),
  confidence_after integer check (confidence_after between 1 and 5)
);

create index if not exists lessons_public_library_idx
  on public.lessons (status, visibility, published_at desc);

create index if not exists lessons_search_idx
  on public.lessons using gin (
    to_tsvector('english', title || ' ' || summary || ' ' || topic || ' ' || category)
  );

alter table public.lessons enable row level security;
alter table public.source_materials enable row level security;
alter table public.lesson_content enable row level security;
alter table public.review_checklists enable row level security;
alter table public.learner_sessions enable row level security;

create policy "Public can read published visible lessons"
  on public.lessons for select
  using (status = 'published' and visibility in ('public', 'unlisted'));

create policy "Public can read content for published visible lessons"
  on public.lesson_content for select
  using (
    exists (
      select 1 from public.lessons
      where lessons.id = lesson_content.lesson_id
      and lessons.status = 'published'
      and lessons.visibility in ('public', 'unlisted')
    )
  );
