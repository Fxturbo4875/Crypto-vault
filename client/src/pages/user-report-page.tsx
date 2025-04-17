import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CryptoAccountWithUser } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Search, FileDown, Check, X, AlertTriangle } from "lucide-react";
import Sidebar from "@/components/dashboard/fixed-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { AuthThemeToggle } from "@/components/ui/auth-theme-toggle";
import { ReportPDF } from "@/utils/report-pdf";

export default function UserReportPage() {
  const { toast } = useToast();
  const { user, logoutMutation } = useAuth();
  
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [exchangeFilter, setExchangeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  
  // Fetch accounts for the current user only
  const { data: accounts = [], isLoading } = useQuery<CryptoAccountWithUser[]>({
    queryKey: ["/api/accounts"],
    refetchOnWindowFocus: true,
    select: (data) => data.filter(account => account.addedBy === user?.username)
  });
  
  // Filter accounts
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = 
      searchQuery === "" || 
      account.exchangeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesExchange = exchangeFilter === "all" || account.exchangeName === exchangeFilter;
    const matchesStatus = statusFilter === "all" || account.status === statusFilter;
    
    return matchesSearch && matchesExchange && matchesStatus;
  });
  
  // Get unique exchanges for filters
  const exchanges = accounts
    .map(account => account.exchangeName)
    .filter((value, index, self) => self.indexOf(value) === index);
  
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

  const getStatusText = (status: string) => {
    switch (status) {
      case "good":
        return "Good";
      case "bad":
        return "Bad";
      case "wrong_password":
        return "Wrong Password";
      case "unchecked":
      default:
        return "Unchecked";
    }
  };
  
  const handleExport = (statusFilter: string) => {
    try {
      // Filter accounts based on status
      let exportData = [...accounts];
      
      if (statusFilter !== "all") {
        exportData = accounts.filter(account => account.status === statusFilter);
      }
      
      if (exportData.length === 0) {
        toast({
          title: "No data to export",
          description: "There are no accounts matching the selected status.",
          variant: "destructive",
        });
        return;
      }
      
      // Generate PDF report
      ReportPDF.generate(exportData);
      
      toast({
        title: "Export successful",
        description: "Report has been exported as PDF.",
      });
      
      setIsExportDialogOpen(false);
    } catch (error) {
      toast({
        title: "Export failed",
        description: "An error occurred during export.",
        variant: "destructive",
      });
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
          
          <div className="flex items-center space-x-2">
            <AuthThemeToggle />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => logoutMutation.mutate()}
              className="bg-white text-primary border-white hover:bg-white/90 hover:text-primary text-xs font-medium"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">My Account Reports</h1>
            <Button 
              onClick={() => setIsExportDialogOpen(true)} 
              className="flex items-center gap-2"
            >
              <FileDown className="h-4 w-4" />
              Export Report
            </Button>
          </div>
          
          <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-2">
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
          </div>
          
          <div className="bg-card rounded-md shadow overflow-hidden flex flex-col h-[calc(100vh-260px)]">
            <div className="overflow-y-auto overflow-x-auto flex-grow">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10 bg-card">
                  <tr className="border-b transition-colors">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[100px] md:w-auto">Exchange</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[120px] md:w-auto">Email</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[120px] md:w-auto">Owner</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[100px] md:w-auto">Status</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[100px] md:w-auto">Date Added</th>
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
                        <td className="p-4 align-middle whitespace-nowrap">{account.ownersName}</td>
                        <td className="p-4 align-middle">
                          <div className="flex items-center whitespace-nowrap">
                            {getStatusIcon(account.status)}
                            <span className="ml-1 capitalize truncate text-xs md:text-sm">
                              {getStatusText(account.status)}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 align-middle whitespace-nowrap">{account.dateAdded}</td>
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
              
              <div>
                <h3 className="text-sm font-medium mb-2">Export Options</h3>
                <div className="grid grid-cols-1 gap-2">
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => handleExport(statusFilter)}
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Export with Selected Filters
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => handleExport("good")}
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Export Good Accounts
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => handleExport("bad")}
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Export Bad Accounts
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => handleExport("wrong_password")}
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Export Wrong Password Accounts
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => handleExport("unchecked")}
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Export Unchecked Accounts
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