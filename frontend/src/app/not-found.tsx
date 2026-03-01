import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg p-4 text-center">
      <div className="max-w-md w-full bg-dark-card p-10 rounded-2xl border border-white/5 shadow-2xl">
        <div className="mb-6 relative">
          <div className="text-9xl font-black text-primary/10 select-none">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
             <i className="fas fa-ghost text-5xl text-primary animate-bounce"></i>
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-white mb-4">Lost in Space?</h2>
        <p className="text-gray-400 mb-10 text-lg leading-relaxed">
          The page you&apos;re looking for has vanished or never existed. Let&apos;s get you back to safety.
        </p>
        
        <Link
          href="/"
          className="inline-flex items-center justify-center bg-primary hover:bg-primary-dark text-white font-bold py-4 px-10 rounded-full transition-all hover:scale-105 shadow-lg shadow-primary/20 group"
        >
          <i className="fas fa-home mr-2 group-hover:-translate-y-0.5 transition-transform"></i>
          Back to Base
        </Link>
      </div>
    </div>
  );
}
