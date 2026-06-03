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
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/38">Redirecting</p>
        <h1 className="mt-4 text-3xl font-black tracking-tight">Opening Sitemendr Community</h1>
      </div>
    </main>
  );
}
