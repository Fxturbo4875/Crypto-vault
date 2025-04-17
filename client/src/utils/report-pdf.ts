import { CryptoAccountWithUser } from "@shared/schema";
import { format } from "date-fns";

export class ReportPDF {
  static async generate(accounts: CryptoAccountWithUser[]) {
    try {
      // Dynamically import jsPDF to avoid server-side rendering issues
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      
      // Create PDF document
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.text("Crypto Exchange Accounts Report", 14, 20);
      
      // Add export date
      doc.setFontSize(10);
      doc.text(`Generated on: ${format(new Date(), "MMMM d, yyyy")}`, 14, 26);
      
      // Prepare table data
      const columns = [
        { header: 'Exchange', dataKey: 'exchangeName' },
        { header: 'Email', dataKey: 'email' },
        { header: 'Added By', dataKey: 'addedBy' },
        { header: 'Status', dataKey: 'status' },
      ];
      
      // Map accounts to rows
      const rows = accounts.map(account => ({
        exchangeName: account.exchangeName,
        email: account.email,
        addedBy: account.addedBy,
        status: account.status === "wrong_password" ? "Wrong Password" : account.status,
        statusColor: this.getStatusColor(account.status),
      }));
      
      // Generate table with colored cells for status
      autoTable(doc, {
        startY: 30,
        head: [columns.map(col => col.header)],
        body: rows.map(row => {
          // This returns an array of cells for each row
          return columns.map(col => {
            const key = col.dataKey as keyof typeof row;
            
            // If this is the status column, we'll add coloring later with didDrawCell
            if (key === 'status') {
              return row[key];
            }
            
            return row[key];
          });
        }),
        styles: { overflow: 'linebreak', cellWidth: 'auto' },
        headStyles: { fillColor: [0, 120, 212], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [240, 240, 240] },
        margin: { top: 30 },
        didDrawCell: function(data) {
          // Only add coloring to the status cell (last column)
          if (data.column.index === 3 && data.section === 'body') {
            const rowIndex = data.row.index;
            const status = rows[rowIndex].status.toLowerCase();
            const color = rows[rowIndex].statusColor;
            
            // Apply colored background to the status cell
            if (color) {
              const [r, g, b, a] = color;
              
              // Save current state
              doc.saveGraphicsState();
              
              // Set transparent colored fill
              doc.setFillColor(r, g, b);
              doc.setGlobalAlpha(a);
              
              // Draw a colored rectangle on the cell
              doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
              
              // Restore state
              doc.restoreGraphicsState();
            }
          }
        }
      });
      
      // Save PDF
      const fileName = `crypto_accounts_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(fileName);
      
      return true;
    } catch (error) {
      console.error("Error generating PDF report:", error);
      throw error;
    }
  }
  
  static getStatusColor(status: string): [number, number, number, number] {
    switch (status) {
      case "good":
        return [0, 200, 83, 0.2]; // Light green with transparency
      case "bad":
        return [255, 0, 0, 0.2]; // Light red with transparency
      case "wrong_password":
        return [255, 191, 0, 0.2]; // Light amber with transparency
      default:
        return [200, 200, 200, 0.1]; // Light gray with transparency
    }
  }
}