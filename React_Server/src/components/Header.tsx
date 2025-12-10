import { Link } from "react-router-dom";
import { Building2, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import selectraLogo from "@/assets/selectra-logo.png";

interface HeaderProps {
  userType?: "organization" | "candidate";
  userName?: string;
  onLogout?: () => void;
}

const Header = ({ userType, userName, onLogout }: HeaderProps) => {
  return (
    <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src={selectraLogo} alt="Selectra" className="h-24" />
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
