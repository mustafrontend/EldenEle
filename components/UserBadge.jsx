export default function UserBadge({ badges = [] }) {
    if (!badges || !Array.isArray(badges) || badges.length === 0) return null;

    const BADGE_CONFIG = {
        'premium': {
            label: 'Premium',
            icon: '💎',
            colors: 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border-indigo-200'
        },
        'onayli': {
            label: 'Onaylı Profil',
            icon: '✓',
            colors: 'bg-emerald-50 text-emerald-600 border-emerald-200'
        },
        'pati_dostu': {
            label: 'Pati Dostu',
            icon: '🐾',
            colors: 'bg-orange-50 text-orange-600 border-orange-200'
        },
        'topluluk_lideri': {
            label: 'Lider',
            icon: '🌟',
            colors: 'bg-amber-50 text-amber-600 border-amber-200'
        },
        'yeni_uye': {
            label: 'Yeni Üye',
            icon: '🌱',
            colors: 'bg-green-50 text-green-600 border-green-200'
        },
        'usta': {
            label: 'Usta',
            icon: '🔧',
            colors: 'bg-slate-100 text-slate-700 border-slate-300'
        }
    };

    return (
        <div className="flex items-center gap-1.5 shrink-0">
            {badges.map(b => {
                const config = BADGE_CONFIG[b];
                if (!config) return null;
                return (
                    <span
                        key={b}
                        title={config.label}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-black tracking-wider uppercase shadow-sm cursor-default select-none ${config.colors}`}
                    >
                        <span className="text-[10px] leading-none">{config.icon}</span>
                        {config.label}
                    </span>
                );
            })}
        </div>
    );
}
