
"use client";

import React, { useState, useEffect } from 'react'; // Added useState and useEffect
import { PDFDownloadLink } from '@react-pdf/renderer';
import { SolicitudDocument } from '@/components/pdf/SolicitudDocument';
import { Button } from '@/components/ui/button';
import { FileType } from 'lucide-react';
import type { ExamData, SolicitudData } from '@/types';

interface ClientPDFDownloadProps {
  examData: ExamData;
  solicitudes: SolicitudData[];
  className?: string;
}

export const ClientPDFDownload: React.FC<ClientPDFDownloadProps> = ({ examData, solicitudes, className }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !examData || solicitudes.length === 0) {
    // Render a placeholder or disabled button until mounted or if data is missing
    return (
      <Button variant="outline" className="hover:bg-accent/50 w-full sm:w-auto" disabled>
        <FileType className="mr-2 h-4 w-4" /> {isMounted ? 'Descargar PDF' : 'Cargando PDF...'}
      </Button>
    );
  }

  return (
    <PDFDownloadLink
      document={<SolicitudDocument examData={examData} solicitudes={solicitudes} />}
      fileName={`SolicitudCheque_${examData.ne || 'SIN_NE'}_${new Date().toISOString().split('T')[0]}.pdf`}
      className={className}
    >
      {({ loading }) => (
        <Button variant="outline" className="hover:bg-accent/50 w-full sm:w-auto" disabled={loading}>
          <FileType className="mr-2 h-4 w-4" /> {loading ? 'Generando PDF...' : 'Descargar PDF'}
        </Button>
      )}
    </PDFDownloadLink>
  );
};
