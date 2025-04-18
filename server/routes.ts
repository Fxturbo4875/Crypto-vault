import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertCryptoAccountSchema, insertNotificationSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { WebSocketServer, WebSocket } from "ws";

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
      
      // Create a notification for the account owner when status is updated
      // but only if the update contains a status change and the updater is not the owner
      if (req.body.status && account.userId !== req.user?.id) {
        const statusMap: Record<string, string> = {
          good: "Good",
          bad: "Bad",
          wrong_password: "Wrong Password",
          unchecked: "Unchecked"
        };
        const statusText = statusMap[req.body.status] || req.body.status;
        
        // Create a notification for the account owner
        await storage.createNotification({
          userId: account.userId,
          title: "Account Status Updated",
          message: `Your ${account.exchangeName} account status was updated to "${statusText}".`,
          type: req.body.status === "good" ? "success" : 
                req.body.status === "bad" ? "error" : 
                req.body.status === "wrong_password" ? "warning" : "info",
          isRead: false
        });
        
        // Send a real-time notification to connected clients
        const userConnections = clients.get(account.userId);
        if (userConnections && userConnections.length > 0) {
          const notification = {
            id: Date.now(), // Temporary ID that will be replaced when client refreshes
            userId: account.userId,
            title: "Account Status Updated",
            message: `Your ${account.exchangeName} account status was updated to "${statusText}".`,
            type: req.body.status === "good" ? "success" : 
                  req.body.status === "bad" ? "error" : 
                  req.body.status === "wrong_password" ? "warning" : "info",
            isRead: false,
            createdAt: new Date()
          };
          
          const message = JSON.stringify({
            type: 'notification',
            notification
          });
          
          userConnections.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(message);
            }
          });
        }
      }
      
      res.json(updatedAccount);
    } catch (error) {
      console.error("Error updating account:", error);
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

  // Notification routes
  
  // Get user's notifications
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const notifications = await storage.getNotificationsByUserId(req.user.id);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });
  
  // Create notification 
  // Note: This is typically called from the server to create notifications
  // for users, but we expose it as an API for testing
  app.post("/api/notifications", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validation = insertNotificationSchema.safeParse(req.body);
      
      if (!validation.success) {
        const errorMessage = fromZodError(validation.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      const notification = await storage.createNotification(validation.data);
      res.status(201).json(notification);
    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(500).json({ message: "Failed to create notification" });
    }
  });
  
  // Mark notification as read
  app.put("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const result = await storage.markNotificationAsRead(notificationId);
      
      if (result) {
        res.status(200).json({ success: true });
      } else {
        res.status(404).json({ message: "Notification not found" });
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });
  
  // Delete notification
  app.delete("/api/notifications/:id", isAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const result = await storage.deleteNotification(notificationId);
      
      if (result) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Notification not found" });
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  const httpServer = createServer(app);
  
  // Setup WebSocket server for real-time notifications
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store active connections by userId
  const clients = new Map<number, WebSocket[]>();
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    // Handle auth message from client to identify the user
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'auth' && data.userId) {
          const userId = parseInt(data.userId);
          
          // Add client to the connections map
          if (!clients.has(userId)) {
            clients.set(userId, []);
          }
          clients.get(userId)?.push(ws);
          
          console.log(`User ${userId} authenticated on WebSocket`);
          
          // Send initial unread notifications
          (async () => {
            const notifications = await storage.getNotificationsByUserId(userId);
            const unreadNotifications = notifications.filter(n => !n.isRead);
            
            if (unreadNotifications.length > 0) {
              ws.send(JSON.stringify({
                type: 'notifications',
                notifications: unreadNotifications
              }));
            }
          })();
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    // Handle client disconnect
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      
      // Remove the connection from all users (we don't track which user it belonged to)
      clients.forEach((connections, userId) => {
        const index = connections.indexOf(ws);
        if (index !== -1) {
          connections.splice(index, 1);
          if (connections.length === 0) {
            clients.delete(userId);
          }
        }
      });
    });
  });
  
  // Modify createReportNotification to also send the notification via WebSocket
  const createReportNotification = async (userId: number, reportType: string) => {
    try {
      const notification = await storage.createNotification({
        userId,
        title: "Report Ready",
        message: `Your ${reportType} report is ready to view and download.`,
        type: "success",
        isRead: false
      });
      
      // Send notification to connected clients
      const userConnections = clients.get(userId);
      if (userConnections && userConnections.length > 0) {
        const message = JSON.stringify({
          type: 'notification',
          notification
        });
        
        userConnections.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        });
      }
      
      return notification;
    } catch (error) {
      console.error("Error creating report notification:", error);
      return null;
    }
  };
  
  return httpServer;
}
