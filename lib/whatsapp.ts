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
💰 *TOTAL PENDIENTE:* ${formatPrice(historicalBalance)}
--------------------------

Quedo atenta a cualquier duda. ¡Gracias! 🐷`;

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

  const message = `Hola ${customerName}! te envío el detalle de tus consumos en ChanchiMercado 👋

He registrado tu compra por *${formatPrice(total)}*.

*Detalle:*
${itemsList}

--------------------------
📉 *Acumulado Previo:* ${formatPrice(previousBalance)}
➕ *Esta Compra:* ${formatPrice(total)}
💰 *TOTAL AL DÍA:* ${formatPrice(newBalance)}
--------------------------

Gracias por tu preferencia! 🐷`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}
