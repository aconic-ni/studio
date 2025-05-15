import { PackageSearch } from 'lucide-react';
import type { FC } from 'react';

export const Header: FC = () => {
  return (
    <header className="py-6 px-4 md:px-6 border-b bg-card shadow-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center gap-3">
        <PackageSearch className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-primary tracking-tight">Customs Ex-p</h1>
      </div>
    </header>
  );
};
