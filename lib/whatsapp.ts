export interface SaleDetails {
  customerName: string;
  phone: string;
  total: number;
  newBalance: number;
  items: { name: string; quantity: number }[];
}

export function generateWhatsAppLink({
  customerName,
  phone,
  total,
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

Se ha registrado una nueva venta en *ChanchiMercado POS*:
💰 *Monto:* ${formatPrice(total)}
📊 *Tu Nuevo Saldo:* ${formatPrice(newBalance)}

*Detalle:*
${itemsList}

Gracias por tu preferencia! 🐷`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}
