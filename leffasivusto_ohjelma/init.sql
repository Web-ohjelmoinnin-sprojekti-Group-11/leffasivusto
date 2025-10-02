-- käyttäjät
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ryhmät
CREATE TABLE groups (
    group_id SERIAL PRIMARY KEY,
    owner_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    group_name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ryhmän jäsenet
CREATE TABLE group_members (
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    group_id INT REFERENCES groups(group_id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('member','admin')) DEFAULT 'member',
    PRIMARY KEY (user_id, group_id)
);

-- arvostelut
CREATE TABLE IF NOT EXISTS reviews (
  review_id   SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  movie_id    INTEGER NOT NULL,              -- TMDB-ID
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT reviews_user_movie_uniq UNIQUE (user_id, movie_id)
);

-- näytösajat
CREATE TABLE IF NOT EXISTS showtimes (
  id           SERIAL PRIMARY KEY,
  movie_id     INT NOT NULL,
  theatre_name VARCHAR(100) NOT NULL,
  showtime     TIMESTAMP NOT NULL,
  group_id     INT,  -- viittaus groups-tauluun
  CONSTRAINT fk_showtimes_group
    FOREIGN KEY (group_id)
    REFERENCES groups(group_id)
    ON DELETE CASCADE
);

-- suosikkilistat
CREATE TABLE favorite_lists (
    favorite_list_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    name TEXT NOT NULL
);

-- suosikkilistan sisältö
CREATE TABLE favorite_list_movies (
    favorite_list_id INT REFERENCES favorite_lists(favorite_list_id) ON DELETE CASCADE,
    movie_id TEXT NOT NULL,
    PRIMARY KEY (favorite_list_id, movie_id)
);

-- katso myöhemmin-lista
CREATE TABLE IF NOT EXISTS watch_later (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  movie_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, movie_id)
);

-- ryhmän sisältö
CREATE TABLE group_content (
    content_id SERIAL PRIMARY KEY,
    group_id INT REFERENCES groups(group_id) ON DELETE CASCADE,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    review_id INT REFERENCES reviews(review_id) ON DELETE SET NULL,
    text TEXT,
    role TEXT
);



-- review taulun konffi, aja kokonaisuudessaan.

BEGIN;

-- 0) Luo taulu jos puuttuu (minimirakenne, täydennetään alla)
CREATE TABLE IF NOT EXISTS reviews (
  review_id  SERIAL PRIMARY KEY,
  user_id    INTEGER,
  movie_id   INTEGER,
  rating     SMALLINT,
  text       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1) Korjaa TYYPIT vain jos poikkeavat
DO $$
BEGIN
  -- user_id -> int4
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='reviews' AND column_name='user_id' AND udt_name <> 'int4'
  ) THEN
    ALTER TABLE reviews ALTER COLUMN user_id TYPE int4 USING user_id::int4;
  END IF;

  -- movie_id -> int4
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='reviews' AND column_name='movie_id' AND udt_name <> 'int4'
  ) THEN
    ALTER TABLE reviews ALTER COLUMN movie_id TYPE int4 USING movie_id::int4;
  END IF;

  -- rating -> int2 (smallint)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='reviews' AND column_name='rating' AND udt_name <> 'int2'
  ) THEN
    ALTER TABLE reviews ALTER COLUMN rating TYPE int2 USING rating::int2;
  END IF;

  -- created_at -> timestamptz
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='reviews' AND column_name='created_at' AND udt_name <> 'timestamptz'
  ) THEN
    ALTER TABLE reviews ALTER COLUMN created_at TYPE timestamptz USING created_at::timestamptz;
  END IF;
END$$;

-- 2) Siivoa data (NULLit ja arvioiden rajaus)
UPDATE reviews SET created_at = NOW() WHERE created_at IS NULL;
UPDATE reviews SET text       = ''   WHERE text IS NULL;
UPDATE reviews SET rating     = 1    WHERE rating IS NULL;
UPDATE reviews SET rating     = GREATEST(1, LEAST(rating, 5));

-- 2b) Poista duplikaatit (sama user_id+movie_id), säilytä uusin rivi
WITH ranked AS (
  SELECT review_id,
         ROW_NUMBER() OVER (
           PARTITION BY user_id, movie_id
           ORDER BY created_at DESC NULLS LAST, review_id DESC
         ) AS rn
  FROM reviews
)
DELETE FROM reviews r
USING ranked d
WHERE r.review_id = d.review_id AND d.rn > 1;

-- 3) NOT NULL + DEFAULT NOW()
ALTER TABLE reviews
  ALTER COLUMN user_id    SET NOT NULL,
  ALTER COLUMN movie_id   SET NOT NULL,
  ALTER COLUMN rating     SET NOT NULL,
  ALTER COLUMN text       SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT NOW();

-- 4) CHECK (rating 1..5) – lisää vain jos puuttuu
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'reviews'::regclass
      AND conname  IN ('reviews_rating_check','reviews_rating_chk')
  ) THEN
    ALTER TABLE reviews
      ADD CONSTRAINT reviews_rating_check CHECK (rating BETWEEN 1 AND 5);
  END IF;
