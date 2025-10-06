import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '.env') })

const pkg = await import('pg')
const mod = pkg.default || pkg
const { Pool } = mod

console.log('Loaded .env from', path.resolve(__dirname, '.env'))
console.log('DB_USER type:', typeof process.env.DB_USER)
console.log('DB_HOST type:', typeof process.env.DB_HOST)
console.log('DB_PASSWORD type:', typeof process.env.DB_PASSWORD, 'len:', process.env.DB_PASSWORD ? String(process.env.DB_PASSWORD).length : 0)

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
})

try {
  const client = await pool.connect()
  console.log('Connected OK')
  client.release()
} catch (e) {
  console.error('Connect failed:', e)
} finally {
  await pool.end()
}
