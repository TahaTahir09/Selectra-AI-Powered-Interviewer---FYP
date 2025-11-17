import { Link } from "react-router-dom";
import { Building2, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  userType?: "organization" | "candidate";
  userName?: string;
  onLogout?: () => void;
}

const Header = ({ userType, userName, onLogout }: HeaderProps) => {
  return (
    <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            SELECTRA
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {userName ? (
            <>
              <div className="flex items-center gap-2 text-sm">
                {userType === "organization" ? (
                  <Building2 className="h-4 w-4 text-primary" />
                ) : (
                  <User className="h-4 w-4 text-primary" />
                )}
                <span className="text-foreground font-medium">{userName}</span>
              </div>
              {onLogout && (
                <Button variant="ghost" size="sm" onClick={onLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              )}
            </>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/org/login">Organization</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/candidate/login">Candidate</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
