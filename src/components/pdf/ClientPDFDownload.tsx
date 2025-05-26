
"use client";

import React, { useState, useEffect } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { SolicitudDocument } from '@/components/pdf/SolicitudDocument';
import { Button } from '@/components/ui/button';
import { FileType } from 'lucide-react';
import type { ExamData, SolicitudData } from '@/types';
import { cn } from '@/lib/utils';

interface ClientPDFDownloadProps {
  examData: ExamData | null;
  solicitudes: SolicitudData[] | null;
  className?: string;
}

export const ClientPDFDownload: React.FC<ClientPDFDownloadProps> = ({ examData, solicitudes, className }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !examData || !examData.ne || !solicitudes || solicitudes.length === 0) {
    const loadingMessage = isMounted && examData && typeof examData.ne === 'string' && solicitudes && solicitudes.length > 0 
      ? 'Generando PDF...' 
      : 'Cargando PDF...';
    return (
      <Button variant="outline" className={cn("hover:bg-accent/50 w-full sm:w-auto", className)} disabled>
        <FileType className="mr-2 h-4 w-4" /> {loadingMessage}
      </Button>
    );
  }

  // If we reach here, isMounted is true, and examData & solicitudes are valid and examData.ne is present
  const fileName = `SolicitudCheque_${examData.ne}_${new Date().toISOString().split('T')[0]}.pdf`;

  return (
    <PDFDownloadLink
      document={<SolicitudDocument examData={examData} solicitudes={solicitudes} />}
      fileName={fileName}
      className={className} // Apply className to the link itself
    >
      {({ loading, error }) => {
        if (error) {
          console.error("Error generating PDF link (raw):", error);
          // Attempt to log more specific error details
          if (error instanceof Error) {
            console.error("Error message:", error.message);
            if (error.stack) {
              console.error("Error stack:", error.stack);
            }
          } else if (typeof error === 'object' && error !== null) {
            // Log properties of the error object if it's not an Error instance
            for (const key in error) {
              if (Object.prototype.hasOwnProperty.call(error, key)) {
                console.error(`Error object property - ${key}:`, (error as any)[key]);
              }
            }
          }


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
