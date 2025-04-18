import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { NotificationsProvider } from "@/hooks/use-notifications";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import UsersPage from "@/pages/users-page";
import ReportsPage from "@/pages/reports-page";
import UserReportPage from "@/pages/user-report-page";
import React from "react";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/users" component={UsersPage} />
      <ProtectedRoute path="/reports" component={(props: { isAdmin: boolean }) => props.isAdmin ? <ReportsPage /> : <UserReportPage />} />
      <ProtectedRoute path="/settings" component={Dashboard} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationsProvider>
          <Router />
          <Toaster />
        </NotificationsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
