#!/usr/bin/env node
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
// Load same .env resolution as server/index.js
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '..', '.env') })

import pool from '../db.js'

async function run() {
  console.log('Ensuring favorite_lists.share_token column and unique index...')
  try {
    await pool.query('BEGIN')
    // Add column if missing
    await pool.query(`ALTER TABLE favorite_lists ADD COLUMN IF NOT EXISTS share_token TEXT`) 
    // Create unique index (NULLs are allowed so multiple NULLs ok)
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_favorite_lists_share_token ON favorite_lists(share_token)`)
    await pool.query('COMMIT')
    console.log('Done: share_token column ensured and unique index created (if not present).')
  } catch (e) {
    await pool.query('ROLLBACK')
    console.error('Failed to ensure share_token column:', e)
    process.exitCode = 2
  } finally {
    // give pool a moment then end
    await pool.end()
  }
}

run()
