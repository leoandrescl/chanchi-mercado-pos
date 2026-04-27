import type { ReactNode } from 'react';

/** Evita HTML estático en CDN: el cliente siempre recibe el shell alineado a los chunks actuales. */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AccesoChanchiLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
