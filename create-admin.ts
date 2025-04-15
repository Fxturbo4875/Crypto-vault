import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { db } from './server/db';
import { users } from './shared/schema';
import { eq } from 'drizzle-orm';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await db.select().from(users).where(eq(users.username, 'Turbo'));
    
    if (existingAdmin.length > 0) {
      console.log('Admin user "Turbo" already exists. Deleting to recreate...');
      await db.delete(users).where(eq(users.username, 'Turbo'));
    }
    
    // Create new admin
    const hashedPassword = await hashPassword('#28522520Turbo');
    
    const [newAdmin] = await db.insert(users)
      .values({
        username: 'Turbo',
        password: hashedPassword,
        role: 'admin'
      })
      .returning();
    
    console.log(`Admin user "Turbo" created with ID: ${newAdmin.id}`);
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdmin();