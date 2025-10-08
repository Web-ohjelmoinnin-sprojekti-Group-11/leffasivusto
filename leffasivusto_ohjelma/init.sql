-- ============================================================
-- init.sql  (idempotentti, voidaan ajaa useasti)
-- ============================================================

BEGIN;

-- 0) Laajennokset
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_bytes() ym.

-- ============================================================
-- 1) USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  user_id       SERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lisää/varmista updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='users' AND column_name='updated_at'
  ) THEN
    ALTER TABLE public.users
      ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END$$;

-- ============================================================
-- 2) GROUPS & MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.groups (
  group_id    SERIAL PRIMARY KEY,
  owner_id    INT REFERENCES users(user_id) ON DELETE CASCADE,
  group_name  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.group_members (
  user_id  INT NOT NULL REFERENCES users(user_id)  ON DELETE CASCADE,
  group_id INT NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,
  role     TEXT,
  PRIMARY KEY (user_id, group_id)
);

-- Rooli: salli admin, member, pending; NOT NULL + DEFAULT 'member'
DO $$
BEGIN
  -- pudota vanha CHECK jos olemassa
  IF EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid=c.conrelid
    JOIN pg_namespace n ON n.oid=t.relnamespace
    WHERE n.nspname='public' AND t.relname='group_members' AND c.conname='group_members_role_check'
  ) THEN
    ALTER TABLE public.group_members DROP CONSTRAINT group_members_role_check;
  END IF;

  -- uusi CHECK
  ALTER TABLE public.group_members
    ADD CONSTRAINT group_members_role_check
    CHECK (role IN ('admin','member','pending'));

  ALTER TABLE public.group_members
    ALTER COLUMN role SET NOT NULL,
    ALTER COLUMN role SET DEFAULT 'member';
END$$;

-- Backfill: lisää ryhmän owner admin-jäseneksi jos puuttuu
INSERT INTO public.group_members (user_id, group_id, role)
SELECT g.owner_id, g.group_id, 'admin'
FROM public.groups g
LEFT JOIN public.group_members gm
  ON gm.group_id=g.group_id AND gm.user_id=g.owner_id
WHERE gm.user_id IS NULL;

-- ============================================================
-- 3) REVIEWS
-- ============================================================
-- minimirakenne
CREATE TABLE IF NOT EXISTS public.reviews (
  review_id  SERIAL PRIMARY KEY,
  user_id    INT,
  movie_id   INT,
  rating     SMALLINT,
  text       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- varmista tyypit
DO $$
BEGIN
  -- user_id -> int4
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='user_id' AND udt_name <> 'int4') THEN
    ALTER TABLE public.reviews ALTER COLUMN user_id TYPE int4 USING user_id::int4;
  END IF;
  -- movie_id -> int4
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='movie_id' AND udt_name <> 'int4') THEN
    ALTER TABLE public.reviews ALTER COLUMN movie_id TYPE int4 USING movie_id::int4;
  END IF;
  -- rating -> int2
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='rating' AND udt_name <> 'int2') THEN
    ALTER TABLE public.reviews ALTER COLUMN rating TYPE int2 USING rating::int2;
  END IF;
  -- created_at -> timestamptz
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='created_at' AND udt_name <> 'timestamptz') THEN
    ALTER TABLE public.reviews ALTER COLUMN created_at TYPE timestamptz USING created_at::timestamptz;
  END IF;
END$$;

-- siivoa NULLit & rajaa rating
UPDATE public.reviews SET created_at = NOW() WHERE created_at IS NULL;
UPDATE public.reviews SET text       = ''   WHERE text IS NULL;
UPDATE public.reviews SET rating     = 1    WHERE rating IS NULL;
UPDATE public.reviews SET rating     = GREATEST(1, LEAST(rating, 5));

-- Poista duplikaatit (sama user+movie), säilytä uusin
WITH ranked AS (
  SELECT review_id,
         ROW_NUMBER() OVER (PARTITION BY user_id, movie_id ORDER BY created_at DESC NULLS LAST, review_id DESC) rn
  FROM public.reviews
)
DELETE FROM public.reviews r
USING ranked d
WHERE r.review_id=d.review_id AND d.rn>1;

-- NOT NULL + DEFAULT
ALTER TABLE public.reviews
  ALTER COLUMN user_id    SET NOT NULL,
  ALTER COLUMN movie_id   SET NOT NULL,
  ALTER COLUMN rating     SET NOT NULL,
  ALTER COLUMN text       SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT NOW();

