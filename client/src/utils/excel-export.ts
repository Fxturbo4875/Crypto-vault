import { CryptoAccountWithUser } from "@shared/schema";
import { format } from "date-fns";

const createExcelFile = async (accounts: CryptoAccountWithUser[]) => {
  // Dynamically import xlsx to avoid server-side rendering issues
  const XLSX = await import("xlsx");
  
  // Prepare data for Excel
  const data = accounts.map(account => ({
    "Exchange Name": account.exchangeName,
    "Email": account.email,
    "Password": account.password,
    "Owner's Name": account.ownersName,
    "Phone Number": account.phoneNumber,
    "Authenticator": account.authenticatorEnabled ? "Enabled" : "Disabled",
    "Added By": account.addedBy,
    "Date Added": formatDate(account.dateAdded),
  }));
  
  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Accounts");
  
  // Auto-size columns
  const colWidths = [
    { wch: 15 }, // Exchange Name
    { wch: 25 }, // Email
    { wch: 20 }, // Password
    { wch: 20 }, // Owner's Name
    { wch: 15 }, // Phone Number
    { wch: 12 }, // Authenticator
    { wch: 15 }, // Added By
    { wch: 12 }, // Date Added
  ];
  worksheet["!cols"] = colWidths;
  
  return workbook;
};

const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), "MMM d, yyyy");
  } catch (e) {
    return dateString;
  }
};

export const generateExcel = async (accounts: CryptoAccountWithUser[]) => {
  try {
    const XLSX = await import("xlsx");
    const workbook = await createExcelFile(accounts);
    
    // Generate filename
    const fileName = `crypto_accounts_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    
    // Write and download file
    XLSX.writeFile(workbook, fileName);
    
    return true;
  } catch (error) {
    console.error("Error generating Excel:", error);
    throw error;
  }
};
