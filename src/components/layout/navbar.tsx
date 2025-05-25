"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, LogOut, FileCheck2, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useClientAuth } from '@/hooks/use-client-auth';
import { useToast } from "@/hooks/use-toast";

export function Navbar() {
  const { user, logout } = useClientAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: "Logged out", description: "You have been successfully logged out." });
      router.push('/login');
    } catch (error) {
      toast({ title: "Logout Failed", description: "Could not log out. Please try again.", variant: "destructive" });
    }
  };

  return (
    <nav className="bg-card border-b shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-primary">
            <Building2 className="h-7 w-7" />
            <span>ACONIC Facturación Local</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/preview">
                <FileCheck2 className="mr-2 h-4 w-4" />
                Preview & Export
              </Link>
            </Button>
            {user && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {user.displayName || user.email}
                </span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
