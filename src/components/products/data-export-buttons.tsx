"use client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileText, Sheet } from "lucide-react"; // Using Sheet for Excel

export function DataExportButtons() {
  const { toast } = useToast();

  const handleExportPDF = () => {
    // Placeholder for PDF export logic
    toast({ title: "Export PDF", description: "PDF export functionality is not yet implemented." });
    console.log("Exporting data to PDF...");
  };

  const handleExportExcel = () => {
    // Placeholder for Excel export logic
    toast({ title: "Export Excel", description: "Excel export functionality is not yet implemented." });
    console.log("Exporting data to Excel...");
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <Button onClick={handleExportPDF} variant="outline" className="w-full sm:w-auto">
        <FileText className="mr-2 h-4 w-4" />
        Export to PDF
      </Button>
      <Button onClick={handleExportExcel} variant="outline" className="w-full sm:w-auto">
        <Sheet className="mr-2 h-4 w-4" />
        Export to Excel
      </Button>
    </div>
  );
}
