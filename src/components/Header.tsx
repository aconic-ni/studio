
import { PackageSearch, Database, LogOut } from 'lucide-react';
import type { FC, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onLogout?: () => void;
  actions?: ReactNode; // For extra buttons or elements like "Back to Database" or "New Exam"
}

export const Header: FC<HeaderProps> = ({ onLogout, actions }) => {
  return (
    <header className="py-6 px-4 md:px-6 border-b bg-card shadow-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PackageSearch className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-primary tracking-tight">Customs Ex-p</h1>
        </div>
        <div className="flex items-center gap-3">
          {actions}
          {onLogout && (
            <Button variant="ghost" size="icon" onClick={onLogout} title="Cerrar Sesión">
              <LogOut className="h-5 w-5 text-muted-foreground hover:text-primary" />
            </Button>
          )}
          {/* Fallback icon if no actions or logout provided, can be removed or adjusted */}
          {!actions && !onLogout && <Database className="h-7 w-7 text-muted-foreground" />}
        </div>
      </div>
    </header>
  );
};
