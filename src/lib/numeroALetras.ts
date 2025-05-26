
// Number to words converter for Spanish
// Handles numbers up to 9,999,999.99

const unidades = [
  '', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'
];
const decenas = [
  '', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'
];
const especiales = [ // For 10-19
  'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'
];
const centenas = [
  '', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'
];

function convertirSegmento(n: number): string {
    if (n < 0 || n > 999) return ""; // Handles segments of 3 digits

    let parts: string[] = [];

    const c = Math.floor(n / 100); // Hundreds digit
    const resto = n % 100;         // Remainder for tens and units

    if (c > 0) {
        if (c === 1 && resto === 0) { // Exactly 100
            parts.push('CIEN');
        } else {
            parts.push(centenas[c]); // e.g., CIENTO, DOSCIENTOS. centenas[1] is CIENTO
        }
    }

    if (resto > 0) {
        const d = Math.floor(resto / 10); // Tens digit of the remainder
        const u = resto % 10;             // Units digit of the remainder

        if (resto >= 10 && resto <= 19) { // 10-19
            parts.push(especiales[resto - 10]);
        } else { // 0-9 or 20-99
            if (d >= 2) { // 20-99
                parts.push(decenas[d]); // VEINTE, TREINTA...
                if (u > 0 && d > 2) { // For 31-39, 41-49... "TREINTA Y UNO"
                    parts.push('Y');
                }
            }
            // Add unit if:
            // 1. It's a unit from 1-9 (d=0, u>0)
            // 2. It's the unit part of 21-29 (d=2, u>0, "VEINTIUNO" - handled by not adding here if VEINTI was used)
            // 3. It's the unit part of 31-39, 41-49, etc. (where "Y" was added)
            if (u > 0) {
                if (d === 2 && c > 0) { // e.g. CIENTO VEINTIUNO
                    // For 21-29, VEINTI is usually preferred but current 'decenas' has 'VEINTE'
                    // If 'VEINTE' was pushed and u > 0, we need to handle 'VEINTIUNO' case
                    // This logic can be complex. Simplified for now:
                    // If decenas[2] is 'VEINTE', then we need to form 'VEINTI...'
                    if (decenas[d] === 'VEINTE') {
                         // Remove "VEINTE" if previously added to form "VEINTI..."
                        if (parts.length > 0 && parts[parts.length - 1] === 'VEINTE') {
                            parts.pop();
                        }
                        parts.push('VEINTI' + unidades[u].toLowerCase());
                    } else {
                         parts.push(unidades[u]);
                    }
                } else if (d !== 1) { // Avoid double count for 10-19 and ensure 21-29 not double counted if VEINTI is used
                     parts.push(unidades[u]);
                }
            }
        }
    }
    return parts.join(' ').replace(/\s+/g, ' ').trim();
}


function convertirParteEntera(n: number): string {
    if (n === 0) return 'CERO';
    if (n < 0) return ""; // Or handle negative numbers appropriately

    let parts: string[] = [];
    const millones = Math.floor(n / 1000000);
    const miles = Math.floor((n % 1000000) / 1000);
    const resto = n % 1000;

    if (millones > 0) {
        if (millones === 1) {
            parts.push('UN MILLON');
        } else {
            parts.push(convertirSegmento(millones)); // Convert millions part
            parts.push('MILLONES');
        }
    }

    if (miles > 0) {
        if (miles === 1 && millones === 0) { // "MIL" not "UN MIL" unless it's like "UN MILLON MIL"
            parts.push('MIL');
        } else if (miles > 0) { // For numbers like 2000, 11000, etc.
             const textoMiles = convertirSegmento(miles);
             if(textoMiles) parts.push(textoMiles);
             if(miles > 1 || (millones > 0 && textoMiles) || (millones === 0 && textoMiles !== "UNO") ) { // "DOS MIL", "UN MILLON DOS MIL", but "MIL" not "UNO MIL"
                parts.push('MIL');
             } else if (millones === 0 && miles === 1 && textoMiles === "UNO"){ // Special case for "UN MIL" if it was "UNO MIL"
                parts.pop(); // remove "UNO"
                parts.push('MIL');
             } else if (millones === 0 && textoMiles) { //Handles "MIL" when miles segment is 1
                parts.push('MIL');
             }

        }
    }
    
    if (resto > 0) {
        const textoResto = convertirSegmento(resto);
        if (textoResto) {
             parts.push(textoResto);
        }
    } else if (n > 0 && millones === 0 && miles === 0 && resto === 0) {
        // This case should not happen if n > 0. If n was initially 0, it's caught.
        // If n was say 1000, resto is 0, but miles > 0, so parts is already ["MIL"]
    }


    // Edge case: if only "UNO" is generated for 1000, replace with "MIL"
    if (parts.length === 1 && parts[0] === "UNO" && n === 1000) {
        return "MIL";
    }
    // Edge case: if only "UNO" is generated for 1_000_000, replace with "UN MILLON" (already handled)

    return parts.join(' ').replace(/\s+/g, ' ').trim();
}


const MONEDA_MAP: { [key: string]: { singular: string, plural: string, short: string } } = {
  cordoba: { singular: 'CORDOBA', plural: 'CORDOBAS', short: 'C$' },
  dolar: { singular: 'DOLAR', plural: 'DOLARES', short: 'US$' },
  euro: { singular: 'EURO', plural: 'EUROS', short: '€' }
};

export function numeroALetras(numero?: number | string, moneda?: string): string {
  if (numero === undefined || numero === null || numero === '' || moneda === undefined) {
    return '';
  }

  const num = Number(numero);
  if (isNaN(num) || num < 0) {
    return '';
  }

  const monedaInfo = MONEDA_MAP[moneda] || { singular: moneda.toUpperCase(), plural: moneda.toUpperCase(), short: '' };
  
  if (num === 0) return `CERO CON 00/100 ${monedaInfo.plural}`;

  const [enteroStr, decimalStr = '00'] = String(num.toFixed(2)).split('.');
  const entero = parseInt(enteroStr, 10);
  
  let letrasEntero = convertirParteEntera(entero);
  // Special case for "UNO" before currency, should be "UN" if it's just "UNO"
  if (letrasEntero === 'UNO' && entero === 1) {
      letrasEntero = 'UN';
  }

  const decimalFormateado = decimalStr.padEnd(2, '0');
  
  const monedaTexto = (entero === 1 && letrasEntero === 'UN') ? monedaInfo.singular : monedaInfo.plural; 

  return `${letrasEntero} CON ${decimalFormateado}/100 ${monedaTexto}`.toUpperCase();
}
