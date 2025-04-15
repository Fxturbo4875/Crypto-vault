import { users, type User, type InsertUser, cryptoAccounts, type CryptoAccount, type InsertCryptoAccount, type CryptoAccountWithUser } from "@shared/schema";
import session from "express-session";
import { eq } from "drizzle-orm";
import { db, pool } from "./db";
import connectPg from "connect-pg-simple";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User related methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAdminUsers(): Promise<User[]>; // Added method to get admin users
  
  // Account related methods
  getAccounts(): Promise<CryptoAccountWithUser[]>;
  getAccountsByUserId(userId: number): Promise<CryptoAccountWithUser[]>;
  getAccountById(id: number): Promise<CryptoAccountWithUser | undefined>;
  createAccount(account: InsertCryptoAccount): Promise<CryptoAccount>;
  updateAccount(id: number, account: Partial<InsertCryptoAccount>): Promise<CryptoAccount | undefined>;
  deleteAccount(id: number): Promise<boolean>;
  
  // Session store
  sessionStore: any; // Express session store
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async getAdminUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, "admin"));
  }
  
  async getAccounts(): Promise<CryptoAccountWithUser[]> {
    const accounts = await db.select().from(cryptoAccounts);
    const result: CryptoAccountWithUser[] = [];
    
    for (const account of accounts) {
      const [user] = await db.select().from(users).where(eq(users.id, account.userId));
      result.push({
        ...account,
        addedBy: user?.username || 'Unknown',
      });
    }
    
    return result;
  }
  
  async getAccountsByUserId(userId: number): Promise<CryptoAccountWithUser[]> {
    const accounts = await db.select().from(cryptoAccounts).where(eq(cryptoAccounts.userId, userId));
    const result: CryptoAccountWithUser[] = [];
    
    if (accounts.length === 0) return result;
    
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    for (const account of accounts) {
      result.push({
        ...account,
        addedBy: user?.username || 'Unknown',
      });
    }
    
    return result;
  }
  
  async getAccountById(id: number): Promise<CryptoAccountWithUser | undefined> {
    const [account] = await db.select().from(cryptoAccounts).where(eq(cryptoAccounts.id, id));
    
    if (!account) return undefined;
    
    const [user] = await db.select().from(users).where(eq(users.id, account.userId));
    
    return {
      ...account,
      addedBy: user?.username || 'Unknown',
    };
  }
  
  async createAccount(insertAccount: InsertCryptoAccount): Promise<CryptoAccount> {
    const [account] = await db.insert(cryptoAccounts).values(insertAccount).returning();
    return account;
  }
  
  async updateAccount(id: number, accountUpdate: Partial<InsertCryptoAccount>): Promise<CryptoAccount | undefined> {
    const [existingAccount] = await db.select().from(cryptoAccounts).where(eq(cryptoAccounts.id, id));
    
    if (!existingAccount) return undefined;
    
    const [updatedAccount] = await db
      .update(cryptoAccounts)
      .set(accountUpdate)
      .where(eq(cryptoAccounts.id, id))
      .returning();
    
    return updatedAccount;
  }
  
  async deleteAccount(id: number): Promise<boolean> {
    try {
      const result = await db.delete(cryptoAccounts).where(eq(cryptoAccounts.id, id));
      // The result might not have a count property, but the operation succeeded if we got here
      return true;
    } catch (error) {
      console.error("Error deleting account:", error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();
