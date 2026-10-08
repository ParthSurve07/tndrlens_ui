'use client';

import React from 'react';
import { Landing } from '@/views/Landing';

export default function LandingPage() {
  return <Landing onEnter={() => { window.location.href = '/login'; }} />;
}
