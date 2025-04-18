import { CryptoAccountWithUser } from "@shared/schema";
import { format } from "date-fns";

const createPdfDoc = async (accounts: CryptoAccountWithUser[]) => {
  // Dynamically import jsPDF to avoid server-side rendering issues
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  
  // Create PDF document
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text("Crypto Exchange Accounts", 14, 20);
  
  // Add export date
  doc.setFontSize(10);
  doc.text(`Exported on: ${format(new Date(), "MMMM d, yyyy")}`, 14, 26);
  
  // Prepare table data
  const columns = [
    { header: 'Exchange', dataKey: 'exchangeName' },
    { header: 'Email', dataKey: 'email' },
    { header: 'Password', dataKey: 'password' },
    { header: 'Owner', dataKey: 'ownersName' },
    { header: 'Phone', dataKey: 'phoneNumber' },
    { header: 'Auth', dataKey: 'auth' },
    { header: 'Added By', dataKey: 'addedBy' },
  ];
  
  const rows = accounts.map(account => ({
    exchangeName: account.exchangeName,
    email: account.email,
    password: account.password,
    ownersName: account.ownersName,
    phoneNumber: account.phoneNumber,
    auth: account.authenticatorEnabled ? 'Enabled' : 'Disabled',
    addedBy: account.addedBy,
  }));
  
  // Generate table
  autoTable(doc, {
    startY: 30,
    head: [columns.map(col => col.header)],
    body: rows.map(row => columns.map(col => row[col.dataKey as keyof typeof row])),
    styles: { overflow: 'linebreak', cellWidth: 'auto' },
    headStyles: { fillColor: [0, 120, 212], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [240, 240, 240] },
    margin: { top: 30 },
  });
  
  return doc;
};

export const generatePDF = async (accounts: CryptoAccountWithUser[]) => {
  try {
    const doc = await createPdfDoc(accounts);
    
    // Save PDF
    const fileName = `crypto_accounts_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    doc.save(fileName);
    
    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};
