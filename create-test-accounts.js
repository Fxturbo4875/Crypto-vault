import { db } from './server/db.js';
import { cryptoAccounts, users } from './shared/schema.js';
import { eq } from 'drizzle-orm';
import { format } from 'date-fns';

async function createTestAccounts() {
  try {
    // Get testuser's ID
    const testUser = await db.select().from(users).where(eq(users.username, 'testuser'));
    
    if (!testUser.length) {
      console.error('Test user not found');
      return;
    }
    
    const userId = testUser[0].id;
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Create test accounts
    const accounts = [
      {
        exchangeName: 'Binance',
        email: 'test1@example.com',
        password: 'securePass1',
        authenticatorEnabled: true,
        ownersName: 'Test Owner',
        phoneNumber: '555-123-4567',
        userId: userId,
        dateAdded: today,
        status: 'good'
      },
      {
        exchangeName: 'Coinbase',
        email: 'test2@example.com',
        password: 'securePass2',
        authenticatorEnabled: false,
        ownersName: 'Test Owner',
        phoneNumber: '555-123-4568',
        userId: userId,
        dateAdded: today,
        status: 'bad'
      },
      {
        exchangeName: 'Kraken',
        email: 'test3@example.com',
        password: 'securePass3',
        authenticatorEnabled: true,
        ownersName: 'Test Owner',
        phoneNumber: '555-123-4569',
        userId: userId,
        dateAdded: today,
        status: 'wrong_password'
      },
      {
        exchangeName: 'Gemini',
        email: 'test4@example.com',
        password: 'securePass4',
        authenticatorEnabled: false,
        ownersName: 'Test Owner',
        phoneNumber: '555-123-4570',
        userId: userId,
        dateAdded: today,
        status: 'unchecked'
      }
    ];
    
    // Insert accounts
    for (const account of accounts) {
      await db.insert(cryptoAccounts).values(account);
      console.log(`Created account for ${account.exchangeName} with status ${account.status}`);
    }
    
    console.log('All test accounts created successfully');
    
  } catch (error) {
    console.error('Error creating test accounts:', error);
  }
}

createTestAccounts();
