export default function Loading() {
    return (
        <div className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-slate-900 border-t-transparent animate-spin"></div>
                </div>
                <p className="text-slate-900 font-medium text-lg animate-pulse">Yükleniyor...</p>
            </div>
        </div>
    );
}
