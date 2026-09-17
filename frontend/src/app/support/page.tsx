'use client';

import { useEffect } from 'react';

export default function SupportRedirectPage() {
  useEffect(() => {
    const query = window.location.search || '';
    window.location.replace(`/community${query}`);
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-[#05070a] px-6 text-center text-white">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-white/36">Redirecting</p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">Opening Sitemendr Community</h1>
      </div>
    </main>
  );
}
