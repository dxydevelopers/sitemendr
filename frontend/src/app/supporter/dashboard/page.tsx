'use client';

import { useEffect } from 'react';

export default function LegacySupporterDashboardPage() {
  useEffect(() => {
    window.location.replace('/dashboard/supporter');
  }, []);

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-ai-blue/20 border-t-ai-blue rounded-full animate-spin" />
    </main>
  );
}