END$$;

-- 5) FOREIGN KEY usersiin (ON DELETE CASCADE) – lisää vain jos puuttuu
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='reviews'::regclass
      AND conname='reviews_user_id_fkey'
  ) THEN
    ALTER TABLE reviews
      ADD CONSTRAINT reviews_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
  END IF;
END$$;

-- 6) UNIQUE (user_id, movie_id) – vaaditaan ON CONFLICT -upsertille
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='reviews'::regclass
      AND conname='reviews_user_movie_uniq'
  ) THEN
    ALTER TABLE reviews
      ADD CONSTRAINT reviews_user_movie_uniq UNIQUE (user_id, movie_id);
  END IF;
END$$;

-- 7) Indeksit hakuihin
CREATE INDEX IF NOT EXISTS idx_reviews_movie_id   ON reviews(movie_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

COMMIT;


-- Group scriptejä:
-- Tämän jälkeen saa lähetettyä join-kutsun (pending-tila)

/*
-- 2025-09-25: group_members.role -> allow 'pending' + backfill owner as 'admin'
-- Tämä skripti on idempotentti: sen voi ajaa useamman kerran turvallisesti.

BEGIN;

-- 1) Varmistetaan, että rooli-sarake on olemassa (turvatarkistus – ei muuta tyyppiä)
-- (Ohitetaan jos sarake puuttuu -> virhe, koska app odottaa sitä.)
-- SELECT 1 FROM information_schema.columns
-- WHERE table_schema='public' AND table_name='group_members' AND column_name='role';

-- 2) Pudota mahdollinen vanha CHECK ja luo uusi joka sallii myös 'pending'
DO $$
BEGIN
  -- Jos constraint löytyy, pudota se
  IF EXISTS (
    SELECT 1
    FROM   pg_constraint c
    JOIN   pg_class t ON t.oid = c.conrelid
    JOIN   pg_namespace n ON n.oid = t.relnamespace
    WHERE  n.nspname = 'public'
      AND  t.relname = 'group_members'
      AND  c.conname = 'group_members_role_check'
  ) THEN
    ALTER TABLE public.group_members
      DROP CONSTRAINT group_members_role_check;
  END IF;

  -- Luo uusi hyväksymään admin, member, pending
  ALTER TABLE public.group_members
    ADD CONSTRAINT group_members_role_check
    CHECK (role IN ('admin','member','pending'));
END
$$;

-- 3) Tiukennetaan sarakkeen säännöt (valinnaista mutta suositeltavaa)
ALTER TABLE public.group_members
  ALTER COLUMN role SET NOT NULL,
  ALTER COLUMN role SET DEFAULT 'member';

-- 4) Backfill: lisää omistaja ryhmän jäseneksi admin-roolilla, jos puuttuu
INSERT INTO public.group_members (user_id, group_id, role)
SELECT g.owner_id, g.group_id, 'admin'
FROM   public.groups g
LEFT   JOIN public.group_members gm
       ON gm.group_id = g.group_id
      AND gm.user_id  = g.owner_id
WHERE  gm.user_id IS NULL;

COMMIT;

-- --- VAPAAEHTOINEN TARKISTUS (voit ajaa erikseen) -------------------------
-- SELECT conname, pg_get_constraintdef(c.oid)
-- FROM pg_constraint c
-- JOIN pg_class t ON t.oid = c.conrelid
-- JOIN pg_namespace n ON n.oid = t.relnamespace
-- WHERE n.nspname='public' AND t.relname='group_members';

-- SELECT * FROM public.group_members ORDER BY group_id, role DESC;

*/


--Showtimes taulun konffi, aja kokonaisuudessaan.

-- CREATE or UPDATE table for shared showtimes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'showtimes'
  ) THEN
    CREATE TABLE public.showtimes (
      id           SERIAL PRIMARY KEY,
      movie_id     INTEGER NULL,
      title        TEXT NOT NULL,
      theatre_name TEXT NOT NULL,
      showtime     TIMESTAMPTZ NOT NULL,
      group_id     INTEGER NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,
      user_id      INTEGER NULL REFERENCES users(user_id) ON DELETE SET NULL,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_showtimes_group_time ON public.showtimes(group_id, showtime);
  END IF;
END$$;

-- Add missing columns on existing tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='showtimes' AND column_name='title') THEN
    ALTER TABLE public.showtimes ADD COLUMN title TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='showtimes' AND column_name='user_id') THEN
    ALTER TABLE public.showtimes ADD COLUMN user_id INTEGER NULL REFERENCES users(user_id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='showtimes' AND column_name='created_at') THEN
    ALTER TABLE public.showtimes ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;

  -- ensure types
  ALTER TABLE public.showtimes ALTER COLUMN theatre_name TYPE TEXT;
  ALTER TABLE public.showtimes ALTER COLUMN showtime TYPE TIMESTAMPTZ USING showtime::timestamptz;
END$$;

CREATE INDEX IF NOT EXISTS idx_showtimes_group_time ON public.showtimes(group_id, showtime);


-- User tauluun, jotta voi vaihtaa salasanaa

ALTER TABLE users
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT NOW();