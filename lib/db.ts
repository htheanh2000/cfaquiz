import { Pool } from 'pg';

const dbHost = process.env.DB_HOST || 'localhost';
const isNeon = dbHost.includes('neon.tech');
const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  host: dbHost,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'cfaquiz',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: (isProduction || isNeon) ? { rejectUnauthorized: false } : false,
});

// Test connection
pool.on('connect', () => {
  console.log('Database connected');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;
