import type { Metadata } from 'next';
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import AuthGuard from '@/components/auth/AuthGuard';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: "ChanchiMercado - Mercado & Punto de Venta",
  description: "Gestión de deudores, inventario y ventas fiadas. ¡Hecho con amor para la mejor mamá!",
  openGraph: {
    title: "ChanchiMercado POS",
    description: "Tu punto de venta inteligente y control de deudores.",
    type: "website",
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "ChanchiMercado Logo" }],
  },
  // Next.js auto-serves app/manifest.ts at /manifest.webmanifest
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
    shortcut: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ChanchiMercado',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <Toaster position="top-center" expand={false} richColors />
      </body>
    </html>
  );
}
