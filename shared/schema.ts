import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Exchange Account schema
export const cryptoAccounts = pgTable("crypto_accounts", {
  id: serial("id").primaryKey(),
  exchangeName: text("exchange_name").notNull(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  authenticatorEnabled: boolean("authenticator_enabled").notNull().default(false),
  ownersName: text("owners_name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  userId: integer("user_id").notNull(),
  dateAdded: text("date_added").notNull(),
});

export const insertCryptoAccountSchema = createInsertSchema(cryptoAccounts).pick({
  exchangeName: true,
  email: true,
  password: true,
  authenticatorEnabled: true,
  ownersName: true,
  phoneNumber: true,
  userId: true,
  dateAdded: true,
});

export type InsertCryptoAccount = z.infer<typeof insertCryptoAccountSchema>;
export type CryptoAccount = typeof cryptoAccounts.$inferSelect;

// Extended account type with username
export type CryptoAccountWithUser = CryptoAccount & { 
  addedBy: string 
};
