import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Notification } from "@shared/schema";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";

type NotificationsContextType = {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: number) => void;
  deleteNotification: (id: number) => void;
};

const NotificationsContext = createContext<NotificationsContextType | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<WebSocket | null>(null);

  // Fetch notifications from API
  const { data: notifications = [], isLoading, refetch } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  // Calculate unread notifications count
  const unreadCount = notifications.filter(notification => !notification.isRead).length;

  // Setup WebSocket connection for real-time notifications
  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    // Close any existing connection
    if (socket) {
      socket.close();
    }

    const ws = new WebSocket(wsUrl);
    setSocket(ws);

    ws.onopen = () => {
      console.log("WebSocket connection established");
      // Send authentication message with user ID
      ws.send(JSON.stringify({
        type: "auth",
        userId: user.id
      }));
    };

    ws.onmessage = (event) => {
      try {
        console.log("WebSocket message received:", event.data);
        const data = JSON.parse(event.data);
        
        if (data.type === "notification") {
          // Single new notification
          toast({
            title: data.notification.title,
            description: data.notification.message,
            variant: data.notification.type === "error" ? "destructive" : "default",
          });
          
          // Update notifications in the cache
          queryClient.setQueryData(["/api/notifications"], (oldData: Notification[] | undefined) => {
            if (!oldData) return [data.notification];
            return [data.notification, ...oldData];
          });
          
          // Force a refetch to ensure we have the server-generated ID and other fields
          refetch();
        } else if (data.type === "notifications") {
          // Initial unread notifications batch
          if (data.notifications.length > 0) {
            toast({
              title: "Unread Notifications",
              description: `You have ${data.notifications.length} unread notifications`,
            });
            
            // Force refetch to get the full list
            refetch();
          }
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    };

    ws.onclose = (event) => {
      console.log("WebSocket connection closed", event.code, event.reason);
      
      // Try to reconnect if the connection was closed unexpectedly
      // and user is still logged in
      if (event.code !== 1000 && user) {
        setTimeout(() => {
          console.log("Attempting to reconnect WebSocket...");
          // The effect will run again and reconnect
          setSocket(null);
        }, 3000);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      ws.close();
    };
  }, [user, toast, queryClient, refetch, socket === null]);

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PUT", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (error) => {
      console.error("Error marking notification as read:", error);
    }
  });

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (error) => {
      console.error("Error deleting notification:", error);
    }
  });

  const markAsRead = (id: number) => {
    markAsReadMutation.mutate(id);
  };

  const deleteNotification = (id: number) => {
    deleteNotificationMutation.mutate(id);
  };

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return context;
}