-- CHECK 1..5
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conrelid='reviews'::regclass AND conname='reviews_rating_check'
  ) THEN
    ALTER TABLE public.reviews ADD CONSTRAINT reviews_rating_check CHECK (rating BETWEEN 1 AND 5);
  END IF;
END$$;

-- FKs & UNIQUE
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='reviews'::regclass AND conname='reviews_user_id_fkey') THEN
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='reviews'::regclass AND conname='reviews_user_movie_uniq') THEN
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_user_movie_uniq UNIQUE (user_id, movie_id);
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_reviews_movie_id   ON public.reviews(movie_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- ============================================================
-- 4) FAVORITE LISTS + WATCH LATER
-- ============================================================
CREATE TABLE IF NOT EXISTS public.favorite_lists (
  favorite_list_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  name    TEXT NOT NULL
);

-- created_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='favorite_lists' AND column_name='created_at'
  ) THEN
    ALTER TABLE public.favorite_lists ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END$$;

-- share_token
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='favorite_lists' AND column_name='share_token'
  ) THEN
    ALTER TABLE public.favorite_lists ADD COLUMN share_token TEXT;
  END IF;
END$$;

-- uniikki (user_id, name)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conrelid='favorite_lists'::regclass AND conname='favorite_lists_user_name_key'
  ) THEN
    ALTER TABLE public.favorite_lists ADD CONSTRAINT favorite_lists_user_name_key UNIQUE (user_id, name);
  END IF;
END$$;

-- share_token unique when not null
CREATE UNIQUE INDEX IF NOT EXISTS idx_favorite_lists_share_token
  ON public.favorite_lists(share_token) WHERE share_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_favorite_lists_user ON public.favorite_lists(user_id);

-- sisältö
CREATE TABLE IF NOT EXISTS public.favorite_list_movies (
  favorite_list_id INT  NOT NULL REFERENCES public.favorite_lists(favorite_list_id) ON DELETE CASCADE,
  movie_id         TEXT NOT NULL,
  PRIMARY KEY (favorite_list_id, movie_id)
);
CREATE INDEX IF NOT EXISTS idx_favorite_list_movies_list ON public.favorite_list_movies(favorite_list_id);

-- watch later
CREATE TABLE IF NOT EXISTS public.watch_later (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  movie_id   INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, movie_id)
);
CREATE INDEX IF NOT EXISTS idx_watch_later_user ON public.watch_later(user_id);

-- (kertaluontoinen siivous) epäkelvot tokenit nollaksi
UPDATE public.favorite_lists
   SET share_token=NULL
 WHERE share_token IS NOT NULL
   AND (length(share_token) < 20 OR length(share_token) > 128);

-- ============================================================
-- 5) GROUP CONTENT
-- ============================================================
CREATE TABLE IF NOT EXISTS public.group_content (
  content_id SERIAL PRIMARY KEY,
  group_id   INT REFERENCES public.groups(group_id) ON DELETE CASCADE,
  user_id    INT REFERENCES public.users(user_id) ON DELETE CASCADE,
  review_id  INT REFERENCES public.reviews(review_id) ON DELETE SET NULL,
  text       TEXT,
  role       TEXT
);

-- ============================================================
-- 6) SHOWTIMES
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='showtimes'
  ) THEN
    CREATE TABLE public.showtimes (
      id           SERIAL PRIMARY KEY,
      movie_id     INT NULL,
      title        TEXT NOT NULL,
      theatre_name TEXT NOT NULL,
      showtime     TIMESTAMPTZ NOT NULL,
      group_id     INT NOT NULL REFERENCES public.groups(group_id) ON DELETE CASCADE,
      user_id      INT NULL REFERENCES public.users(user_id) ON DELETE SET NULL,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  END IF;
END$$;

-- varmista sarakkeet/tyypit jos taulu jo oli
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='showtimes' AND column_name='title') THEN
    ALTER TABLE public.showtimes ADD COLUMN title TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='showtimes' AND column_name='user_id') THEN
    ALTER TABLE public.showtimes ADD COLUMN user_id INT NULL REFERENCES public.users(user_id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='showtimes' AND column_name='created_at') THEN
    ALTER TABLE public.showtimes ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;

  -- tyypit
  ALTER TABLE public.showtimes
    ALTER COLUMN theatre_name TYPE TEXT,
    ALTER COLUMN showtime TYPE TIMESTAMPTZ USING showtime::timestamptz;
END$$;

CREATE INDEX IF NOT EXISTS idx_showtimes_group_time ON public.showtimes(group_id, showtime);

-- ============================================================
-- 7) SCHEMA MIGRATIONS (valinnainen loki)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.schema_migrations (
  name       TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMIT;

-- ============================================================
-- LOPPU
-- ============================================================
