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
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-primary text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h1 className="font-bold text-xl">Crypto Exchange Account Manager</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span>{user?.username}</span>
              <span className="bg-white text-primary text-xs px-2 py-1 rounded-full font-medium">
                {user?.role === "admin" ? "Admin" : "User"}
              </span>
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => logoutMutation.mutate()}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="container mx-auto">
            {/* Page Header */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
              <h2 className="text-2xl font-bold text-neutral-600 mb-2 md:mb-0">Exchange Accounts</h2>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <Button onClick={() => setIsAddAccountOpen(true)}>
                  <PlusCircle className="h-5 w-5 mr-1" />
                  Add Account
                </Button>
                <Button variant="outline" onClick={() => setIsExportOptionsOpen(true)}>
                  <FileDown className="h-5 w-5 mr-1" />
                  Export
                </Button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="mb-6 bg-white p-4 rounded-md shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Input
                      placeholder="Search accounts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                    <Search className="h-5 w-5 text-neutral-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <Select value={exchangeFilter} onValueChange={setExchangeFilter}>
                    <SelectTrigger className="w-[180px]">
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
                    <SelectTrigger className="w-[180px]">
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
                      <SelectTrigger className="w-[180px]">
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
              </div>
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
