import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertCryptoAccountSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// Middleware to check if user is admin
const isAdmin = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated() && req.user.role === "admin") {
    return next();
  }
  res.status(403).json({ message: "Forbidden - Admin access required" });
};

// Middleware to check if user is owner of the account or admin
const isOwnerOrAdmin = async (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const accountId = parseInt(req.params.id);
  const account = await storage.getAccountById(accountId);
  
  if (!account) {
    return res.status(404).json({ message: "Account not found" });
  }
  
  if (req.user.role === "admin" || account.userId === req.user.id) {
    return next();
  }
  
  res.status(403).json({ message: "Forbidden - You don't have permission to access this account" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // Get all accounts (for admin) or user's accounts (for regular user)
  app.get("/api/accounts", isAuthenticated, async (req, res) => {
    try {
      // The isAuthenticated middleware ensures req.user exists
      let accounts;
      if (req.user && req.user.role === "admin") {
        accounts = await storage.getAccounts();
      } else if (req.user) {
        accounts = await storage.getAccountsByUserId(req.user.id);
      } else {
        return res.status(401).json({ message: "Unauthorized" });
      }
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });
  
  // Get account by ID
  app.get("/api/accounts/:id", isOwnerOrAdmin, async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const account = await storage.getAccountById(accountId);
      
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      res.json(account);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch account" });
    }
  });
  
  // Create new account
  app.post("/api/accounts", isAuthenticated, async (req, res) => {
    try {
      // Create a modified schema without userId and dateAdded (server will set these)
      const clientAccountSchema = insertCryptoAccountSchema.omit({
        userId: true,
        dateAdded: true
      });
      
      const validation = clientAccountSchema.safeParse(req.body);
      
      if (!validation.success) {
        const errorMessage = fromZodError(validation.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      // The isAuthenticated middleware ensures req.user exists
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const newAccount = {
        ...req.body,
        userId: req.user.id,
        dateAdded: new Date().toISOString(),
      };
      
      const account = await storage.createAccount(newAccount);
      res.status(201).json(account);
    } catch (error) {
      console.error("Account creation error:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });
  
  // Update account
  app.put("/api/accounts/:id", isOwnerOrAdmin, async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const account = await storage.getAccountById(accountId);
      
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      const updatedAccount = await storage.updateAccount(accountId, req.body);
      res.json(updatedAccount);
    } catch (error) {
      res.status(500).json({ message: "Failed to update account" });
    }
  });
  
  // Delete account
  app.delete("/api/accounts/:id", isOwnerOrAdmin, async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const account = await storage.getAccountById(accountId);
      
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      const result = await storage.deleteAccount(accountId);
      
      if (result) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete account" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete account" });
    }
  });
  
  // Admin routes for user management
  
  // Get all users with account counts - admin only
  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAdminUsers();
      
      // For each user, get their accounts count
      const usersWithCounts = await Promise.all(
        users.map(async (user) => {
          const accounts = await storage.getAccountsByUserId(user.id);
          return {
            ...user,
            accountsCount: accounts.length
          };
        })
      );
      
      res.status(200).json(usersWithCounts);
    } catch (error) {
      console.error("Error getting users:", error);
      res.status(500).json({ message: "Error getting users" });
    }
  });
  
  // Delete a user - admin only
  app.delete("/api/admin/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Don't allow admin to delete themselves
      if (req.user && userId === req.user.id) {
        return res.status(400).json({ message: "Cannot delete your own admin account" });
      }
      
      // First delete all accounts associated with this user
      const userAccounts = await storage.getAccountsByUserId(userId);
      for (const account of userAccounts) {
        await storage.deleteAccount(account.id);
      }
      
      // Then delete the user
      const success = await storage.deleteUser(userId);
      
      if (success) {
        res.status(200).json({ message: "User and associated accounts deleted successfully" });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Error deleting user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
