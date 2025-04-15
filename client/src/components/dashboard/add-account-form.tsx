import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CryptoAccountWithUser } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// Form schema
const accountSchema = z.object({
  exchangeName: z.string().min(1, "Exchange name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  authenticatorEnabled: z.boolean().default(false),
  ownersName: z.string().min(1, "Owner's name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
});

type AccountFormValues = z.infer<typeof accountSchema>;

interface AddAccountFormProps {
  account?: CryptoAccountWithUser;
  onComplete: () => void;
}

export default function AddAccountForm({ account, onComplete }: AddAccountFormProps) {
  const { toast } = useToast();
  const isEditing = !!account;
  
  // Form setup
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      exchangeName: account?.exchangeName || "",
      email: account?.email || "",
      password: account?.password || "",
      authenticatorEnabled: account?.authenticatorEnabled || false,
      ownersName: account?.ownersName || "",
      phoneNumber: account?.phoneNumber || "",
    },
  });
  
  // Handle form submission
  const onSubmit = async (data: AccountFormValues) => {
    try {
      if (isEditing) {
        // Update existing account
        await apiRequest("PUT", `/api/accounts/${account.id}`, data);
        toast({
          title: "Success",
          description: "Account updated successfully",
        });
      } else {
        // Create new account
        await apiRequest("POST", "/api/accounts", {
          ...data,
          // userId and dateAdded will be set by the server
        });
        toast({
          title: "Success",
          description: "Account created successfully",
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      onComplete();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} account`,
        variant: "destructive",
      });
    }
  };
  
  return (
    <div>
      <DialogHeader>
        <DialogTitle className="text-lg font-medium">
          {isEditing ? "Edit Exchange Account" : "Add New Exchange Account"}
        </DialogTitle>
      </DialogHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <FormField
            control={form.control}
            name="exchangeName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Exchange Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Binance, Coinbase" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Email address used for the exchange" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Password for the exchange account" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="ownersName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Owner's Name</FormLabel>
                <FormControl>
                  <Input placeholder="Full name of the account owner" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="Phone number linked to the account" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="authenticatorEnabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Authenticator Enabled</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Enable if 2FA/Authenticator is set up for this account
                  </p>
                </div>
              </FormItem>
            )}
          />
          
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onComplete}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? "Update Account" : "Add Account"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </div>
  );
}
