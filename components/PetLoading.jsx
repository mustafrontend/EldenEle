'use client';

export default function PetLoading({ message = "Pati izleri takip ediliyor..." }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 w-full">
            <div className="relative w-20 h-20 mb-6">
                {/* Main Paw Base */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-[1.5rem] animate-pulse"></div>
                </div>

                {/* Paw Pads with Individual Animations */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-orange-200 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="absolute top-2 left-2 w-4 h-4 bg-orange-200 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="absolute top-2 right-2 w-4 h-4 bg-orange-200 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>

                {/* Walking Effect (Moving Dots) */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-ping" style={{ animationDelay: '0s' }}></div>
                    <div className="w-1.5 h-1.5 bg-orange-300 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1.5 h-1.5 bg-orange-200 rounded-full animate-ping" style={{ animationDelay: '0.4s' }}></div>
                </div>
            </div>

            <div className="flex flex-col items-center gap-1">
                <span className="text-slate-900 font-black text-xs uppercase tracking-[0.2em] animate-pulse">
                    {message}
                </span>
                <div className="w-32 h-1 bg-slate-100 rounded-full overflow-hidden mt-2">
                    <div className="w-full h-full bg-gradient-to-r from-orange-400 to-orange-200 origin-left animate-loading-bar"></div>
                </div>
            </div>

            <style jsx>{`
                @keyframes loading-bar {
                    0% { transform: scaleX(0); }
                    50% { transform: scaleX(0.7); }
                    100% { transform: scaleX(1); }
                }
                .animate-loading-bar {
                    animation: loading-bar 2s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
}
