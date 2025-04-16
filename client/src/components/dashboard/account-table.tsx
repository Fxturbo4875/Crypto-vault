import { useState } from "react";
import { Eye, Edit, Trash, ChevronRight, Mail, User, Phone, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CryptoAccountWithUser } from "@shared/schema";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface AccountTableProps {
  accounts: CryptoAccountWithUser[];
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

// Mobile card view for a single account
const MobileAccountCard = ({ account, onView, onEdit, onDelete }: { 
  account: CryptoAccountWithUser; 
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-3">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-primary bg-opacity-10 text-primary mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-neutral-800">{account.exchangeName}</h3>
            <p className="text-xs text-neutral-500">Added by {account.addedBy}</p>
          </div>
        </div>
        <span className={cn(
          "px-2 py-1 text-xs font-semibold rounded-full",
          account.authenticatorEnabled 
            ? "bg-green-100 text-green-800" 
            : "bg-red-100 text-red-800"
        )}>
          {account.authenticatorEnabled ? "Auth Enabled" : "Auth Disabled"}
        </span>
      </div>
      
      <div className="space-y-2 mb-3">
        <div className="flex items-center text-sm">
          <Mail className="h-4 w-4 text-neutral-400 mr-2" />
          <span className="text-neutral-600">{account.email}</span>
        </div>
        <div className="flex items-center text-sm">
          <User className="h-4 w-4 text-neutral-400 mr-2" />
          <span className="text-neutral-600">{account.ownersName}</span>
        </div>
        <div className="flex items-center text-sm">
          <Phone className="h-4 w-4 text-neutral-400 mr-2" />
          <span className="text-neutral-600">{account.phoneNumber}</span>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="sm" 
            onClick={() => onView(account.id)}
            className="text-primary"
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(account.id)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(account.id)}
          className="text-red-500"
        >
          <Trash className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  );
};

export default function AccountTable({ accounts, onView, onEdit, onDelete }: AccountTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const isMobile = useIsMobile();
  const itemsPerPage = isMobile ? 3 : 5;
  
  // Calculate pagination
  const totalPages = Math.ceil(accounts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAccounts = accounts.slice(startIndex, startIndex + itemsPerPage);
  
  // Handle pagination
  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };
  
  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (e) {
      return dateString;
    }
  };
  
  // Mobile view
  if (isMobile) {
    return (
      <div>
        {/* Column Headers */}
        <div className="grid grid-cols-6 bg-gray-100 rounded text-xs py-2 px-1 text-neutral-700 mb-2">
          <div className="font-medium">EXCHANGE</div>
          <div className="font-medium">EMAIL</div>
          <div className="font-medium">OWNER'S NAME</div>
          <div className="font-medium">PHONE</div>
          <div className="font-medium">AUTH STATUS</div>
          <div className="font-medium">ADDED BY</div>
        </div>

        {/* Accounts */}
        {paginatedAccounts.length > 0 ? (
          <div className="space-y-2">
            {paginatedAccounts.map(account => (
              <div key={account.id} className="bg-white rounded-md shadow-sm p-2 mb-1">
                <div className="grid grid-cols-6 text-xs mb-1">
                  <div className="flex items-center">
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-white text-xs mr-1">
                      {account.exchangeName.charAt(0)}
                    </div>
                    <span className="truncate">{account.exchangeName}</span>
                  </div>
                  <div className="truncate">{account.email}</div>
                  <div className="truncate">{account.ownersName}</div>
                  <div className="truncate">{account.phoneNumber}</div>
                  <div>
                    <span className={cn(
                      "text-xs px-1 py-0.5 rounded-sm font-medium",
                      account.authenticatorEnabled 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    )}>
                      {account.authenticatorEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div className="truncate">{account.addedBy}</div>
                </div>
                <div className="flex justify-end space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(account.id)}
                    className="h-6 w-6 p-0"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(account.id)}
                    className="h-6 w-6 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(account.id)}
                    className="h-6 w-6 p-0"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-sm text-center text-neutral-500">
            No accounts found
          </div>
        )}
        
        {/* Mobile Pagination */}
        {accounts.length > 0 && (
          <div className="pt-3 pb-6">
            <div className="flex items-center justify-between text-xs">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="h-6 px-2"
              >
                &lt;
              </Button>
              <p className="text-xs text-neutral-700">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, accounts.length)} of {accounts.length} accounts
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="h-6 px-2"
              >
                &gt;
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Desktop view
  return (
    <div className="bg-white rounded-md shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-100">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Exchange</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Email</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Owner's Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Phone</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Auth Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Added By</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {paginatedAccounts.length > 0 ? (
              paginatedAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-primary bg-opacity-10 text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-neutral-600">{account.exchangeName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-600">{account.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-600">{account.ownersName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-600">{account.phoneNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      account.authenticatorEnabled 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      {account.authenticatorEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                    {account.addedBy}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onView(account.id)}
                        className="text-primary hover:text-primary/80 hover:bg-primary/10"
                      >
                        <Eye className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(account.id)}
                        className="text-neutral-600 hover:text-primary hover:bg-primary/10"
                      >
                        <Edit className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(account.id)}
                        className="text-neutral-600 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash className="h-5 w-5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-neutral-500">
                  No accounts found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {accounts.length > 0 && (
        <div className="bg-white px-4 py-3 border-t border-neutral-200 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">
                Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">
                  {Math.min(startIndex + itemsPerPage, accounts.length)}
                </span> of <span className="font-medium">{accounts.length}</span> accounts
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-neutral-300 bg-white text-sm font-medium text-neutral-500 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, index) => {
                  const pageNum = index + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNum
                          ? "z-10 bg-primary text-white border-primary"
                          : "bg-white text-neutral-500 border-neutral-300 hover:bg-neutral-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-neutral-300 bg-white text-sm font-medium text-neutral-500 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
