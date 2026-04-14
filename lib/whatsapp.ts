export interface SaleDetails {
  customerName: string;
  phone: string;
  total: number;
  previousBalance: number;
  newBalance: number;
  items: { name: string; quantity: number }[];
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

  const message = `Hola ${customerName}! 👋

He registrado tu compra por *${formatPrice(total)}*.

*Detalle:*
${itemsList}

--------------------------
📉 *Saldo Anterior:* ${formatPrice(previousBalance)}
➕ *Esta Compra:* ${formatPrice(total)}
💰 *TOTAL ACUMULADO:* ${formatPrice(newBalance)}
--------------------------

Gracias por tu preferencia! 🐷`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}
