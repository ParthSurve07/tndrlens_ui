'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Dashboard } from '@/views/Dashboard';

export default function TendersPage() {
  const router = useRouter();

  const handleSelectTender = (id: number) => {
    router.push(`/tenders/${id}`);
  };

  return (
    <Dashboard
      onSelectTender={handleSelectTender}
      forceSubTab="catalog"
    />
  );
}
