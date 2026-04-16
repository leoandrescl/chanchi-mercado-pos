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

export function generateFullAuditMessage({
  customerName,
  phone,
  monthsData,
  totalPurchases,
  totalAbonos,
  finalBalance,
}: FullAuditDetails): string {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: '2-digit' }).format(new Date(dateStr));
  };

  const cleanPhone = phone.replace(/\D/g, '');

  const now = new Date();
  const thresholdDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  let accumulatedBalance = 0;
  let reportContent = '';
  let detailedSummaries = '';

  monthsData.forEach((month) => {
    let monthPurchases = 0;
    let monthAbonos = 0;
    let monthEntriesContent = '';
    let hasDetailedEntries = false;

    month.entries.forEach((entry) => {
      const entryDate = new Date(entry.date);
      if (entryDate < thresholdDate) {
        accumulatedBalance += (entry.type === 'DEBT' ? entry.amount : -entry.amount);
      } else {
        hasDetailedEntries = true;
        const dateLabel = formatDate(entry.date);
        if (entry.type === 'DEBT') {
          monthPurchases += entry.amount;
          const itemsStr = entry.items && entry.items.length > 0
            ? entry.items.map(i => `${i.name} x${i.quantity}`).join(', ')
            : entry.description.replace(/^Compra: /, '');
          
          const paidTag = entry.is_paid ? ' [PAGADO]' : '';
          monthEntriesContent += `- [${dateLabel}] Compra: ${itemsStr}: ${formatPrice(entry.amount)}${paidTag}\n`;
        } else {
          monthAbonos += entry.amount;
          monthEntriesContent += `- [${dateLabel}] [PAGO]: -${formatPrice(entry.amount)}\n`;
        }
      }
    });

    if (hasDetailedEntries) {
      reportContent += `[# ${month.monthName.toUpperCase()} #]\n\n`;
      reportContent += monthEntriesContent;
      const monthSubtotal = monthPurchases - monthAbonos;
      const monthNameDisplay = month.monthName.charAt(0).toUpperCase() + month.monthName.slice(1).split(' ')[0];
      reportContent += `--------------------------\n`;
      reportContent += `Subtotal ${monthNameDisplay}: ${formatPrice(monthSubtotal)}\n\n`;
      
      // Capturar para el resumen final
      detailedSummaries += `\u{1F4C8} Subtotal ${monthNameDisplay}: ${formatPrice(monthSubtotal)}\n`;
    }
  });

  const finalLabel = finalBalance >= 0 ? 'TOTAL PENDIENTE' : 'SALDO A SU FAVOR';
  const displayBalance = Math.abs(finalBalance);

  const message = `Hola ${customerName}, resumen de tu cuenta en ChanchiMercado:

${reportContent}==========================
   \u{1F4B0} RESUMEN DE CUENTA
==========================
\u{231B} Saldo Meses Anteriores: ${formatPrice(accumulatedBalance)}
${detailedSummaries}
\u{1F4B0} ${finalLabel}: ${formatPrice(displayBalance)}
==========================

¡Muchas gracias por su preferencia! \u{1F437}`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}


export function generateMonthlyReport({
  customerName,
  phone,
  monthName,
  monthlyTotal,
  historicalBalance,
  items,
}: MonthlyReportDetails): string {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short' }).format(new Date(dateStr));
  };

  const cleanPhone = phone.replace(/\D/g, '');

  const itemsList = items
    .map((item) => `- [${formatDate(item.date)}] ${item.description}: ${formatPrice(item.amount)}`)
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

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

export function generateWhatsAppLink({
  customerName,
  phone,
  total,
  previousBalance,
  newBalance,
  items,
}: SaleDetails): string {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  const cleanPhone = phone.replace(/\D/g, '');

  const itemsList = items
    .map((item) => `- ${item.name} (x${item.quantity})`)
    .join('\n');

  const message = `Hola ${customerName}, detalle de compra en ChanchiMercado:

DETALLE DE LA COMPRA:
${itemsList}

--------------------------
\u{1F4C8} Total Fiado Previo: ${formatPrice(previousBalance)}
\u{2795} Esta Compra: ${formatPrice(total)}
\u{1F4B0} TOTAL FIADO ACTUAL: ${formatPrice(newBalance)}
--------------------------

¡Muchas gracias por su preferencia! \u{1F437}`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

