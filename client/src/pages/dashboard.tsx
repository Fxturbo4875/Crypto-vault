import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/dashboard/sidebar";
import AccountTable from "@/components/dashboard/account-table";
import AddAccountForm from "@/components/dashboard/add-account-form";
import ExportOptions from "@/components/dashboard/export-options";
import ViewAccount from "@/components/dashboard/view-account";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CryptoAccountWithUser } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, PlusCircle, FileDown } from "lucide-react";

export default function Dashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  
  // State
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isViewAccountOpen, setIsViewAccountOpen] = useState(false);
  const [isExportOptionsOpen, setIsExportOptionsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [exchangeFilter, setExchangeFilter] = useState("all");
  const [authFilter, setAuthFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  
  // Fetch accounts
  const { data: accounts, isLoading, isError } = useQuery<CryptoAccountWithUser[]>({
    queryKey: ["/api/accounts"],
    refetchOnWindowFocus: true,
  });
  
  // Selected account
  const selectedAccount = accounts?.find(account => account.id === selectedAccountId);
  
  // Filter accounts
  const filteredAccounts = accounts?.filter(account => {
    const matchesSearch = 
      searchQuery === "" || 
      account.exchangeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.ownersName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.phoneNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesExchange = exchangeFilter === "all" || account.exchangeName === exchangeFilter;
    const matchesAuth = authFilter === "all" || 
      (authFilter === "true" && account.authenticatorEnabled) ||
      (authFilter === "false" && !account.authenticatorEnabled);
    const matchesUser = userFilter === "all" || account.addedBy === userFilter;
    
    return matchesSearch && matchesExchange && matchesAuth && matchesUser;
  });
  
  // Get unique exchanges and users for filters
  const exchanges = (accounts || [])
    .map(account => account.exchangeName)
    .filter((value, index, self) => self.indexOf(value) === index);
  const users = (accounts || [])
    .map(account => account.addedBy)
    .filter((value, index, self) => self.indexOf(value) === index);
  
  // Handle delete account
  const handleDeleteAccount = async () => {
    if (!selectedAccountId) return;
    
    try {
      await apiRequest("DELETE", `/api/accounts/${selectedAccountId}`);
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      setIsDeleteDialogOpen(false);
      toast({
        title: "Success",
        description: "Account has been deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-blue-300">
      {/* Header */}
      <header className="bg-primary text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <Sidebar />
            <div className="flex items-center">
              <span className="text-lg font-medium">
                {user?.username}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => logoutMutation.mutate()}
              className="text-white border-white hover:bg-white/20 text-xs"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop Sidebar (rendered within Sidebar component) */}

        {/* Main Content */}
        <main className="flex-1 px-3 py-4 pb-20 md:pb-6 max-w-full">
          <div className="container mx-auto max-w-full">
            {/* Page Header */}
            <div className="mb-3">
              <h2 className="text-lg font-medium text-neutral-800">Exchange Accounts</h2>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 mb-3">
              <Button 
                onClick={() => setIsAddAccountOpen(true)}
                variant="outline"
                size="sm"
                className="bg-white hover:bg-white/90 text-neutral-800 border-neutral-200 text-xs px-3"
              >
                <PlusCircle className="h-4 w-4 mr-1" />
                Add Account
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsExportOptionsOpen(true)}
                size="sm"
                className="bg-white hover:bg-white/90 text-neutral-800 border-neutral-200 text-xs px-3"
              >
                <FileDown className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>

            {/* Search Bar */}
            <div className="mb-3">
              <div className="relative">
                <Input
                  placeholder="Search accounts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white border-neutral-200 text-sm py-4"
                />
                <Search className="h-4 w-4 text-neutral-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            {/* Filter Controls */}
            <div className="mb-4 space-y-2">
              <Select value={exchangeFilter} onValueChange={setExchangeFilter}>
                <SelectTrigger className="w-full bg-white border-neutral-200 text-sm">
                  <SelectValue placeholder="All Exchanges" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Exchanges</SelectItem>
                  {exchanges.map(exchange => (
                    <SelectItem key={exchange} value={exchange}>{exchange}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={authFilter} onValueChange={setAuthFilter}>
                <SelectTrigger className="w-full bg-white border-neutral-200 text-sm">
                  <SelectValue placeholder="Auth Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Auth Status</SelectItem>
                  <SelectItem value="true">Authenticator Enabled</SelectItem>
                  <SelectItem value="false">Authenticator Disabled</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Admin only filter */}
              {user?.role === "admin" && (
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="w-full bg-white border-neutral-200 text-sm">
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {users.map(username => (
                      <SelectItem key={username} value={username}>{username}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Accounts List */}
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : isError ? (
              <div className="bg-red-50 p-4 rounded-md text-red-600">
                Failed to load accounts. Please try again.
              </div>
            ) : (
              <AccountTable 
                accounts={filteredAccounts || []}
                onView={(id) => {
                  setSelectedAccountId(id);
                  setIsViewAccountOpen(true);
                }}
                onEdit={(id) => {
                  setSelectedAccountId(id);
                  setIsAddAccountOpen(true);
                }}
                onDelete={(id) => {
                  setSelectedAccountId(id);
                  setIsDeleteDialogOpen(true);
                }}
              />
            )}
          </div>
        </main>
      </div>

      {/* Add/Edit Account Modal */}
      <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
        <DialogContent className="sm:max-w-lg">
          <AddAccountForm 
            account={selectedAccount} 
            onComplete={() => {
              setIsAddAccountOpen(false);
              setSelectedAccountId(null);
              queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* View Account Modal */}
      <Dialog open={isViewAccountOpen} onOpenChange={setIsViewAccountOpen}>
        <DialogContent className="sm:max-w-lg">
          {selectedAccount && (
            <ViewAccount 
              account={selectedAccount} 
              onEdit={() => {
                setIsViewAccountOpen(false);
                setIsAddAccountOpen(true);
              }}
              onClose={() => {
                setIsViewAccountOpen(false);
                setSelectedAccountId(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Export Options Modal */}
      <Dialog open={isExportOptionsOpen} onOpenChange={setIsExportOptionsOpen}>
        <DialogContent className="sm:max-w-lg">
          <ExportOptions 
            accounts={filteredAccounts || []}
            onClose={() => setIsExportOptionsOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this account? All of the data will be permanently removed.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
