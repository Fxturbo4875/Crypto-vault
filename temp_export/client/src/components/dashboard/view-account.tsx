import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CryptoAccountWithUser } from "@shared/schema";

interface ViewAccountProps {
  account: CryptoAccountWithUser;
  onEdit: () => void;
  onClose: () => void;
}

interface AccountDetailItemProps {
  label: string;
  value: React.ReactNode;
}

const AccountDetailItem = ({ label, value }: AccountDetailItemProps) => (
  <div>
    <p className="text-sm font-medium text-neutral-500">{label}:</p>
    <p className="text-sm text-neutral-600 mt-1">{value}</p>
  </div>
);

export default function ViewAccount({ account, onEdit, onClose }: ViewAccountProps) {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (e) {
      return dateString;
    }
  };
  
  return (
    <div>
      <DialogHeader>
        <DialogTitle className="text-lg font-medium">Account Details</DialogTitle>
      </DialogHeader>
      
      <div className="mt-4 space-y-4">
        <div className="bg-neutral-50 p-4 rounded-md">
          <div className="grid grid-cols-2 gap-4">
            <AccountDetailItem label="Exchange Name" value={account.exchangeName} />
            <AccountDetailItem label="Email" value={account.email} />
            <AccountDetailItem label="Password" value={account.password} />
            <AccountDetailItem 
              label="Authenticator" 
              value={
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  account.authenticatorEnabled 
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
                }`}>
                  {account.authenticatorEnabled ? "Enabled" : "Disabled"}
                </span>
              } 
            />
            <AccountDetailItem label="Owner's Name" value={account.ownersName} />
            <AccountDetailItem label="Phone Number" value={account.phoneNumber} />
            <AccountDetailItem label="Added By" value={account.addedBy} />
            <AccountDetailItem label="Date Added" value={formatDate(account.dateAdded)} />
          </div>
        </div>
      </div>
      
      <DialogFooter className="mt-6">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button onClick={onEdit}>
          Edit
        </Button>
      </DialogFooter>
    </div>
  );
}
