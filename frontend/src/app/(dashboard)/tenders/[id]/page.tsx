'use client';

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import { TenderDetailsRedesigned } from '@/views/TenderDetailsRedesigned';

interface TenderDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default function TenderDetailsPage({ params }: TenderDetailsPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const tenderId = parseInt(resolvedParams.id, 10);

  const handleBack = () => {
    router.push('/tenders');
  };

  if (isNaN(tenderId)) {
    return (
      <div className="p-8 text-center text-xs text-rose-400">
        Invalid tender ID provided.
      </div>
    );
  }

  return (
    <TenderDetailsRedesigned
      tenderId={tenderId}
      onBack={handleBack}
    />
  );
}
