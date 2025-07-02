create table public.stories (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  publication_name text not null,
  sender_email text null,
  sender_name text null,
  issue_date date null,
  subject_line text null,
  title text not null,
  summary text null,
  content text not null,
  url text null,
  category text null,
  importance_score integer null,
  estimated_read_time integer null default 0,
  key_points text[] null,
  is_read boolean null default false,
  is_bookmarked boolean null default false,
  read_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  html_content text null,
  content_type text not null default 'newsletter'::text,
  video_url text null,
  video_duration integer null,
  rating numeric null,
  constraint stories_pkey primary key (id),
  constraint stories_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint stories_content_type_check check (
    (
      content_type = any (array['newsletter'::text, 'video'::text])
    )
  ),
  constraint stories_importance_score_check check (
    (
      (importance_score >= 1)
      and (importance_score <= 10)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_stories_user_id on public.stories using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_stories_created_at on public.stories using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_stories_is_read on public.stories using btree (user_id, is_read) TABLESPACE pg_default;

create index IF not exists idx_stories_importance on public.stories using btree (user_id, importance_score desc) TABLESPACE pg_default;

create index IF not exists idx_stories_publication on public.stories using btree (user_id, publication_name) TABLESPACE pg_default;

create index IF not exists idx_stories_read_time on public.stories using btree (user_id, estimated_read_time) TABLESPACE pg_default;

create index IF not exists idx_stories_content_type on public.stories using btree (user_id, content_type) TABLESPACE pg_default;


create table public.highlights (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  story_id uuid not null,
  highlighted_text text not null,
  start_offset integer not null,
  end_offset integer not null,
  context_before text null,
  context_after text null,
  color text not null default 'yellow'::text,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint highlights_pkey primary key (id),
  constraint unique_user_story_position unique (user_id, story_id, start_offset, end_offset),
  constraint highlights_story_id_fkey foreign KEY (story_id) references stories (id) on delete CASCADE,
  constraint highlights_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint highlights_color_check check (
    (
      color = any (
        array[
          'yellow'::text,
          'blue'::text,
          'green'::text,
          'pink'::text,
          'purple'::text
        ]
      )
    )
  ),
  constraint highlights_offsets_check check ((end_offset > start_offset))
) TABLESPACE pg_default;

create index IF not exists idx_highlights_user_id on public.highlights using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_highlights_story_id on public.highlights using btree (story_id) TABLESPACE pg_default;

create index IF not exists idx_highlights_user_story on public.highlights using btree (user_id, story_id) TABLESPACE pg_default;

create index IF not exists idx_highlights_created_at on public.highlights using btree (created_at desc) TABLESPACE pg_default;

create table public.flashcards (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  story_id uuid not null,
  front text not null,
  back text not null,
  context_text text null,
  tags text[] null,
  difficulty integer null default 1,
  times_reviewed integer null default 0,
  last_reviewed_at timestamp with time zone null,
  next_review_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint flashcards_pkey primary key (id),
  constraint flashcards_story_id_fkey foreign KEY (story_id) references stories (id) on delete CASCADE,
  constraint flashcards_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint flashcards_difficulty_check check (
    (
      (difficulty >= 1)
      and (difficulty <= 5)
    )
  ),
  constraint flashcards_front_not_empty check (
    (
      length(
        TRIM(
          both
          from
            front
        )
      ) > 0
    )
  ),
  constraint flashcards_back_not_empty check (
    (
      length(
        TRIM(
          both
          from
            back
        )
      ) > 0
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_flashcards_user_id on public.flashcards using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_flashcards_story_id on public.flashcards using btree (story_id) TABLESPACE pg_default;

create index IF not exists idx_flashcards_user_story on public.flashcards using btree (user_id, story_id) TABLESPACE pg_default;

create index IF not exists idx_flashcards_created_at on public.flashcards using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_flashcards_next_review on public.flashcards using btree (user_id, next_review_at) TABLESPACE pg_default;

create index IF not exists idx_flashcards_tags on public.flashcards using gin (tags) TABLESPACE pg_default;