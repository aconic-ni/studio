import { AppLogo } from "@/components/common/AppLogo";
import { APP_NAME, APP_HEADER_INFO } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface AppHeaderProps {
  isLoggedIn?: boolean;
  onLogout?: () => void;
}

export function AppHeader({ isLoggedIn, onLogout }: AppHeaderProps) {
  return (
    <header className="mb-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <AppLogo size={40} className="text-white" />
          <h1 className="text-2xl md:text-3xl font-bold ml-2 text-white">{APP_NAME}</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-300">{APP_HEADER_INFO}</div>
          {isLoggedIn && onLogout && (
            <Button variant="ghost" size="icon" onClick={onLogout} className="text-white hover:text-gray-200" title="Salir">
              <LogOut className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
