'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Frontend Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg p-4">
      <div className="max-w-md w-full bg-dark-card p-8 rounded-xl border border-white/10 text-center">
        <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 text-red-500">
          <i className="fas fa-exclamation-triangle text-2xl"></i>
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">Something went wrong!</h2>
        <p className="text-gray-400 mb-8">
          We encountered an unexpected error while rendering this page. Our team has been notified.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="w-full bg-white/5 hover:bg-white/10 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Go back home
          </Link>
        </div>
      </div>
    </div>
  );
}
