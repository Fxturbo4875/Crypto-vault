import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CryptoAccountWithUser } from "@shared/schema";
import { generatePDF } from "@/utils/pdf-export";
import { generateExcel } from "@/utils/excel-export";
import { useToast } from "@/hooks/use-toast";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Form schema
const exportSchema = z.object({
  format: z.enum(["pdf", "excel"]),
  dataSelection: z.enum(["all", "filtered"]),
  exchangeFilter: z.string(),
  authFilter: z.string(),
  userFilter: z.string(),
});

type ExportFormValues = z.infer<typeof exportSchema>;

interface ExportOptionsProps {
  accounts: CryptoAccountWithUser[];
  filteredAccounts: CryptoAccountWithUser[];
  onClose: () => void;
}

export default function ExportOptions({ accounts, filteredAccounts, onClose }: ExportOptionsProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  
  // Get unique exchanges and users for filters
  const exchanges = accounts
    .map(account => account.exchangeName)
    .filter((value, index, self) => self.indexOf(value) === index);
  const users = accounts
    .map(account => account.addedBy)
    .filter((value, index, self) => self.indexOf(value) === index);
  
  // Form setup
  const form = useForm<ExportFormValues>({
    resolver: zodResolver(exportSchema),
    defaultValues: {
      format: "pdf",
      dataSelection: "all",
      exchangeFilter: "all",
      authFilter: "all",
      userFilter: "all",
    },
  });
  
  // Handle form submission
  const onSubmit = async (data: ExportFormValues) => {
    setIsExporting(true);
    
    try {
      // Choose between all accounts or filtered accounts
      let exportData = data.dataSelection === "all" ? [...accounts] : [...filteredAccounts];
      
      // Apply additional filters if selected
      if (data.dataSelection === "filtered" && (data.exchangeFilter !== "all" || data.authFilter !== "all" || data.userFilter !== "all")) {
        if (data.exchangeFilter && data.exchangeFilter !== "all") {
          exportData = exportData.filter(account => account.exchangeName === data.exchangeFilter);
        }
        
        if (data.authFilter && data.authFilter !== "all") {
          exportData = exportData.filter(account => {
            if (data.authFilter === "true") return account.authenticatorEnabled;
            if (data.authFilter === "false") return !account.authenticatorEnabled;
            return true;
          });
        }
        
        if (data.userFilter && data.userFilter !== "all") {
          exportData = exportData.filter(account => account.addedBy === data.userFilter);
        }
      }
      
      if (exportData.length === 0) {
        toast({
          title: "No data to export",
          description: "There are no accounts matching your filter criteria.",
          variant: "destructive",
        });
        setIsExporting(false);
        return;
      }
      
      // Generate export based on selected format
      if (data.format === "pdf") {
        await generatePDF(exportData);
      } else {
        await generateExcel(exportData);
      }
      
      toast({
        title: "Export successful",
        description: `Accounts have been exported as ${data.format.toUpperCase()}.`,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Export failed",
        description: "An error occurred during export.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  const dataSelection = form.watch("dataSelection");
  
  return (
    <div>
      <DialogHeader>
        <DialogTitle className="text-lg font-medium">Export Options</DialogTitle>
      </DialogHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-4">
          <FormField
            control={form.control}
            name="format"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Export Format</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex space-x-6"
                  >
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <RadioGroupItem value="pdf" />
                      </FormControl>
                      <FormLabel className="font-normal">PDF</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <RadioGroupItem value="excel" />
                      </FormControl>
                      <FormLabel className="font-normal">Excel</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="dataSelection"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Data Selection</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex space-x-6"
                  >
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <RadioGroupItem value="all" />
                      </FormControl>
                      <FormLabel className="font-normal">All Accounts ({accounts.length})</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <RadioGroupItem value="filtered" />
                      </FormControl>
                      <FormLabel className="font-normal">Currently Visible Accounts ({filteredAccounts.length})</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {dataSelection === "filtered" && (
            <div className="space-y-4 border rounded-md p-4">
              <h3 className="font-medium text-sm">Additional Filters for Visible Accounts</h3>
              <p className="text-xs text-muted-foreground">These filters will be applied to the currently visible accounts.</p>
              
              <FormField
                control={form.control}
                name="exchangeFilter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exchange</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="All Exchanges" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">All Exchanges</SelectItem>
                        {exchanges.map(exchange => (
                          <SelectItem key={exchange} value={exchange}>{exchange}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="authFilter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Auth Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="All Auth Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">All Auth Status</SelectItem>
                        <SelectItem value="true">Authenticator Enabled</SelectItem>
                        <SelectItem value="false">Authenticator Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="userFilter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Added By</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="All Users" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        {users.map(user => (
                          <SelectItem key={user} value={user}>{user}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
          
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isExporting}>
              {isExporting ? "Exporting..." : "Export"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </div>
  );
}
