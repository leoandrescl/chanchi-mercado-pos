export interface SaleDetails {
  customerName: string;
  phone: string;
  total: number;
  previousBalance: number;
  newBalance: number;
  items: { name: string; quantity: number; price: number }[];
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

const getExactAbonoMotivo = (description?: string) => {
  if (!description) return '';
  const normalized = description.trim();
  const prefixes = ['Abono Registrado — ', 'Abono Registrado - ', 'Abono Registrado: '];
  for (const prefix of prefixes) {
    if (normalized.startsWith(prefix)) {
      return normalized.slice(prefix.length).trim();
    }
  }
  return '';
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
          const motivo = getExactAbonoMotivo(entry.description);
          monthEntriesContent += motivo
            ? `- [${dateLabel}] 💰 PAGO (${motivo}): ${formatPrice(entry.amount)}\n`
            : `- [${dateLabel}] 💰 PAGO: ${formatPrice(entry.amount)}\n`;
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

*TOTAL PENDIENTE: ${formatPrice(finalBalance)}*
==========================

¡Muchas gracias por su preferencia!`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

// 2. GENERADOR DE COMPRA ACTUAL (EL QUE SOLICITASTE con FECHA)
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
    .map((item) => `* ${item.name} (x${item.quantity}) - ${formatPrice(item.price || 0)}`)
    .join('\n');

  const message = `*Detalle de compra (${dateStr}):*

${itemsList}

--------------------------
📈 *Total Previo:* ${formatPrice(previousBalance)}
➕ *Esta Compra:* ${formatPrice(total)}
*TOTAL ACTUAL:* ${formatPrice(newBalance)}
--------------------------

¡Muchas gracias por su preferencia!`;

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

// 4. GENERADOR DE PEDIDO DE CLIENTE (STOREFRONT PÚBLICO)
export function generateCustomerOrderLink({
  items,
  total,
}: {
  items: { name: string; quantity: number; price: number }[];
  total: number;
}): string {
  const CHANCHI_PHONE = '56968067937';
  const dateStr = getFormattedDate();

  const itemsList = items
    .map((item) => `* ${item.name} (x${item.quantity}) - ${formatPrice(item.price)}`)
    .join('\n');

  const message = `*¡Hola! Me gustaría hacer un pedido:*

${itemsList}

--------------------------
*TOTAL A PAGAR:* ${formatPrice(total)}
--------------------------
Fecha: ${dateStr}

Muchas gracias.`;

  return `https://wa.me/${CHANCHI_PHONE}?text=${encodeURIComponent(message)}`;
}

// 5. GENERADOR DE RESUMEN SIMPLIFICADO (solo ítems pendientes)
export interface SummaryReportDetails {
  customerName: string;
  phone: string;
  pendingDebts: {
    date: string;
    description: string;
    originalAmount: number;
    remainingAmount: number;
    isPartial: boolean; // partial payment covers part of this debt
  }[];
  payments?: {
    date: string;
    description: string;
    amount: number;
  }[];
  totalBalance: number;
}

export function generateSummaryMessage({
  customerName,
  phone,
  pendingDebts,
  payments = [],
  totalBalance,
}: SummaryReportDetails): string {
  const cleanPhone = phone.replace(/\D/g, '');

  // Group by month
  const monthFormatter = new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' });
  const grouped: Record<string, typeof pendingDebts> = {};

  for (const d of pendingDebts) {
    const monthKey = monthFormatter.format(new Date(d.date));
    if (!grouped[monthKey]) grouped[monthKey] = [];
    grouped[monthKey].push(d);
  }

  let body = '';
  const monthSubtotals: { name: string; total: number }[] = [];

  for (const [monthName, items] of Object.entries(grouped)) {
    const monthTotal = items.reduce((s, i) => s + i.remainingAmount, 0);
    const monthShort = monthName.charAt(0).toUpperCase() + monthName.slice(1).split(' ')[0];
    monthSubtotals.push({ name: monthShort, total: monthTotal });

    body += `*# ${monthName.toUpperCase()} #*\n\n`;

    for (const item of items) {
      const dateLabel = `${new Date(item.date).getDate()}/${new Date(item.date).getMonth() + 1}`;
      const desc = item.description.replace(/^Compra: /, '');

      if (item.isPartial) {
        // Show the original amount and what's still owed
        body += `- [${dateLabel}] ${desc}: ${formatPrice(item.originalAmount)}\n`;
        body += `  ↳ 📌 Queda pendiente: ${formatPrice(item.remainingAmount)}\n`;
      } else {
        body += `- [${dateLabel}] ${desc}: ${formatPrice(item.remainingAmount)}\n`;
      }
    }

    body += `--------------------------\n`;
    body += `📈 Subtotal ${monthShort}: ${formatPrice(monthTotal)}\n\n`;
  }

  const subtotalLines = monthSubtotals
    .map(m => `📈 Subtotal ${m.name}: ${formatPrice(m.total)}`)
    .join('\n');

  const paymentLines = payments
    .map((p) => {
      const motivo = getExactAbonoMotivo(p.description);
      if (!motivo) return '';
      return `- [${getFormattedDate(p.date)}] 💰 Abono (${motivo}): ${formatPrice(p.amount)}`;
    })
    .filter(Boolean)
    .join('\n');

  const paymentSection = paymentLines
    ? `\n🧾 *Abonos:*\n${paymentLines}\n`
    : '';

  const message = `📦 *Resumen de cuenta:*\n\n${body}${paymentSection}==========================\n   💰 *RESUMEN DE CUENTA*\n==========================\n${subtotalLines}\n\n*TOTAL PENDIENTE: ${formatPrice(totalBalance)}*\n==========================\n\n¡Muchas gracias por su preferencia!`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}