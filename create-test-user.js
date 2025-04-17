import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { db } from './server/db.js';
import { users } from './shared/schema.js';
import { eq } from 'drizzle-orm';

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64));
  return `${buf.toString("hex")}.${salt}`;
}

async function createTestUser() {
  try {
    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.username, 'testuser'));
    
    if (existingUser.length > 0) {
      console.log('Test user "testuser" already exists. Deleting to recreate...');
      await db.delete(users).where(eq(users.username, 'testuser'));
    }
    
    // Create new user
    const hashedPassword = await hashPassword('password123');
    
    const [newUser] = await db.insert(users)
      .values({
        username: 'testuser',
        password: hashedPassword,
        role: 'user'
      })
      .returning();
    
    console.log(`Test user "testuser" created with ID: ${newUser.id}`);
  } catch (error) {
    console.error('Error creating test user:', error);
  }
}

createTestUser();
