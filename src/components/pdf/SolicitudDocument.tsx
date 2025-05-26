
"use client"; // This directive might be needed if we use hooks or browser APIs directly
import React, { type FC } from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import type { ExamData, SolicitudData } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Register a font (optional, but good for consistency)
// Ensure you have the font file available or use a standard PDF font
// For simplicity, we'll use default Helvetica. If using custom fonts:
// Font.register({ family: 'Inter', src: '/path/to/Inter-Regular.ttf' });

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica', // Use a standard font or a registered one
  },
  section: {
    marginBottom: 10,
    padding: 10,
    border: '1px solid #EEE',
    borderRadius: 5,
  },
  header: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#4F759B',
  },
  subHeader: {
    fontSize: 12,
    marginBottom: 8,
    fontWeight: 'bold',
    color: '#4F759B',
    marginTop: 10,
  },
  text: {
    fontSize: 10,
    marginBottom: 3,
    color: '#333333',
  },
  label: {
    fontWeight: 'bold',
    color: '#555555',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  colValue: {
    width: '70%',
  },
  colLabel: {
    width: '30%',
    fontWeight: 'bold',
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    fontSize: 9,
    marginBottom: 2,
    marginLeft: 10,
  },
  checkboxText: {
    marginLeft: 5,
  }
});

interface SolicitudDocumentProps {
  examData: ExamData;
  solicitudes: SolicitudData[];
}

