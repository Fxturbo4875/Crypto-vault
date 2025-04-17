import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CryptoAccountWithUser } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReportPDF } from "@/utils/report-pdf";
import { Search, FileDown, Check, X, AlertTriangle } from "lucide-react";
import Sidebar from "@/components/dashboard/fixed-sidebar";
import { useAuth } from "@/hooks/use-auth";

export default function ReportsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [exchangeFilter, setExchangeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  
  // Fetch accounts
  const { data: accounts = [], isLoading } = useQuery<CryptoAccountWithUser[]>({
    queryKey: ["/api/accounts"],
    refetchOnWindowFocus: true,
  });
  
  // Update account status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({id, status}: {id: number, status: string}) => {
      return apiRequest("PUT", `/api/accounts/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      toast({
        title: "Status updated",
        description: "Account status has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update account status",
        variant: "destructive",
      });
    }
  });
  
  // Filter accounts
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = 
      searchQuery === "" || 
      account.exchangeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.addedBy.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesExchange = exchangeFilter === "all" || account.exchangeName === exchangeFilter;
    const matchesStatus = statusFilter === "all" || account.status === statusFilter;
    const matchesUser = userFilter === "all" || account.addedBy === userFilter;
    
    return matchesSearch && matchesExchange && matchesStatus && matchesUser;
  });
  
  // Get unique exchanges, users and statuses for filters
  const exchanges = accounts
    .map(account => account.exchangeName)
    .filter((value, index, self) => self.indexOf(value) === index);
  
  const users = accounts
    .map(account => account.addedBy)
    .filter((value, index, self) => self.indexOf(value) === index);
  
  const handleStatusChange = (accountId: number, status: string) => {
    updateStatusMutation.mutate({ id: accountId, status });
  };
  
  const handleExport = (exportFormat: string, exportFilter: string) => {
    // Determine which accounts to export based on filter
    let exportData = [...accounts];
    
    if (exportFilter === "current") {
      exportData = [...filteredAccounts];
    } else if (exportFilter === "good") {
      exportData = accounts.filter(account => account.status === "good");
    } else if (exportFilter === "bad") {
      exportData = accounts.filter(account => account.status === "bad");
    } else if (exportFilter === "wrong_password") {
      exportData = accounts.filter(account => account.status === "wrong_password");
    }
    
    // Generate PDF report
    if (exportFormat === "pdf") {
      ReportPDF.generate(exportData);
      toast({
        title: "Export successful",
        description: "Report has been exported as PDF.",
      });
    }
    
    setIsExportDialogOpen(false);
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "good":
        return <Check className="h-5 w-5 text-green-500" />;
      case "bad":
        return <X className="h-5 w-5 text-red-500" />;
      case "wrong_password":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "unchecked":
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-400" />;
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <Sidebar />
            <span className="text-lg font-medium ml-2">
              {user?.username}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Account Reports</h1>
            <Button 
              onClick={() => setIsExportDialogOpen(true)} 
              className="flex items-center gap-2"
            >
              <FileDown className="h-4 w-4" />
              Export Report
            </Button>
          </div>
          
          <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-2">
            <div className="relative">
              <Input
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
            
            <Select value={exchangeFilter} onValueChange={setExchangeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Exchanges" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Exchanges</SelectItem>
                {exchanges.map(exchange => (
                  <SelectItem key={exchange} value={exchange}>{exchange}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="bad">Bad</SelectItem>
                <SelectItem value="wrong_password">Wrong Password</SelectItem>
                <SelectItem value="unchecked">Unchecked</SelectItem>
              </SelectContent>
            </Select>
            
            {user?.role === "admin" && (
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger>
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
          
          <div className="bg-card rounded-md shadow overflow-hidden flex flex-col h-[calc(100vh-260px)]">
            <div className="overflow-y-auto overflow-x-auto flex-grow">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10 bg-card">
                  <tr className="border-b transition-colors">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[100px] md:w-auto">Exchange</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[120px] md:w-auto">Email</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[80px] md:w-auto hidden md:table-cell">Added By</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[100px] md:w-auto">Status</th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground w-[120px] md:w-auto">Actions</th>
                  </tr>
                </thead>
                <tbody className="overflow-y-auto">
                  {isLoading ? (
                    <tr className="border-b transition-colors">
                      <td className="p-4 align-middle text-center py-8" colSpan={5}>
                        Loading accounts...
                      </td>
                    </tr>
                  ) : filteredAccounts.length === 0 ? (
                    <tr className="border-b transition-colors">
                      <td className="p-4 align-middle text-center py-8" colSpan={5}>
                        No accounts found.
                      </td>
                    </tr>
                  ) : (
                    filteredAccounts.map(account => (
                      <tr key={account.id} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 align-middle font-medium whitespace-nowrap">{account.exchangeName}</td>
                        <td className="p-4 align-middle whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">{account.email}</td>
                        <td className="p-4 align-middle hidden md:table-cell">{account.addedBy}</td>
                        <td className="p-4 align-middle">
                          <div className="flex items-center whitespace-nowrap">
                            {getStatusIcon(account.status)}
                            <span className="ml-1 capitalize truncate text-xs md:text-sm">
                              {account.status === "wrong_password" ? "Wrong Pass" : account.status}
                            </span>
                          </div>
                        </td>
                        <td className="p-2 md:p-4 align-middle">
                          <div className="flex flex-col md:flex-row justify-end items-end md:items-center gap-1 md:gap-2">
                            <div className="flex items-center gap-1">
                              <Checkbox 
                                checked={account.status === "good"}
                                id={`good-${account.id}`}
                                className="border-green-500 data-[state=checked]:bg-green-500 h-3 w-3 md:h-4 md:w-4"
                                onCheckedChange={(checked) => {
                                  if (checked) handleStatusChange(account.id, "good");
                                }}
                              />
                              <label htmlFor={`good-${account.id}`} className="text-xs md:text-sm text-green-600">Good</label>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Checkbox 
                                checked={account.status === "bad"}
                                id={`bad-${account.id}`}
                                className="border-red-500 data-[state=checked]:bg-red-500 h-3 w-3 md:h-4 md:w-4"
                                onCheckedChange={(checked) => {
                                  if (checked) handleStatusChange(account.id, "bad");
                                }}
                              />
                              <label htmlFor={`bad-${account.id}`} className="text-xs md:text-sm text-red-600">Bad</label>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Checkbox 
                                checked={account.status === "wrong_password"}
                                id={`wrong-${account.id}`}
                                className="border-amber-500 data-[state=checked]:bg-amber-500 h-3 w-3 md:h-4 md:w-4"
                                onCheckedChange={(checked) => {
                                  if (checked) handleStatusChange(account.id, "wrong_password");
                                }}
                              />
                              <label htmlFor={`wrong-${account.id}`} className="text-xs md:text-sm text-amber-600">WPass</label>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Export Report</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Export Filters</h3>
                <div className="grid grid-cols-1 gap-2">
                  <Select value={exchangeFilter} onValueChange={(value) => setExchangeFilter(value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Exchange" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Exchanges</SelectItem>
                      {exchanges.map(exchange => (
                        <SelectItem key={exchange} value={exchange}>{exchange}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {user?.role === "admin" && (
                    <Select value={userFilter} onValueChange={(value) => setUserFilter(value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select User" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        {users.map(username => (
                          <SelectItem key={username} value={username}>{username}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="good">Good Accounts</SelectItem>
                      <SelectItem value="bad">Bad Accounts</SelectItem>
                      <SelectItem value="wrong_password">Wrong Password Accounts</SelectItem>
                      <SelectItem value="unchecked">Unchecked Accounts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="pt-2">
                <h3 className="text-sm font-medium mb-2">Export Options</h3>
                <div className="grid grid-cols-1 gap-2">
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => {
                      // Apply current filters to the export
                      let exportData = [...accounts];
                      
                      if (exchangeFilter !== "all") {
                        exportData = exportData.filter(account => account.exchangeName === exchangeFilter);
                      }
                      
                      if (userFilter !== "all") {
                        exportData = exportData.filter(account => account.addedBy === userFilter);
                      }
                      
                      if (statusFilter !== "all") {
                        exportData = exportData.filter(account => account.status === statusFilter);
                      }
                      
                      ReportPDF.generate(exportData);
                      toast({
                        title: "Export successful",
                        description: "Report has been exported as PDF.",
                      });
                      setIsExportDialogOpen(false);
                    }}
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Export with Selected Filters
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => handleExport("pdf", "current")}
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Export Current Visible Accounts
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => handleExport("pdf", "all")}
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Export All Accounts
                  </Button>
                </div>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => setIsExportDialogOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}