
// Simplified number to words converter for Spanish
// Handles numbers up to 9999.99

const unidades = [
  '', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'
];
const decenas = [
  '', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'
];
const especiales = [
  'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'
];
const centenas = [
  '', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'
];

function convertirParteEntera(n: number): string {
  if (n === 0) return 'CERO';
  if (n === 100) return 'CIEN';

  let letras = '';

  const c = Math.floor(n / 100);
  const d = Math.floor((n % 100) / 10);
  const u = n % 10;

  if (n >= 1000) { // Simplified for thousands
    const miles = Math.floor(n / 1000);
    if (miles === 1) {
      letras += 'MIL ';
    } else {
      letras += convertirParteEntera(miles) + ' MIL ';
    }
    n %= 1000;
    if (n === 0) return letras.trim(); // "DOS MIL" instead of "DOS MIL CERO"
  }


  if (c > 0) {
    letras += centenas[c];
    if (n % 100 !== 0) letras += ' ';
  }

  const restoDecenas = n % 100;

  if (restoDecenas >= 10 && restoDecenas <= 19) {
    letras += especiales[restoDecenas - 10];
  } else {
    if (d > 0) {
      if (d === 2 && u > 0) { // Veintiuno, veintidos...
        letras += 'VEINTI' + unidades[u].toLowerCase();
      } else if (d===2 && u === 0){ // Veinte
        letras += 'VEINTE';
      }
       else {
        letras += decenas[d];
        if (u > 0) letras += ' Y ';
      }
    }
    if (u > 0 && (d !== 2 || d === 0 )) { // d !==2 handles veinti* cases
      letras += unidades[u];
    }
  }
  return letras.trim();
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
  if (isNaN(num) || num < 0) { // Allow 0 to be processed if needed, but often empty for 0
    return '';
  }
  if (num === 0) return 'CERO CON 00/100 ' + (MONEDA_MAP[moneda]?.plural || moneda.toUpperCase());


  const [enteroStr, decimalStr = '00'] = String(num.toFixed(2)).split('.');
  const entero = parseInt(enteroStr, 10);
  
  const letrasEntero = convertirParteEntera(entero);
  const decimalFormateado = decimalStr.padEnd(2, '0');

  const monedaInfo = MONEDA_MAP[moneda] || { singular: moneda.toUpperCase(), plural: moneda.toUpperCase(), short: '' };
  
  // Example logic: "UN CORDOBA" vs "DOS CORDOBAS"
  // For now, let's use plural for simplicity as per example "DOCE ... CORDOBAS"
  const monedaTexto = monedaInfo.plural; 

  return `${letrasEntero} CON ${decimalFormateado}/100 ${monedaTexto}`.toUpperCase();
}
