import pool from '../db.js';

export default async function runMigrations() {
  const MIGRATION_NAME = 'share_watchlater_v1';
  console.log('Running migrations...');

  await pool.query('BEGIN');
  try {
    // version table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const { rows } = await pool.query('SELECT 1 FROM schema_migrations WHERE name = $1 LIMIT 1', [MIGRATION_NAME]);
    if (rows.length) {
      await pool.query('COMMIT');
      console.log('Migrations up-to-date.');
      return;
    }

    // create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS favorite_lists (
        favorite_list_id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        share_token TEXT UNIQUE
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS favorite_list_movies (
        favorite_list_id INT NOT NULL REFERENCES favorite_lists(favorite_list_id) ON DELETE CASCADE,
        movie_id TEXT NOT NULL,
        PRIMARY KEY (favorite_list_id, movie_id)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS watch_later (
        user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        movie_id INT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, movie_id)
      );
    `);

    // seed from old favorites if exists
    const favTbl = await pool.query(`SELECT to_regclass('public.favorites') AS exists;`);
    const hasOldFavorites = favTbl?.rows?.[0]?.exists !== null;
    if (hasOldFavorites) {
      await pool.query(`
        INSERT INTO favorite_lists (user_id, name)
        SELECT DISTINCT f.user_id, 'Favorites'
          FROM favorites f
         WHERE NOT EXISTS (
           SELECT 1 FROM favorite_lists fl WHERE fl.user_id = f.user_id
         );
      `);

      await pool.query(`
        INSERT INTO favorite_list_movies (favorite_list_id, movie_id)
        SELECT fl.favorite_list_id, f.movie_id::text
          FROM favorites f
          JOIN favorite_lists fl ON fl.user_id = f.user_id
        ON CONFLICT DO NOTHING;
      `);
    }

    await pool.query('CREATE INDEX IF NOT EXISTS idx_favorite_lists_user ON favorite_lists(user_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_favorite_list_movies_list ON favorite_list_movies(favorite_list_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_watch_later_user ON watch_later(user_id);');

    await pool.query('INSERT INTO schema_migrations (name) VALUES ($1) ON CONFLICT DO NOTHING;', [MIGRATION_NAME]);
    await pool.query('COMMIT');
    console.log('Migration finished: share_watchlater_v1 (old favorites present:', !!hasOldFavorites, ')');
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Migration failed:', err);
    throw err;
  }
}
