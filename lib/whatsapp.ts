export interface SaleDetails {
  customerName: string;
  phone: string;
  total: number;
  previousBalance: number;
  newBalance: number;
  items: { name: string; quantity: number }[];
}

export interface MonthlyReportDetails {
  customerName: string;
  phone: string;
  monthName: string;
  monthlyTotal: number;
  historicalBalance: number;
  items: { date: string; description: string; amount: number }[];
}

export interface FullAuditDetails {
  customerName: string;
  phone: string;
  monthsData: {
    monthName: string;
    entries: {
      type: 'DEBT' | 'PAYMENT';
      date: string;
      description: string;
      amount: number;
      remaining_amount?: number;
      is_paid?: boolean;
      items?: { name: string; quantity: number }[];
      liquidationNote?: string;
    }[];
  }[];
  totalPurchases: number;
  totalAbonos: number;
  finalBalance: number;
}

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(amount);
};

const getFormattedDate = (dateStr?: string) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  return `${d.getDate()}/${d.getMonth() + 1}`;
};

// 1. GENERADOR DE DETALLE DE CUENTA (AUDITORÍA COMPLETA)
export function generateFullAuditMessage({
  customerName,
  phone,
  monthsData,
  finalBalance,
}: FullAuditDetails): string {
  const cleanPhone = phone.replace(/\D/g, '');
  const now = new Date();
  const thresholdDate = new Date(now.getFullYear(), now.getMonth(), 1);

  let reportContent = '';
  let subtotalMesActual = 0;
  let currentMonthName = '';

  monthsData.forEach((month) => {
    let monthPurchases = 0;
    let monthAbonos = 0;
    let monthEntriesContent = '';
    let hasDetailedEntries = false;

    month.entries.forEach((entry) => {
      const entryDate = new Date(entry.date);
      if (entryDate >= thresholdDate) {
        hasDetailedEntries = true;
        const dateLabel = getFormattedDate(entry.date);

        if (entry.type === 'DEBT') {
          monthPurchases += entry.amount;
          const itemsStr = entry.items && entry.items.length > 0
            ? entry.items.map(i => `${i.name} x${i.quantity}`).join(', ')
            : entry.description.replace(/^Compra: /, '');

          monthEntriesContent += `- [${dateLabel}] Compra: ${itemsStr}: ${formatPrice(entry.amount)}${entry.is_paid ? ' ✅' : ''}\n`;
        } else {
          monthAbonos += entry.amount;
          monthEntriesContent += `- [${dateLabel}] 💰 PAGO: ${formatPrice(entry.amount)}\n`;
        }
      }
    });

    if (hasDetailedEntries) {
      const monthSubtotal = monthPurchases - monthAbonos;
      subtotalMesActual += monthSubtotal;
      currentMonthName = month.monthName.charAt(0).toUpperCase() + month.monthName.slice(1).split(' ')[0];

      reportContent += `*# ${month.monthName.toUpperCase()} #*\n\n`;
      reportContent += monthEntriesContent;
      reportContent += `--------------------------\n`;
      reportContent += `📈 Subtotal ${currentMonthName}: ${formatPrice(monthSubtotal)}\n\n`;
    }
  });

  const saldoAnterior = finalBalance - subtotalMesActual;
  const historicalLine = saldoAnterior > 0
    ? `⌛ Saldo Anterior: ${formatPrice(saldoAnterior)}\n`
    : '';

  const message = `📦 *Resumen de cuenta:*

${reportContent}==========================
   💰 *RESUMEN DE CUENTA*
==========================
${historicalLine}📈 Subtotal ${currentMonthName}: ${formatPrice(subtotalMesActual)}

💰 *TOTAL PENDIENTE: ${formatPrice(finalBalance)}*
==========================

¡Muchas gracias por su preferencia! 🐷`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

// 2. GENERADOR DE COMPRA ACTUAL (EL QUE SOLICITASTE CON FECHA)
export function generateWhatsAppLink({
  customerName,
  phone,
  total,
  previousBalance,
  newBalance,
  items,
}: SaleDetails): string {
  const cleanPhone = phone.replace(/\D/g, '');
  const dateStr = getFormattedDate(); // Fecha de hoy

  const itemsList = items
    .map((item) => `- ${item.name} (x${item.quantity})`)
    .join('\n');

  const message = `📦 *Detalle de compra (${dateStr}):*

${itemsList}

--------------------------
📈 *Total Previo:* ${formatPrice(previousBalance)}
➕ *Esta Compra:* ${formatPrice(total)}
💰 *TOTAL ACTUAL:* ${formatPrice(newBalance)}
--------------------------

¡Muchas gracias por su preferencia! 🐷`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

// 3. GENERADOR DE REPORTE MENSUAL SIMPLE
export function generateMonthlyReport({
  customerName,
  phone,
  monthName,
  monthlyTotal,
  historicalBalance,
  items,
}: MonthlyReportDetails): string {
  const cleanPhone = phone.replace(/\D/g, '');

  const itemsList = items
    .map((item) => `- [${getFormattedDate(item.date)}] ${item.description}: ${formatPrice(item.amount)}`)
    .join('\n');

  const message = `Hola ${customerName}, resumen de consumos en ChanchiMercado:

Cuenta de ${monthName}:

DETALLE DE MOVIMIENTOS:
${itemsList}

--------------------------
Total del Mes: ${formatPrice(monthlyTotal)}
TOTAL FIADO AL DIA: ${formatPrice(historicalBalance)}
--------------------------

*** ChanchiMercado ***`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}