import { useState } from "react";
import { useLocation } from "wouter";
import { LayoutDashboard, Users, FileText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const [activeItem, setActiveItem] = useState("dashboard");
  
  const handleItemClick = (item: string) => {
    setActiveItem(item);
    // In a real application with multiple routes, we would navigate here
  };
  
  return (
    <aside className="w-64 bg-white shadow-md hidden md:block">
      <nav className="p-4">
        <ul className="space-y-2">
          <SidebarItem 
            icon={<LayoutDashboard className="h-5 w-5" />} 
            label="Dashboard" 
            active={activeItem === "dashboard"}
            onClick={() => handleItemClick("dashboard")}
          />
          
          <SidebarItem 
            icon={<Users className="h-5 w-5" />} 
            label="Users" 
            active={activeItem === "users"}
            onClick={() => handleItemClick("users")}
          />
          
          <SidebarItem 
            icon={<FileText className="h-5 w-5" />} 
            label="Reports" 
            active={activeItem === "reports"}
            onClick={() => handleItemClick("reports")}
          />
          
          <SidebarItem 
            icon={<Settings className="h-5 w-5" />} 
            label="Settings" 
            active={activeItem === "settings"}
            onClick={() => handleItemClick("settings")}
          />
        </ul>
      </nav>
    </aside>
  );
}
