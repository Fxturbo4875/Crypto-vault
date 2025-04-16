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
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

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
        "flex flex-col items-center justify-center w-full p-2",
        active ? "text-primary" : "text-neutral-500"
      )}
    >
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </button>
  );
};

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const [activeItem, setActiveItem] = useState("dashboard");
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const handleItemClick = (item: string) => {
    setActiveItem(item);
    setIsOpen(false);
    // In a real application with multiple routes, we would navigate here
  };

  const sidebarItems = [
    {
      icon: <LayoutDashboard className="h-5 w-5" />,
      label: "Dashboard",
      id: "dashboard"
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: "Users",
      id: "users"
    },
    {
      icon: <FileText className="h-5 w-5" />,
      label: "Reports",
      id: "reports"
    },
    {
      icon: <Settings className="h-5 w-5" />,
      label: "Settings",
      id: "settings"
    }
  ];
  
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

      {/* Mobile bottom navigation bar - fixed at the bottom of the screen */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex md:hidden z-50">
        <div className="grid grid-cols-4 w-full">
          {sidebarItems.map(item => (
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
    </>
  );
}
