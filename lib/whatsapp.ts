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

  // Unicode Emojis for better compatibility
  const ICON_CALENDAR = '\uD83D\uDCC5';
  const ICON_MONEY = '\uD83D\uDCB0';
  const ICON_CHECK = '\u2705';
  const ICON_CHART = '\uD83D\uDCCA';
  const ICON_WAVE = '\uD83D\uDC4B';
  const ICON_PIG = '\uD83D\uDC37';
  const ICON_SPARKLES = '\u2728';
  const ICON_CHART_DOWN = '\uD83D\uDCC9';

  let reportContent = '';

  monthsData.forEach((month) => {
    let monthPurchases = 0;
    let monthAbonos = 0;

    reportContent += `${ICON_CALENDAR} *${month.monthName.toUpperCase()}*\n\n`;
    
    month.entries.forEach((entry) => {
      const dateLabel = formatDate(entry.date);
      if (entry.type === 'DEBT') {
        monthPurchases += entry.amount;
        const itemsStr = entry.items && entry.items.length > 0
          ? entry.items.map(i => `${i.name} x${i.quantity}`).join(', ')
          : entry.description.replace(/^Compra: /, '');
        
        const paidEmoji = entry.is_paid ? ` ${ICON_CHECK}` : '';
        reportContent += `[${dateLabel}] Compra: ${itemsStr}: ${formatPrice(entry.amount)}${paidEmoji}\n`;
      } else {
        monthAbonos += entry.amount;
        reportContent += `[${dateLabel}] ${ICON_MONEY} ABONO RECIBIDO: -${formatPrice(entry.amount)}\n`;
      }
    });

    const monthSubtotal = monthPurchases - monthAbonos;
    const monthNameDisplay = month.monthName.charAt(0).toUpperCase() + month.monthName.slice(1).split(' ')[0];
    reportContent += `--------------------------\n`;
    reportContent += `Subtotal ${monthNameDisplay}: ${formatPrice(monthSubtotal)}\n\n`;
  });

  const message = `Hola ${customerName}, aquí está el detalle completo de tu cuenta en ChanchiMercado ${ICON_WAVE}

${reportContent}
==========================
${ICON_CHART_DOWN} *RESUMEN TOTAL:*
(+) Total Compras: ${formatPrice(totalPurchases)}
(-) Total Abonos: ${formatPrice(totalAbonos)}
*TOTAL A PAGAR: ${formatPrice(finalBalance)}*
==========================

¡Muchas gracias por su preferencia! ${ICON_PIG} ${ICON_SPARKLES}`;

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

  const ICON_BULLET = '\u2022';
  const ICON_CALENDAR = '\uD83D\uDCC5';
  const ICON_MONEY = '\uD83D\uDCB0';
  const ICON_WAVE = '\uD83D\uDC4B';
  const ICON_PIG = '\uD83D\uDC37';

  const itemsList = items
    .map((item) => `${ICON_BULLET} ${formatDate(item.date)}: ${item.description} (${formatPrice(item.amount)})`)
    .join('\n');

  const message = `Hola ${customerName}! te envío el detalle de tus consumos en ChanchiMercado ${ICON_WAVE}

Aquí tienes el resumen de tu cuenta de *${monthName}*:

*Detalle de Movimientos:*
${itemsList}

--------------------------
${ICON_CALENDAR} *Total del Mes:* ${formatPrice(monthlyTotal)}
${ICON_MONEY} *TOTAL FIADO AL DÍA:* ${formatPrice(historicalBalance)}
--------------------------

¡Muchas gracias por su preferencia! ${ICON_PIG}`;

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

  const ICON_BULLET = '\u2022';
  const ICON_CHART_UP = '\uD83D\uDCC8';
  const ICON_PLUS = '\u2795';
  const ICON_MONEY = '\uD83D\uDCB0';
  const ICON_WAVE = '\uD83D\uDC4B';
  const ICON_PIG = '\uD83D\uDC37';

  const itemsList = items
    .map((item) => `${ICON_BULLET} ${item.name} (x${item.quantity})`)
    .join('\n');

  const today = new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const message = `Hola ${customerName}! Te escribo de ChanchiMercado para enviarte el detalle de tu compra de hoy, ${today}. ${ICON_WAVE}

*Detalle de la Compra:*
${itemsList}

--------------------------
${ICON_CHART_UP} *Total Fiado Previo:* ${formatPrice(previousBalance)}
${ICON_PLUS} *Esta Compra:* ${formatPrice(total)}
${ICON_MONEY} *TOTAL FIADO ACTUAL:* ${formatPrice(newBalance)}
--------------------------

¡Muchas gracias por su preferencia! ${ICON_PIG}`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}
