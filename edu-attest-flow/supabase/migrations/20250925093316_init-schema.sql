-- Supabase initial schema for NKWATSA AI

create table public.users (
  wallet text primary key,
  display_name text,
  email text,
  created_at timestamp with time zone default timezone('utc', now()) not null
);

create table public.user_roles (
  wallet text not null references public.users(wallet) on delete cascade,
  role text not null check (role in ('LEARNER','TUTOR','BENEFITS_ADMIN','SYSTEM','PLATFORM_ADMIN')),
  created_at timestamp with time zone default timezone('utc', now()) not null,
  primary key (wallet, role)
);

create table public.courses (
  course_id text primary key,
  title text not null,
  syllabus_url text,
  version integer not null default 1,
  created_by text references public.users(wallet),
  created_at timestamp with time zone default timezone('utc', now()) not null
);

create table public.modules (
  course_id text not null references public.courses(course_id) on delete cascade,
  module_id text not null,
  passing_rule_json jsonb not null,
  is_checkpoint boolean not null default false,
  primary key (course_id, module_id)
);

create table public.quizzes (
  quiz_id uuid primary key,
  course_id text not null references public.courses(course_id) on delete cascade,
  module_id text not null,
  expires_at timestamp with time zone,
  constraint quizzes_module_fk
    foreign key (course_id, module_id)
    references public.modules(course_id, module_id)
);


create table public.quiz_items (
  quiz_item_id uuid primary key,
  quiz_id uuid not null references public.quizzes(quiz_id) on delete cascade,
  stem text not null,
  answer_format text not null check (answer_format in ('boolean','multiple_choice')),
  correct_answer jsonb not null
);

create index quiz_items_quiz_id_idx on public.quiz_items(quiz_id);

create table public.attempts (
  attempt_id uuid primary key,
  wallet text references public.users(wallet),
  course_id text not null references public.courses(course_id),
  module_id text not null,
  quiz_id uuid references public.quizzes(quiz_id),
  score_raw integer not null,
  score_max integer not null,
  duration_s integer not null,
  passed boolean not null,
  created_at timestamp with time zone default timezone('utc', now()) not null,
  request_id text unique
);

create table public.progress (
  wallet text not null references public.users(wallet),
  course_id text not null references public.courses(course_id),
  module_id text not null,
  latest_attempt_id uuid references public.attempts(attempt_id),
  status text not null check (status in ('NOT_STARTED','IN_PROGRESS','READY','BENEFIT_CLAIMED')),
  passed_at timestamp with time zone,
  version integer not null default 1,
  primary key (wallet, course_id, module_id)
);

create table public.benefit_claims (
  claim_code text primary key,
  wallet text references public.users(wallet),
  benefit_id text not null,
  created_at timestamp with time zone default timezone('utc', now()) not null
);

create table public.idempotency_store (
  request_id text primary key,
  response_data jsonb not null,
  created_at timestamp with time zone default timezone('utc', now()) not null
);

create table public.nonces (
  nonce text primary key,
  created_at timestamp with time zone default timezone('utc', now()) not null,
  expires_at timestamp with time zone not null
);

-- Seed roles and starter course (optional)
insert into public.users (wallet, display_name)
values
  ('0x53E5F7924A0AE082552dfd20A83cE6327A927d94','Alice Learner'),
  ('0xfc34AB6be08e8A18dc2a460a677C6878C79dbb88','Bob Tutor'),
  ('0x5fc21Aff47e88fa11df793cA02cc1d210E9DBe4b','Carol Benefits'),
  ('0xEE2D1232f60e82450111EB99F555D193e9BA0101','System Bot'),
  ('0x474c90da983d736f597D29cc3381F4CC8c068E90','Admin Platform')
on conflict (wallet) do nothing;

insert into public.user_roles (wallet, role) values
  ('0x53E5F7924A0AE082552dfd20A83cE6327A927d94','LEARNER'),
  ('0xfc34AB6be08e8A18dc2a460a677C6878C79dbb88','TUTOR'),
  ('0x5fc21Aff47e88fa11df793cA02cc1d210E9DBe4b','BENEFITS_ADMIN'),
  ('0xEE2D1232f60e82450111EB99F555D193e9BA0101','SYSTEM'),
  ('0x474c90da983d736f597D29cc3381F4CC8c068E90','PLATFORM_ADMIN')
on conflict do nothing;

insert into public.courses (course_id, title, syllabus_url, created_by)
values ('MATH101','Basic Mathematics Readiness','https://example.com/math101-syllabus','0xfc34AB6be08e8A18dc2a460a677C6878C79dbb88')
on conflict (course_id) do nothing;

insert into public.modules (course_id, module_id, passing_rule_json, is_checkpoint)
values ('MATH101','readiness','{"minScore":8,"maxTime":180}', true)
on conflict do nothing;