const formatCurrencyForPdf = (amount?: number | string, currency?: string) => {
    if (amount === undefined || amount === null || amount === '') return 'N/A';
    const num = Number(amount);
    if (isNaN(num)) return String(amount);
    let prefix = '';
    if (currency === 'cordoba') prefix = 'C$';
    else if (currency === 'dolar') prefix = 'US$';
    else if (currency === 'euro') prefix = '€';
    return `${prefix}${num.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatBooleanForPdf = (value?: boolean): string => {
  return value ? 'Sí' : 'No';
};

const getBancoDisplayPdf = (solicitud: SolicitudData) => {
    if (solicitud.banco === 'ACCION POR CHEQUE/NO APLICA BANCO') return 'Acción por Cheque / No Aplica Banco';
    if (solicitud.banco === 'Otros') return solicitud.bancoOtros || 'Otros (No especificado)';
    return solicitud.banco;
};

const getMonedaCuentaDisplayPdf = (solicitud: SolicitudData) => {
    if (solicitud.monedaCuenta === 'Otros') return solicitud.monedaCuentaOtros || 'Otros (No especificado)';
    return solicitud.monedaCuenta;
};


export const SolicitudDocument: FC<SolicitudDocumentProps> = ({ examData, solicitudes }) => (
  <Document title={`Solicitud de Cheque - ${examData.ne}`}>
    {solicitudes.map((solicitud, index) => (
      <Page size="LETTER" style={styles.page} key={solicitud.id || index}>
        <Text style={styles.header}>SOLICITUD DE CHEQUE - CustomsFA-L</Text>
        
        <View style={styles.section}>
          <Text style={styles.subHeader}>Información General</Text>
          <View style={styles.row}><Text style={styles.colLabel}>A (Destinatario):</Text><Text style={styles.colValue}>{examData.recipient}</Text></View>
          <View style={styles.row}><Text style={styles.colLabel}>De (Colaborador):</Text><Text style={styles.colValue}>{examData.manager}</Text></View>
          <View style={styles.row}><Text style={styles.colLabel}>Fecha de Examen:</Text><Text style={styles.colValue}>{examData.date ? format(examData.date, "PPP", { locale: es }) : 'N/A'}</Text></View>
          <View style={styles.row}><Text style={styles.colLabel}>NE (Tracking NX1):</Text><Text style={styles.colValue}>{examData.ne}</Text></View>
          <View style={styles.row}><Text style={styles.colLabel}>Referencia:</Text><Text style={styles.colValue}>{examData.reference || 'N/A'}</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.subHeader}>Detalles de la Solicitud {index + 1}</Text>
          
          <Text style={styles.text}><Text style={styles.label}>Por este medio me dirijo a usted para solicitarle que elabore cheque por la cantidad de:</Text> {formatCurrencyForPdf(solicitud.monto, solicitud.montoMoneda)}</Text>
          <Text style={styles.text}><Text style={styles.label}>Cantidad en Letras:</Text> {solicitud.cantidadEnLetras || 'N/A'}</Text>
          
          <Text style={styles.subHeader}>Información Adicional</Text>
          <View style={styles.row}><Text style={styles.colLabel}>Consignatario:</Text><Text style={styles.colValue}>{solicitud.consignatario || 'N/A'}</Text></View>
          <View style={styles.row}><Text style={styles.colLabel}>Declaración Número:</Text><Text style={styles.colValue}>{solicitud.declaracionNumero || 'N/A'}</Text></View>
          <View style={styles.row}><Text style={styles.colLabel}>Unidad Recaudadora:</Text><Text style={styles.colValue}>{solicitud.unidadRecaudadora || 'N/A'}</Text></View>
          <View style={styles.row}><Text style={styles.colLabel}>Código 1:</Text><Text style={styles.colValue}>{solicitud.codigo1 || 'N/A'}</Text></View>
          <View style={styles.row}><Text style={styles.colLabel}>Código 2:</Text><Text style={styles.colValue}>{solicitud.codigo2 || 'N/A'}</Text></View>

          <Text style={styles.subHeader}>Cuenta Bancaria</Text>
          <View style={styles.row}><Text style={styles.colLabel}>Banco:</Text><Text style={styles.colValue}>{getBancoDisplayPdf(solicitud) || 'N/A'}</Text></View>
          {solicitud.banco !== 'ACCION POR CHEQUE/NO APLICA BANCO' && (
            <>
              <View style={styles.row}><Text style={styles.colLabel}>Número de Cuenta:</Text><Text style={styles.colValue}>{solicitud.numeroCuenta || 'N/A'}</Text></View>
              <View style={styles.row}><Text style={styles.colLabel}>Moneda de la Cuenta:</Text><Text style={styles.colValue}>{getMonedaCuentaDisplayPdf(solicitud) || 'N/A'}</Text></View>
            </>
          )}

          <Text style={styles.subHeader}>Beneficiario del Pago</Text>
          <View style={styles.row}><Text style={styles.colLabel}>Elaborar Cheque A:</Text><Text style={styles.colValue}>{solicitud.elaborarChequeA || 'N/A'}</Text></View>
          <View style={styles.row}><Text style={styles.colLabel}>Elaborar Transferencia A:</Text><Text style={styles.colValue}>{solicitud.elaborarTransferenciaA || 'N/A'}</Text></View>

          <Text style={styles.subHeader}>Documentación y Estados</Text>
          <Text style={styles.text}><Text style={styles.label}>Impuestos pagados por el cliente:</Text> {formatBooleanForPdf(solicitud.impuestosPagadosCliente)}</Text>
          {solicitud.impuestosPagadosCliente && (
            <View style={{ marginLeft: 15 }}>
              <Text style={styles.text}><Text style={styles.label}>R/C No.:</Text> {solicitud.impuestosPagadosRC || 'N/A'}</Text>
              <Text style={styles.text}><Text style={styles.label}>T/B No.:</Text> {solicitud.impuestosPagadosTB || 'N/A'}</Text>
              <Text style={styles.text}><Text style={styles.label}>Cheque No.:</Text> {solicitud.impuestosPagadosCheque || 'N/A'}</Text>
            </View>
          )}
          <Text style={styles.text}><Text style={styles.label}>Impuestos pendientes de pago por el cliente:</Text> {formatBooleanForPdf(solicitud.impuestosPendientesCliente)}</Text>
          <Text style={styles.text}><Text style={styles.label}>Se añaden documentos adjuntos:</Text> {formatBooleanForPdf(solicitud.documentosAdjuntos)}</Text>
          <Text style={styles.text}><Text style={styles.label}>Constancias de no retención:</Text> {formatBooleanForPdf(solicitud.constanciasNoRetencion)}</Text>
          {solicitud.constanciasNoRetencion && (
            <View style={{ marginLeft: 15 }}>
              <Text style={styles.text}><Text style={styles.label}>1%:</Text> {formatBooleanForPdf(solicitud.constanciasNoRetencion1)}</Text>
              <Text style={styles.text}><Text style={styles.label}>2%:</Text> {formatBooleanForPdf(solicitud.constanciasNoRetencion2)}</Text>
            </View>
          )}

          <Text style={styles.subHeader}>Comunicación</Text>
          <View style={styles.row}><Text style={styles.colLabel}>Correos de Notificación:</Text><Text style={styles.colValue}>{solicitud.correo || 'N/A'}</Text></View>
          <Text style={styles.text}><Text style={styles.label}>Observación:</Text></Text>
          <Text style={styles.text}>{solicitud.observation || 'N/A'}</Text>
        </View>

        <Text style={{ position: 'absolute', bottom: 15, left: 30, fontSize: 8, color: 'grey' }}>
          Generado por CustomsFA-L el {format(new Date(), "PPP p", { locale: es })}
        </Text>
         <Text style={{ position: 'absolute', bottom: 15, right: 30, fontSize: 8, color: 'grey' }} render={({ pageNumber, totalPages }) => (
            `${pageNumber} / ${totalPages}`
          )} fixed />
      </Page>
    ))}
  </Document>
);
