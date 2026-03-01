export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-dark-bg">
      <div className="relative w-24 h-24">
        {/* Outer pulse */}
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
        
        {/* Inner rotating ring */}
        <div className="absolute inset-0 rounded-full border-t-4 border-r-4 border-primary border-transparent animate-spin"></div>
        
        {/* Center logo/dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-primary shadow-lg shadow-primary/50"></div>
        </div>
      </div>
      
      <div className="mt-8 flex flex-col items-center gap-2">
        <h3 className="text-xl font-bold text-white tracking-widest uppercase">Initializing</h3>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"></div>
        </div>
      </div>
    </div>
  );
}
