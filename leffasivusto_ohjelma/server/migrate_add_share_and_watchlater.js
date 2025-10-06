// Load dotenv and print diagnostics before importing db pool
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

// Resolve paths relative to this script so it always prefers server/.env
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const serverEnv = path.resolve(__dirname, '.env')
const rootEnv = path.resolve(__dirname, '..', '.env')
const envPath = fs.existsSync(serverEnv) ? serverEnv : (fs.existsSync(rootEnv) ? rootEnv : serverEnv)
dotenv.config({ path: envPath })

// Diagnostic: type/length of DB_PASSWORD (do NOT print the secret itself)
let dbPass = process.env.DB_PASSWORD
// If value is wrapped in quotes in .env (e.g. 'pass'), strip them
if (typeof dbPass === 'string') {
  const m = dbPass.match(/^(['"])(.*)\1$/)
  if (m) {
    dbPass = m[2]
    process.env.DB_PASSWORD = dbPass
  }
}

console.log('Using .env:', envPath)
console.log('DB_PASSWORD type:', typeof dbPass, ' length:', dbPass ? String(dbPass).length : 0)

// Ensure it's a string to avoid SASL errors
if (dbPass != null && typeof dbPass !== 'string') {
  process.env.DB_PASSWORD = String(dbPass)
  console.log('Coerced DB_PASSWORD to string')
}

import pool from './db.js'

async function migrate() {
  try {
    // Add share_token column if missing
    await pool.query(`ALTER TABLE favorite_lists ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE`)
    console.log('Ensured favorite_lists.share_token exists')

    // Create watch_later table if missing
    await pool.query(`
      CREATE TABLE IF NOT EXISTS watch_later (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        movie_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, movie_id)
      )
    `)
    console.log('Ensured watch_later table exists')

    console.log('Migration finished successfully')
  } catch (e) {
    console.error('Migration failed:', e)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

migrate()
