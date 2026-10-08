'use client';

import React, { Suspense } from 'react';
import { Register } from '@/views/Register';

function RegisterFormWrapper() {
  return <Register />;
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">Loading registration...</div>}>
      <RegisterFormWrapper />
    </Suspense>
  );
}
