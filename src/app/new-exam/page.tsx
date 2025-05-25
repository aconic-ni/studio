
import { InitialInfoForm } from "@/components/exam/initial-info-form";
import { Navbar } from "@/components/layout/navbar";

export default function NewExamPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8 flex items-center justify-center">
        <InitialInfoForm />
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} ACONIC Facturación Local. All rights reserved.
      </footer>
    </div>
  );
}
