import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  Menu,
  X 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const SidebarItem = ({ icon, label, active, onClick }: SidebarItemProps) => {
  return (
    <li>
      <button
        onClick={onClick}
        className={cn(
          "flex items-center space-x-3 px-4 py-3 rounded-md w-full text-left",
          active 
            ? "bg-primary text-white" 
            : "text-neutral-600 hover:bg-neutral-100"
        )}
      >
        {icon}
        <span>{label}</span>
      </button>
    </li>
  );
};

const MobileNavItem = ({ icon, label, active, onClick }: SidebarItemProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center w-full py-4",
        active ? "text-primary" : "text-gray-500"
      )}
    >
      {icon}
      <span className="text-sm mt-1">{label}</span>
    </button>
  );
};

export default function Sidebar() {
  const [currentLocation, navigate] = useLocation();
  const [activeItem, setActiveItem] = useState("dashboard");
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  
  useEffect(() => {
    // Set active item based on current location
    if (currentLocation === "/") {
      setActiveItem("dashboard");
    } else if (currentLocation === "/users") {
      setActiveItem("users");
    } else if (currentLocation === "/reports") {
      setActiveItem("reports");
    } else if (currentLocation === "/settings") {
      setActiveItem("settings");
    }
  }, [currentLocation]);
  
  const handleItemClick = (item: string) => {
    setActiveItem(item);
    setIsOpen(false);
    
    // Navigate to the corresponding route
    switch (item) {
      case "dashboard":
        navigate("/");
        break;
      case "users":
        navigate("/users");
        break;
      case "reports":
        navigate("/reports");
        break;
      case "settings":
        navigate("/settings");
        break;
      default:
        navigate("/");
    }
  };

  // Nav items for admin
  const adminSidebarItems = [
    {
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>,
      label: "Dashboard",
      id: "dashboard"
    },
    {
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>,
      label: "Users",
      id: "users"
    },
    {
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>,
      label: "Reports",
      id: "reports"
    },
    {
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>,
      label: "Settings",
      id: "settings"
    }
  ];

  // Nav items for regular users (just dashboard)
  const userSidebarItems = [
    {
      icon: <LayoutDashboard className="h-6 w-6" />,
      label: "Dashboard",
      id: "dashboard"
    }
  ];

  // Determine which set of items to use based on role
  const sidebarItems = isAdmin ? adminSidebarItems : userSidebarItems;
  
  // Desktop sidebar
  if (!isMobile) {
    return (
      <aside className="w-64 bg-white shadow-md hidden md:block">
        <nav className="p-4">
          <ul className="space-y-2">
            {sidebarItems.map(item => (
              <SidebarItem 
                key={item.id}
                icon={item.icon}
                label={item.label}
                active={activeItem === item.id}
                onClick={() => handleItemClick(item.id)}
              />
            ))}
          </ul>
        </nav>
      </aside>
    );
  }
  
  // Mobile sidebar with bottom navigation and slide-out drawer
  return (
    <>
      {/* Mobile slide-out menu */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-[250px] sm:w-[300px] p-0">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Menu</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <nav className="p-4">
            <ul className="space-y-2">
              {sidebarItems.map(item => (
                <SidebarItem 
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  active={activeItem === item.id}
                  onClick={() => handleItemClick(item.id)}
                />
              ))}
            </ul>
          </nav>
        </SheetContent>
      </Sheet>

      {/* Mobile hamburger menu button in header */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Mobile bottom navigation bar - only for admin users */}
      {isAdmin && isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex md:hidden z-50">
          <div className="grid grid-cols-4 w-full">
            {adminSidebarItems.map(item => (
              <MobileNavItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                active={activeItem === item.id}
                onClick={() => handleItemClick(item.id)}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}