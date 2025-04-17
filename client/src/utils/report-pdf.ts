import { CryptoAccountWithUser } from "@shared/schema";
import { format } from "date-fns";

// TypeScript type for row data with status color
interface ReportRowData {
  exchangeName: string;
  email: string;
  addedBy: string;
  status: string;
  statusColor: { r: number, g: number, b: number, a: number };
}

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
      const rows: ReportRowData[] = accounts.map(account => {
        let statusText = "Unchecked";
        
        if (account.status === "good") {
          statusText = "Good";
        } else if (account.status === "bad") {
          statusText = "Bad";
        } else if (account.status === "wrong_password") {
          statusText = "Wrong Password";
        }
        
        // Add a visual indicator with Unicode box character to the status text
        const statusColor = this.getStatusColor(account.status || "unchecked");
        const formattedStatus = `■ ${statusText}`;
        
        return {
          exchangeName: account.exchangeName,
          email: account.email,
          addedBy: account.addedBy,
          status: formattedStatus,
          statusColor: statusColor,
        };
      });
      
      // Generate table with colored cells for status
      autoTable(doc, {
        startY: 30,
        head: [columns.map(col => col.header)],
        body: rows.map(row => [
          row.exchangeName,
          row.email,
          row.addedBy,
          row.status
        ]),
        styles: { overflow: 'linebreak', cellWidth: 'auto' },
        headStyles: { fillColor: [0, 120, 212], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [240, 240, 240] },
        margin: { top: 30 },
        didDrawCell: function(data) {
          // Only add coloring to the status cell (last column)
          if (data.column.index === 3 && data.section === 'body' && data.row.index !== undefined) {
            const rowIndex = data.row.index;
            if (rowIndex < rows.length) {
              const color = rows[rowIndex].statusColor;
              const statusText = rows[rowIndex].status;
              
              // Apply color indicator next to status text
              if (color) {
                // Save current fill color
                const prevFillColor = doc.getFillColor();
                
                // Set colored fill for the status indicator
                doc.setFillColor(color.r, color.g, color.b);
                
                // Draw a small colored box at the beginning of the text
                const squareSize = 4;
                const squareX = data.cell.x + 5; // Offset from left edge of cell
                const squareY = data.cell.y + data.cell.height/2 - squareSize/2; // Vertically center
                
                // Draw a colored square
                doc.rect(squareX, squareY, squareSize, squareSize, 'F');
                
                // Restore original fill color
                doc.setFillColor(prevFillColor);
              }
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
  
  static getStatusColor(status: string) {
    switch (status) {
      case "good":
        return { r: 0, g: 200, b: 83, a: 0.5 }; // Green with more visibility
      case "bad":
        return { r: 255, g: 0, b: 0, a: 0.5 }; // Red with more visibility
      case "wrong_password":
        return { r: 255, g: 191, b: 0, a: 0.5 }; // Amber with more visibility
      default:
        return { r: 200, g: 200, b: 200, a: 0.3 }; // Gray with more visibility
    }
  }
}