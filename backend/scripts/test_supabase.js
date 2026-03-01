require('dotenv').config();
const { Client } = require('pg');

console.log('Attempting to connect to:', process.env.DATABASE_URL.split('@')[1]); // Log host only for safety

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
});

client.connect()
  .then(() => {
    console.log('Successfully connected to Supabase!');
    return client.query('SELECT NOW()');
  })
  .then(res => {
    console.log('Database time:', res.rows[0].now);
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection failed:', err.message);
    process.exit(1);
  })
  .finally(() => client.end());
