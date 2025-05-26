
"use client";

import React, { useState, useEffect } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { SolicitudDocument } from '@/components/pdf/SolicitudDocument';
import { Button } from '@/components/ui/button';
import { FileType } from 'lucide-react';
import type { ExamData, SolicitudData } from '@/types';

interface ClientPDFDownloadProps {
  examData: ExamData | null; // Allow null to handle initial states
  solicitudes: SolicitudData[] | null; // Allow null
  className?: string;
}

export const ClientPDFDownload: React.FC<ClientPDFDownloadProps> = ({ examData, solicitudes, className }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Render a placeholder or disabled button until mounted or if data is missing/invalid
  if (!isMounted || !examData || !solicitudes || solicitudes.length === 0) {
    return (
      <Button variant="outline" className={cn("hover:bg-accent/50 w-full sm:w-auto", className)} disabled>
        <FileType className="mr-2 h-4 w-4" /> {isMounted ? 'Descargar PDF' : 'Cargando PDF...'}
      </Button>
    );
  }

  // If we reach here, isMounted is true, and examData & solicitudes are valid
  return (
    <PDFDownloadLink
      document={<SolicitudDocument examData={examData} solicitudes={solicitudes} />}
      fileName={`SolicitudCheque_${examData.ne || 'SIN_NE'}_${new Date().toISOString().split('T')[0]}.pdf`}
      className={className}
    >
      {({ loading, error }) => {
        if (error) {
          console.error("Error generating PDF:", error);
          return (
            <Button variant="outline" className={cn("hover:bg-destructive/50 w-full sm:w-auto text-destructive", className)} disabled>
               <FileType className="mr-2 h-4 w-4" /> Error PDF
            </Button>
          );
        }
        return (
          <Button variant="outline" className={cn("hover:bg-accent/50 w-full sm:w-auto", className)} disabled={loading}>
            <FileType className="mr-2 h-4 w-4" /> {loading ? 'Generando PDF...' : 'Descargar PDF'}
          </Button>
        );
      }}
    </PDFDownloadLink>
  );
};

// Helper to combine class names, assuming you might not have cn directly in this isolated component
// If you have a shared `cn` utility, you can import that instead.
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');
