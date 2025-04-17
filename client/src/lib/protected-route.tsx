import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Route, Redirect } from "wouter";
import React from "react";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType<any>;
}) {
  const { user, isLoading } = useAuth();

  const ProtectedComponent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!user) {
      return <Redirect to="/auth" />;
    }

    // Pass isAdmin flag to component
    const isAdmin = user.role === 'admin';
    return <Component isAdmin={isAdmin} />;
  };

  return <Route path={path} component={ProtectedComponent} />;
}
