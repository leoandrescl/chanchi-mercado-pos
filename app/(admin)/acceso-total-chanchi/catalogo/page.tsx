'use client';

import CatalogView from '@/components/catalog/CatalogView';

export default function AdminCatalogViewPage() {
  return (
    <div className="bg-white min-h-screen">
      <CatalogView isAdmin={true} />
    </div>
  );
}
