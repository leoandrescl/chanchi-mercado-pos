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

  const today = new Intl.DateTimeFormat('es-CL', { 
    day: '2-digit', month: '2-digit', year: 'numeric' 
  }).format(new Date());

  const cleanPhone = phone.replace(/\D/g, '');

  let reportContent = '';

  monthsData.forEach((month) => {
    let monthPurchases = 0;
    let monthAbonos = 0;

    reportContent += `[# ${month.monthName.toUpperCase()} #]\n\n`;
    
    month.entries.forEach((entry) => {
      const dateLabel = formatDate(entry.date);
      if (entry.type === 'DEBT') {
        monthPurchases += entry.amount;
        const itemsStr = entry.items && entry.items.length > 0
          ? entry.items.map(i => `${i.name} x${i.quantity}`).join(', ')
          : entry.description.replace(/^Compra: /, '');
        
        const paidTag = entry.is_paid ? ' [PAGADO]' : '';
        reportContent += `- [${dateLabel}] Compra: ${itemsStr}: ${formatPrice(entry.amount)}${paidTag}\n`;
      } else {
        monthAbonos += entry.amount;
        reportContent += `- [${dateLabel}] [PAGO]: -${formatPrice(entry.amount)}\n`;
      }
    });

    const monthSubtotal = monthPurchases - monthAbonos;
    const monthNameDisplay = month.monthName.charAt(0).toUpperCase() + month.monthName.slice(1).split(' ')[0];
    reportContent += `--------------------------\n`;
    reportContent += `Subtotal ${monthNameDisplay}: ${formatPrice(monthSubtotal)}\n\n`;
  });

  const message = `Hola ${customerName}, detalle de cuenta en ChanchiMercado:

${reportContent}
==========================
--- RESUMEN TOTAL ---
(+) Total Compras: ${formatPrice(totalPurchases)}
(-) Total Abonos: ${formatPrice(totalAbonos)}
TOTAL A PAGAR: ${formatPrice(finalBalance)}
==========================

*** Muchas gracias por su preferencia - ChanchiMercado ***`;

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

  const today = new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const message = `Hola ${customerName}, detalle de compra en ChanchiMercado (${today}):

DETALLE DE LA COMPRA:
${itemsList}

--------------------------
Total Fiado Previo: ${formatPrice(previousBalance)}
(+) Esta Compra: ${formatPrice(total)}
TOTAL FIADO ACTUAL: ${formatPrice(newBalance)}
--------------------------

*** ChanchiMercado ***`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}
