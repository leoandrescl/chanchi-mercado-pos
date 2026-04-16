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
    reportContent += `\n📅 *${month.monthName.toUpperCase()}*\n`;
    month.entries.forEach((entry) => {
      const dateLabel = formatDate(entry.date);
      if (entry.type === 'DEBT') {
        const itemsStr = entry.items && entry.items.length > 0
          ? entry.items.map(i => `${i.name} x${i.quantity}`).join(', ')
          : entry.description.replace(/^Compra: /, '');
        
        const statusEmoji = entry.is_paid ? '✅' : '⏳';
        const remainingLabel = entry.is_paid 
          ? 'PAGADO' 
          : `RESTAN: ${formatPrice(entry.remaining_amount || entry.amount)}`;

        reportContent += `• (${dateLabel}) Compra: ${itemsStr} - ${formatPrice(entry.amount)} (${statusEmoji} ${remainingLabel})\n`;
      } else {
        const note = entry.liquidationNote ? ` (_${entry.liquidationNote}_)` : '';
        reportContent += `• (${dateLabel}) 💰 *Abono Recibido:* -${formatPrice(entry.amount)}${note}\n`;
      }
    });
  });

  const message = `Hola ${customerName}, aquí está el detalle completo de tu cuenta en ChanchiMercado a fecha ${today} 👋

--------------------------
*HISTORIAL DE TRANSACCIONES*
${reportContent}
--------------------------
📊 *RESUMEN:*
(+) Total Compras: ${formatPrice(totalPurchases)}
(-) Total Abonos: ${formatPrice(totalAbonos)}
--------------------------
💰 *TOTAL A PAGAR: ${formatPrice(finalBalance)}*
--------------------------

¡Muchas gracias por su preferencia! 🐷✨`;

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
    .map((item) => `• ${formatDate(item.date)}: ${item.description} (${formatPrice(item.amount)})`)
    .join('\n');

  const message = `Hola ${customerName}! te envío el detalle de tus consumos en ChanchiMercado 👋

Aquí tienes el resumen de tu cuenta de *${monthName}*:

*Detalle de Movimientos:*
${itemsList}

--------------------------
📅 *Total del Mes:* ${formatPrice(monthlyTotal)}
💰 *TOTAL FIADO AL DÍA:* ${formatPrice(historicalBalance)}
--------------------------

¡Muchas gracias por su preferencia! 🐷`;

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
    .map((item) => `• ${item.name} (x${item.quantity})`)
    .join('\n');

  const today = new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const message = `Hola ${customerName}! Te escribo de ChanchiMercado para enviarte el detalle de tu compra de hoy, ${today}. 👋

*Detalle de la Compra:*
${itemsList}

--------------------------
📈 *Total Fiado Previo:* ${formatPrice(previousBalance)}
➕ *Esta Compra:* ${formatPrice(total)}
💰 *TOTAL FIADO ACTUAL:* ${formatPrice(newBalance)}
--------------------------

¡Muchas gracias por su preferencia! 🐷`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}
