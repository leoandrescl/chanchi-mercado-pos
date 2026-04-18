import { supabase } from './supabase';

interface SalesRanking {
  [productName: string]: number;
}

/**
 * Mapeo manual para códigos de legado o abreviaciones comunes
 */
const LEGACY_MAP: Record<string, string> = {
  'SPA': 'Sopaipilla',
  'RC': 'Rollito de Canela',
  'EMP': 'Empanada',
  'BEB': 'Bebida',
  'PAN': 'Pan Amasado'
};

/**
 * Analiza las deudas de los últimos 15 días y devuelve un ranking de popularidad
 */
export async function getSalesRanking(days: number = 15): Promise<SalesRanking> {
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);
  
  const { data: debts, error } = await supabase
    .from('debts')
    .select('description')
    .gte('date', dateThreshold.toISOString());

  if (error) {
    console.error('Error fetching sales for ranking:', error);
    return {};
  }

  const ranking: SalesRanking = {};

  debts.forEach((debt) => {
    const desc = debt.description || '';
    
    // 1. Limpiar el prefijo "Compra: "
    let cleanDesc = desc.replace(/^Compra: /, '');
    
    // 2. Intentar parsear el formato "Item xQty, Item2 xQty" o "Qty Item + Qty Item"
    // Regex para: "Sopaipilla x2" o "2 Sopaipilla" o "1 RC"
    // Buscamos patrones de: (Número)(Espacio opcional)(Nombre/Código) o (Nombre/Código)(Espacio opcional)(x)(Número)
    
    // Patrón A: "Sopaipilla x2"
    const patternA = /([^,x+]+)\s*x\s*(\d+)/gi;
    let match;
    while ((match = patternA.exec(cleanDesc)) !== null) {
      const name = match[1].trim();
      const qty = parseInt(match[2], 10);
      addToRanking(ranking, name, qty);
    }

    // Patrón B: "2 SPA" o "1 RC" (con o sin el +)
    // Buscamos Numero seguido de Palabra cortas o largas
    const patternB = /(\d+)\s+([A-ZÁÉÍÓÚÑa-záéíóúñ]{2,})/g;
    while ((match = patternB.exec(cleanDesc)) !== null) {
      const qty = parseInt(match[1], 10);
      const name = match[2].trim();
      // Solo sumamos si no fue capturado por el patrón A (para evitar duplicados si la descripción es rara)
      if (!cleanDesc.includes(`${name} x${qty}`)) {
        addToRanking(ranking, name, qty);
      }
    }
  });

  return ranking;
}

function addToRanking(ranking: SalesRanking, name: string, qty: number) {
  // Normalizar nombre
  let normalized = name.toUpperCase();
  
  // Aplicar mapa de legado
  if (LEGACY_MAP[normalized]) {
    normalized = LEGACY_MAP[normalized].toUpperCase();
  }

  ranking[normalized] = (ranking[normalized] || 0) + qty;
}

/**
 * Compara un nombre de producto real con el ranking para asignar un puntaje
 */
export function getProductScore(productName: string, ranking: SalesRanking): number {
  const normProduct = productName.toUpperCase();
  
  // 1. Búsqueda exacta
  if (ranking[normProduct]) return ranking[normProduct];
  
  // 2. Búsqueda de coincidencia parcial
  // Ej: Si el ranking tiene "SOPAIPILLA" y el producto es "Sopaipilla con Queso"
  let maxScore = 0;
  for (const [rankedName, score] of Object.entries(ranking)) {
    if (normProduct.includes(rankedName) || rankedName.includes(normProduct)) {
      maxScore = Math.max(maxScore, score);
    }
  }
  
  return maxScore;
}
