import { Link, useLocation } from "react-router-dom";
import { 
  Briefcase, 
  FileText, 
  User, 
  LogOut, 
  LayoutDashboard,
  Building2,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import selectraLogo from "@/assets/selectra-logo.png";

interface SidebarProps {
  userType: "organization" | "candidate";
  userName?: string;
  userEmail?: string;
  onLogout: () => void;
}

const Sidebar = ({ userType, userName, userEmail, onLogout }: SidebarProps) => {
  const location = useLocation();

  const organizationMenuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/org/dashboard" },
    { icon: Briefcase, label: "Post New Job", path: "/org/post-job" },
    { icon: FileText, label: "All Jobs", path: "/org/jobs" },
    { icon: Users, label: "Applications", path: "/org/applications" },
    { icon: User, label: "Profile", path: "/org/profile" },
  ];

  const candidateMenuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/candidate/dashboard" },
    { icon: FileText, label: "My Applications", path: "/candidate/applications" },
    { icon: User, label: "Profile", path: "/candidate/profile" },
  ];

  const menuItems = userType === "organization" ? organizationMenuItems : candidateMenuItems;

  return (
    <div className="w-64 bg-black/40 backdrop-blur-xl border-r border-white/10 h-screen fixed left-0 top-0 flex flex-col">
      {/* Logo */}
      <div className="p-3 border-b border-white/10">
        <Link to="/" className="flex items-center justify-center">
          <img src={selectraLogo} alt="Selectra" className="h-14 brightness-0 invert" />
        </Link>
      </div>

      {/* User Profile Section */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src="" alt={userName} />
            <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              {userName?.substring(0, 2).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {userName || "User"}
            </p>
            <p className="text-xs text-white/60 truncate">
              {userEmail || ""}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path}>
                <Link to={item.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full justify-start gap-3 ${
                      isActive 
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" 
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-white/10">
        <Button
          onClick={onLogout}
          variant="outline"
          className="w-full justify-start gap-3 text-red-400 border-red-500/30 hover:bg-red-500/20 hover:text-red-300"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
