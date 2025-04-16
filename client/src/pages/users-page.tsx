import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, AlertCircle, Users as UsersIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

// Extend User type to include account count
type UserWithAccounts = User & {
  accountsCount: number;
};

export default function UsersPage() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [userToDelete, setUserToDelete] = useState<UserWithAccounts | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Redirect if not admin
  if (user?.role !== "admin") {
    setLocation("/dashboard");
    return null;
  }

  // Fetch users with their account counts
  const { 
    data: users = [], 
    isLoading, 
    isError 
  } = useQuery<UserWithAccounts[]>({
    queryKey: ["/api/admin/users"],
    enabled: user?.role === "admin"
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest(`/api/admin/users/${userId}`, {
        method: "DELETE"
      } as any);
    },
    onSuccess: () => {
      toast({
        title: "User deleted",
        description: "User and their accounts have been successfully deleted.",
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const handleDeleteUser = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id);
    }
  };

  const openDeleteDialog = (user: UserWithAccounts) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-10 w-10 mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error Loading Users</h2>
        <p className="text-neutral-600 mb-4">
          There was a problem fetching the user data. Please try again.
        </p>
        <Button
          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] })}
        >
          Retry
        </Button>
      </div>
    );
  }

  // Mobile view
  if (isMobile) {
    return (
      <div className="p-4 pb-32">
        <div className="mb-4">
          <h2 className="text-lg font-semibold flex items-center">
            <UsersIcon className="h-5 w-5 mr-2" />
            User Management
          </h2>
          <p className="text-sm text-neutral-500">
            Manage registered users and their accounts
          </p>
        </div>

        {users && users.length > 0 ? (
          <div className="space-y-3">
            {users.map((user: UserWithAccounts) => (
              <div 
                key={user.id} 
                className="bg-white rounded-md shadow-sm p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium">{user.username}</h3>
                    <Badge 
                      className={user.role === "admin" ? "bg-primary" : "bg-neutral-500"}
                    >
                      {user.role}
                    </Badge>
                  </div>
                  {user.id !== user?.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => openDeleteDialog(user)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="text-sm text-neutral-600">
                  <p>User ID: {user.id}</p>
                  <p>Accounts: {user.accountsCount}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-sm text-center text-neutral-500">
            No users found
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {userToDelete?.username}? This will also delete all 
                their accounts ({userToDelete?.accountsCount}). This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteUser}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteUserMutation.isPending}
              >
                {deleteUserMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Desktop view
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold flex items-center">
          <UsersIcon className="h-6 w-6 mr-2" />
          User Management
        </h2>
        <p className="text-neutral-500">
          View and manage registered users and their accounts
        </p>
      </div>

      {users && users.length > 0 ? (
        <div className="bg-white rounded-md shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Accounts</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user: UserWithAccounts) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>
                    <Badge 
                      className={user.role === "admin" ? "bg-primary" : "bg-neutral-500"}
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.accountsCount}</TableCell>
                  <TableCell className="text-right">
                    {user.id !== user?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => openDeleteDialog(user)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-sm text-center text-neutral-500">
          No users found
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {userToDelete?.username}? This will also delete all 
              their accounts ({userToDelete?.accountsCount}). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}