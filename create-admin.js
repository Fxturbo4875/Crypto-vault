import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import pg from 'pg';
const { Client } = pg;

// Connect to the database
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdmin() {
  try {
    await client.connect();
    
    // Check if admin already exists
    const checkRes = await client.query("SELECT * FROM users WHERE username = 'Turbo'");
    
    if (checkRes.rows.length > 0) {
      console.log('Admin user "Turbo" already exists. Deleting to recreate...');
      await client.query("DELETE FROM users WHERE username = 'Turbo'");
    }
    
    // Create new admin
    const hashedPassword = await hashPassword('#28522520Turbo');
    
    const result = await client.query(
      "INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id",
      ['Turbo', hashedPassword, 'admin']
    );
    
    console.log(`Admin user "Turbo" created with ID: ${result.rows[0].id}`);
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await client.end();
  }
}

createAdmin();