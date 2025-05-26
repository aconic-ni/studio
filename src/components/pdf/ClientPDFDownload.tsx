
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
  const [pdfLinkNode, setPdfLinkNode] = useState<React.ReactNode | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && examData && solicitudes && solicitudes.length > 0) {
      const fileName = `SolicitudCheque_${examData.ne || 'SIN_NE'}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      setPdfLinkNode(
        <PDFDownloadLink
          document={<SolicitudDocument examData={examData} solicitudes={solicitudes} />}
          fileName={fileName}
          className={className}
        >
          {({ loading, error }) => {
            if (error) {
              console.error("Error generating PDF link:", error);
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
    } else {
      // If conditions are not met (e.g., data becomes null after being initially set), clear the link
      setPdfLinkNode(null);
    }
  }, [isMounted, examData, solicitudes, className]);

  if (pdfLinkNode) {
    return <>{pdfLinkNode}</>;
  }

  // Fallback: Render a placeholder or disabled button
  return (
    <Button variant="outline" className={cn("hover:bg-accent/50 w-full sm:w-auto", className)} disabled>
      <FileType className="mr-2 h-4 w-4" /> {isMounted && examData && solicitudes && solicitudes.length > 0 ? 'Generando PDF...' : 'Cargando PDF...'}
    </Button>
  );
};
