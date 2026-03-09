'use client';

import { useState, useEffect, useRef } from 'react';
import { getAllListings, getAllUsers, deleteUser, deleteListing, getAllMessages, toggleUserFeatured, getBotStatus, updateBotStatus, createAdminFakeListing, adminUpdateUser, adminUpdateListing, uploadPhotos, getAllVisitors } from '../../lib/listingService';
import { getAllPosts, deletePost, createAdminFakePost, adminUpdatePost } from '../../lib/communityService';
import AppHeader from '../../components/AppHeader';

export default function AdminPage() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');

    const [users, setUsers] = useState([]);
    const [listings, setListings] = useState([]);
    const [posts, setPosts] = useState([]);
    const [messages, setMessages] = useState([]);
    const [visitors, setVisitors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('summary');
    const [botStatus, setBotStatus] = useState({ postsEnabled: true, listingsEnabled: true });

    function handleLogin(e) {
        e.preventDefault();
        if (username === 'admin' && password === 'mustafa') {
            setIsLoggedIn(true);
            localStorage.setItem('adminAuth', 'true');
            loadData();
        } else {
            setLoginError('Hatalı kullanıcı adı veya şifre.');
        }
    }

    useEffect(() => {
        if (localStorage.getItem('adminAuth') === 'true') {
            setIsLoggedIn(true);
            loadData();
        }
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [u, l, p, m, v] = await Promise.all([
                getAllUsers(),
                getAllListings(),
                getAllPosts(),
                getAllMessages(),
                getAllVisitors()
            ]);
            setUsers(u);
            setListings(l);
            setPosts(p);
            setMessages(m);
            setVisitors(v);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }

        try {
            const status = await getBotStatus();
            setBotStatus(status);
        } catch (e) {
            console.error("Bot status fetch error:", e);
        }
    }

    async function handleToggleBot(key) {
        const newValue = !botStatus[key];
        setBotStatus(prev => ({ ...prev, [key]: newValue }));
        try {
            await updateBotStatus(key, newValue);
        } catch (e) {
            alert('Bot ayarı güncellenemedi');
        }
    }

    function handleLogout() {
        localStorage.removeItem('adminAuth');
        setIsLoggedIn(false);
    }

    async function handleToggleFeatured(userId, currentStatus) {
        if (!window.confirm(currentStatus ? 'Bu kullanıcının öne çıkarma özelliğini kaldırmak istiyor musunuz?' : 'Bu kullanıcıyı ve gönderilerini öne çıkarmak istiyor musunuz?')) return;
        try {
            const newStatus = await toggleUserFeatured(userId, currentStatus);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, isFeatured: newStatus } : u));
            alert('Kullanıcının öne çıkarma durumu başarıyla güncellendi.');
        } catch (e) {
            console.error(e);
            alert('Hata oluştu');
        }
    }

    async function handleDeleteUser(id) {
        if (!window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
        try {
            await deleteUser(id);
            setUsers(prev => prev.filter(u => u.id !== id));
        } catch (e) { alert('Hata oluştu'); }
    }

    async function handleDeleteListing(id) {
        if (!window.confirm('Bu ilanı silmek istediğinize emin misiniz?')) return;
        try {
            await deleteListing(id);
            setListings(prev => prev.filter(l => l.id !== id));
        } catch (e) { alert('Hata oluştu'); }
    }

    async function handleDeletePost(id) {
        if (!window.confirm('Bu paylaşımı silmek istediğinize emin misiniz?')) return;
        try {
            await deletePost(id);
            setPosts(prev => prev.filter(p => p.id !== id));
        } catch (e) { alert('Hata oluştu'); }
    }

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
                            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-black text-white">Yönetici Paneli</h1>
                        <p className="text-slate-400 text-sm mt-1">Lütfen devam etmek için giriş yapın.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Kullanıcı Adı</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600"
                                placeholder="admin"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Şifre</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600"
                                placeholder="••••••••"
                            />
                        </div>
                        {loginError && <p className="text-red-400 text-xs font-medium text-center">{loginError}</p>}
                        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] mt-2">
                            Giriş Yap
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <AppHeader />
            <div className="max-w-7xl mx-auto px-4 py-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Admin Dashboard</h1>
                        <p className="text-slate-500 font-medium">Platform Genel Bakış ve Yönetim</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm overflow-hidden">
                            <button
                                onClick={() => handleToggleBot('listingsEnabled')}
                                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all ${botStatus.listingsEnabled ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}
                            >
                                {botStatus.listingsEnabled ? 'İlan Botu Açık' : 'İlan Botu Kapalı'}
                            </button>
                            <button
                                onClick={() => handleToggleBot('postsEnabled')}
                                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all ${botStatus.postsEnabled ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}
                            >
                                {botStatus.postsEnabled ? 'Gönderi Botu Açık' : 'Gönderi Botu Kapalı'}
                            </button>
                        </div>
                        <button onClick={loadData} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2">
                            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Yenile
                        </button>
                        <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all shadow-md shadow-red-500/20">
                            Çıkış Yap
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
                    <Card title="Toplam Kullanıcı" value={users.length} icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" color="blue" />
                    <Card title="Toplam İlan" value={listings.length} icon="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" color="emerald" />
                    <Card title="Topluluk Gönderisi" value={posts.length} icon="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" color="amber" />
                    <Card title="Ağ Ziyaretçisi" value={visitors.length} icon="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" color="indigo" />
                    <Card title="Gönderilen Mesaj" value={messages.length} icon="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" color="rose" />
                </div>

                {/* Tabs */}
                <div className="flex gap-2 p-1 bg-slate-200/50 rounded-2xl w-full sm:w-fit mb-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
                    <Tab title="Özet" active={activeTab === 'summary'} onClick={() => setActiveTab('summary')} />
                    <Tab title="Ziyaretçiler" active={activeTab === 'visitors'} onClick={() => setActiveTab('visitors')} />
                    <Tab title="Kullanıcılar" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
                    <Tab title="İlanlar" active={activeTab === 'listings'} onClick={() => setActiveTab('listings')} />
                    <Tab title="Gönderiler" active={activeTab === 'posts'} onClick={() => setActiveTab('posts')} />
                    <Tab title="Mesajlar (DM)" active={activeTab === 'messages'} onClick={() => setActiveTab('messages')} />
                </div>

                {/* Tables */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                    {activeTab === 'summary' && <SummaryTab listings={listings} posts={posts} />}
                    {activeTab === 'visitors' && <VisitorsTab visitors={visitors} />}
                    {activeTab === 'users' && <UsersTab users={users} onDelete={handleDeleteUser} onToggleFeatured={handleToggleFeatured} />}
                    {activeTab === 'listings' && <ListingsTab listings={listings} users={users} onDelete={handleDeleteListing} onRefresh={loadData} />}
                    {activeTab === 'posts' && <PostsTab posts={posts} onDelete={handleDeletePost} onRefresh={loadData} />}
                    {activeTab === 'messages' && <MessagesTab messages={messages} />}
                </div>
            </div>
        </div>
    );
}

function Card({ title, value, icon, color }) {
    const colors = {
        blue: 'bg-blue-50 text-blue-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        amber: 'bg-amber-50 text-amber-600',
        indigo: 'bg-indigo-50 text-indigo-600',
        rose: 'bg-rose-50 text-rose-600',
    };
    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className={`w-12 h-12 ${colors[color]} rounded-2xl flex items-center justify-center mb-4`}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
                </svg>
            </div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-widest">{title}</div>
            <div className="text-3xl font-black text-slate-900 mt-1">{value.toLocaleString('tr-TR')}</div>
        </div>
    );
}

function Tab({ title, active, onClick }) {
    return (
        <button onClick={onClick} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {title}
        </button>
    );
}

function SummaryTab({ listings, posts }) {
    const all = [
        ...listings.map(l => ({ ...l, itemType: 'İlan' })),
        ...posts.map(p => ({ ...p, itemType: 'Topluluk', title: p.content.substring(0, 40) + '...' }))
    ].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 10);

    return (
        <div className="p-8">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <span className="w-2 h-8 bg-indigo-500 rounded-full"></span>
                En Çok İzlenen İçerikler
            </h2>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-100 italic">
                            <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Tür</th>
                            <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Başlık_İçerik</th>
                            <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Sahibi</th>
                            <th className="text-right py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">İzlenme</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {all.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-4 px-4">
                                    <span className={`text-[10px] font-black px-2 py-1 rounded-md ${item.itemType === 'İlan' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {item.itemType.toUpperCase()}
                                    </span>
                                </td>
                                <td className="py-4 px-4 text-sm font-bold text-slate-900">{item.title}</td>
                                <td className="py-4 px-4 text-sm text-slate-500">{item.userName}</td>
                                <td className="py-4 px-4 text-right">
                                    <span className="bg-slate-900 text-white text-xs font-black px-3 py-1 rounded-full border border-white/10">{item.views || 0}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function VisitorsTab({ visitors }) {
    const [viewMode, setViewMode] = useState('grouped'); // 'grouped' or 'raw'

    // Grouping logic
    const grouped = visitors.reduce((acc, v) => {
        const ip = v.ip || 'Bilinmiyor';
        if (!acc[ip]) {
            acc[ip] = {
                ip,
                count: 0,
                lastVisit: null,
                paths: new Set(),
                platforms: new Set(),
                userAgents: new Set(),
                latestPath: '',
                latestPlatform: ''
            };
        }
        acc[ip].count += 1;
        const vDate = v.timestamp?.seconds ? new Date(v.timestamp.seconds * 1000) : null;
        if (!acc[ip].lastVisit || (vDate && vDate > acc[ip].lastVisit)) {
            acc[ip].lastVisit = vDate;
            acc[ip].latestPath = v.path || '/';
            acc[ip].latestPlatform = v.platform || '-';
        }
        acc[ip].paths.add(v.path || '/');
        acc[ip].platforms.add(v.platform || '-');
        acc[ip].userAgents.add(v.userAgent);
        return acc;
    }, {});

    const sortedGroups = Object.values(grouped).sort((a, b) => (b.lastVisit || 0) - (a.lastVisit || 0));

    return (
        <div className="p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-8 bg-indigo-500 rounded-full"></span>
                    Ziyaretçi Analizi
                </h2>
                <div className="flex bg-slate-100 p-1 rounded-xl self-start">
                    <button
                        onClick={() => setViewMode('grouped')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'grouped' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        IP Gruplu
                    </button>
                    <button
                        onClick={() => setViewMode('raw')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'raw' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Tüm Loglar
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                {viewMode === 'grouped' ? (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 italic">
                                <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">IP Adresi</th>
                                <th className="text-center py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Hit</th>
                                <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Son Aktivite</th>
                                <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Son Görülen Sayfa</th>
                                <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Cihazlar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {sortedGroups.map(g => (
                                <tr key={g.ip} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-4 px-4">
                                        <div className="text-xs font-black text-indigo-600 font-mono">{g.ip}</div>
                                        <div className="text-[9px] text-slate-400 mt-0.5 truncate max-w-[150px]">{Array.from(g.userAgents)[0]?.substring(0, 50)}...</div>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <span className="bg-slate-900 text-white text-[10px] font-black px-2.5 py-1 rounded-full">{g.count}</span>
                                    </td>
                                    <td className="py-4 px-4 text-xs font-bold text-slate-700 whitespace-nowrap">
                                        {g.lastVisit ? g.lastVisit.toLocaleString('tr-TR') : '-'}
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded text-[10px] font-black uppercase">
                                            {g.latestPath}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="flex flex-wrap gap-1">
                                            {Array.from(g.platforms).map((p, i) => (
                                                <span key={i} className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                    {p}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 italic">
                                <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Tarih / Saat</th>
                                <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">IP Adresi</th>
                                <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Sayfa</th>
                                <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Cihaz / Platform</th>
                                <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Tarayıcı Bilgisi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {visitors.map(v => (
                                <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-4 px-4 text-xs font-bold text-slate-700 whitespace-nowrap">
                                        {v.timestamp?.seconds ? new Date(v.timestamp.seconds * 1000).toLocaleString('tr-TR') : '-'}
                                    </td>
                                    <td className="py-4 px-4 text-xs font-black text-indigo-600 font-mono">
                                        {v.ip || 'Bilinmiyor'}
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold">
                                            {v.path || '/'}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-xs font-medium text-slate-600">
                                        {v.platform || '-'} / {v.language || '-'}
                                    </td>
                                    <td className="py-4 px-4 text-[10px] font-medium text-slate-400 max-w-xs truncate" title={v.userAgent}>
                                        {v.userAgent}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}


function UserRow({ u, onDelete, onToggleFeatured, isRealUser }) {
    const [isVisible, setIsVisible] = useState(false);
    const [phone, setPhone] = useState(u.phone || '');
    const [password, setPassword] = useState(u.password || '');
    const [badgesInput, setBadgesInput] = useState((u.badges || []).join(', '));
    const [loading, setLoading] = useState(false);

    async function handleUpdate() {
        setLoading(true);
        try {
            const badgesArr = badgesInput.split(',').map(s => s.trim()).filter(Boolean);
            await adminUpdateUser(u.id, { phone, password, badges: badgesArr });
            alert('Güncellendi');
        } catch (e) {
            alert('Hata!');
        } finally {
            setLoading(false);
        }
    }

    return (
        <tr className={isRealUser ? "bg-emerald-50/50" : ""}>
            <td className="py-4 px-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border ${isRealUser ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    {(u.displayName || 'U')[0]}
                </div>
                <div className="flex flex-col text-slate-900 font-bold text-xs">
                    {u.displayName}
                </div>
            </td>
            <td className="py-4 px-4">
                <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold" />
            </td>
            <td className="py-4 px-4">
                <input
                    value={badgesInput}
                    onChange={e => setBadgesInput(e.target.value)}
                    placeholder="premium, pati_dostu..."
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[10px] font-bold"
                />
            </td>
            <td className="py-4 px-4">
                <div className="flex items-center gap-1">
                    <input type={isVisible ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="w-20 bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold" />
                    <button onClick={handleUpdate} disabled={loading} className="bg-indigo-600 text-white p-1.5 rounded">{loading ? '...' : '✓'}</button>
                </div>
            </td>
            <td className="py-4 px-4 text-xs">
                {u.createdAt?.seconds ? new Date(u.createdAt.seconds * 1000).toLocaleDateString() : '-'}
            </td>
            <td className="py-4 px-4 text-right flex gap-1 justify-end">
                <button onClick={() => onToggleFeatured(u.id, u.isFeatured)} className="p-1.5 bg-amber-500 text-white rounded text-[10px] font-bold uppercase tracking-tighter">KING</button>
                <button onClick={() => onDelete(u.id)} className="p-1.5 bg-slate-100 text-slate-400 rounded hover:text-red-500 hover:bg-red-50 transition-all">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </td>
        </tr>
    );
}

function UsersTab({ users, onDelete, onToggleFeatured, onRefresh }) {
    const [qName, setQName] = useState('');
    const [qPhone, setQPhone] = useState('');
    const [qPassword, setQPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [visiblePassIds, setVisiblePassIds] = useState(new Set());

    const togglePass = (id) => {
        const next = new Set(visiblePassIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setVisiblePassIds(next);
    };

    async function handleQuickSubmit(e) {
        e.preventDefault();
        if (!qName || !qPhone || !qPassword) return;
        setLoading(true);
        try {
            await createAdminQuickUser({ displayName: qName.trim(), phone: qPhone.trim(), password: qPassword.trim() });
            setQName('');
            setQPhone('');
            setQPassword('');
            if (onRefresh) onRefresh();
        } catch (e) { alert("Hata"); }
        finally { setLoading(false); }
    }

    return (
        <div className="p-8">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
                Tüm Kullanıcılar
            </h2>

            {/* Quick User Creation */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 mb-8">
                <h3 className="font-bold text-blue-900 mb-4 text-xs uppercase tracking-widest flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                    Hızlı Kullanıcı / Bot Oluştur
                </h3>
                <form onSubmit={handleQuickSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">İsim Soyisim</label>
                        <input value={qName} onChange={e => setQName(e.target.value)} type="text" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none" placeholder="Örn: Ayşe Fatma" required />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Telefon</label>
                        <input value={qPhone} onChange={e => setQPhone(e.target.value)} type="text" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none" placeholder="05XX XXX XX XX" required />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Admin Şifresi</label>
                        <input value={qPassword} onChange={e => setQPassword(e.target.value)} type="text" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none" placeholder="Gizli Şifre" required />
                    </div>
                    <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase py-2.5 px-4 rounded-lg tracking-widest transition-all">
                        {loading ? 'Oluşturuluyor...' : 'HEMEN OLUŞTUR'}
                    </button>
                </form>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-100 font-black italic">
                            <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Kullanıcı / ID</th>
                            <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Telefon No</th>
                            <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Rozetler (Virgülle)</th>
                            <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Şifre / Güncelle</th>
                            <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Kayıt</th>
                            <th className="text-right py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Aksiyon</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {users.map(u => (
                            <UserRow key={u.id} u={u} onDelete={onDelete} onToggleFeatured={onToggleFeatured} isRealUser={!u.isBot} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function ListingRow({ l, onDelete }) {
    const [title, setTitle] = useState(l.title || '');
    const [city, setCity] = useState(l.city || '');
    const [concept, setConcept] = useState(l.concept || 'takas');
    const [description, setDescription] = useState(l.description || '');
    const [userPhone, setUserPhone] = useState(l.userPhone || '');
    const [photos, setPhotos] = useState(l.photos || []);
    const [loading, setLoading] = useState(false);
    const fileRef = useRef(null);

    async function handleUpdate() {
        setLoading(true);
        try {
            await adminUpdateListing(l.id, {
                title: title.trim(),
                city: city.trim(),
                concept,
                description: description.trim(),
                userPhone: userPhone.trim(),
                photos
            });
            alert('İlan başarıyla güncellendi.');
        } catch (e) {
            alert('Hata!');
        } finally {
            setLoading(false);
        }
    }

    async function onAddPhoto(e) {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        setLoading(true);
        try {
            const urls = await uploadPhotos(files);
            setPhotos(prev => [...prev, ...urls]);
        } catch (e) { alert("Yükleme hatası"); }
        finally { setLoading(false); }
    }

    return (
        <tr className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-none">
            {/* Foto & Başlık */}
            <td className="py-4 px-4">
                <div className="flex items-center gap-3">
                    <div className="relative flex items-center -space-x-2 overflow-visible">
                        {photos.slice(0, 3).map((src, i) => (
                            <div key={i} className="relative group/mini">
                                <img src={src} className="w-9 h-9 rounded-xl border-2 border-white object-cover shadow-sm ring-1 ring-slate-100" />
                                <button
                                    onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-3.5 h-3.5 text-[7px] flex items-center justify-center opacity-0 group-hover/mini:opacity-100 transition-opacity z-20"
                                >✕</button>
                            </div>
                        ))}
                        <button
                            onClick={() => fileRef.current?.click()}
                            className="w-9 h-9 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 text-slate-400 flex items-center justify-center text-xs hover:bg-slate-100 transition-colors z-10"
                        >
                            {loading ? '..' : '+'}
                        </button>
                        <input type="file" ref={fileRef} className="hidden" multiple accept="image/*" onChange={onAddPhoto} />
                    </div>
                    <div className="flex-1 min-w-[120px]">
                        <input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-sm font-black text-slate-800 w-full p-0 outline-none"
                            placeholder="Başlık..."
                        />
                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">İlan ID: {l.id.slice(-6)}</div>
                    </div>
                </div>
            </td>

            {/* Kategori & Tür */}
            <td className="py-4 px-4">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black px-2 py-0.5 bg-slate-100 rounded text-slate-500 w-fit">{l.category}</span>
                    <select
                        value={concept}
                        onChange={e => setConcept(e.target.value)}
                        className="text-[10px] font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0 cursor-pointer w-fit"
                    >
                        <option value="takas">Takas</option>
                        <option value="sahiplendirme">Sahiplendirme</option>
                        <option value="bedelsiz">Ücretsiz</option>
                        <option value="geridonusum">Geri Dönüşüm</option>
                        <option value="odunc">Ödünç</option>
                    </select>
                </div>
            </td>

            {/* Bölge & Telefon */}
            <td className="py-4 px-4">
                <div className="flex flex-col gap-1">
                    <input
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        className="bg-transparent border-none focus:ring-0 text-xs font-bold text-slate-600 p-0 w-24 outline-none"
                        placeholder="Şehir"
                    />
                    <input
                        value={userPhone}
                        onChange={e => setUserPhone(e.target.value)}
                        className="bg-transparent border-none focus:ring-0 text-[11px] font-black text-indigo-600 p-0 w-24 outline-none"
                        placeholder="05XX..."
                    />
                </div>
            </td>

            {/* Açıklama Area */}
            <td className="py-4 px-4 min-w-[200px]">
                <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-lg p-2 text-[11px] font-medium text-slate-600 resize-y min-h-[40px] focus:ring-1 focus:ring-slate-200 outline-none"
                    placeholder="İlan açıklaması..."
                />
            </td>

            {/* İstatistik & Save */}
            <td className="py-4 px-4">
                <div className="flex items-center gap-2">
                    <div className="flex flex-col items-center bg-slate-900 text-white px-2 py-1 rounded-lg">
                        <span className="text-[10px] font-black leading-none">{l.views || 0}</span>
                        <span className="text-[7px] uppercase font-bold opacity-50">Göz</span>
                    </div>
                    <button
                        onClick={handleUpdate}
                        disabled={loading}
                        className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-100 hover:bg-emerald-500 active:scale-95 transition-all disabled:opacity-50"
                    >
                        <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </button>
                </div>
            </td>

            {/* Delete */}
            <td className="py-4 px-4 text-right">
                <button onClick={() => onDelete(l.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </td>
        </tr>
    );
}

function ListingsTab({ listings, users = [], onDelete, onRefresh }) {
    const [userSearch, setUserSearch] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('Diğer');
    const [concept, setConcept] = useState('takas');
    const [city, setCity] = useState('İstanbul');
    const [desc, setDesc] = useState('');
    const [photoFiles, setPhotoFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [loading, setLoading] = useState(false);

    // Search filter for user combobox
    const filteredUsers = users.filter(u =>
        u.displayName?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.phone?.includes(userSearch)
    );

    function handleFileChange(e) {
        const files = Array.from(e.target.files).slice(0, 5);
        setPhotoFiles(files);

        // Previews
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPreviews(newPreviews);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const selectedUser = users.find(u => u.id === selectedUserId);
        if (!selectedUser || !title.trim()) {
            alert("Lütfen bir ilan sahibi seçin.");
            return;
        }

        setLoading(true);
        try {
            await createAdminFakeListing({
                userName: selectedUser.displayName,
                userPhone: selectedUser.phone,
                userId: selectedUser.id,
                title: title.trim(),
                category,
                concept,
                city,
                description: desc.trim(),
                userIsFeatured: selectedUser.isFeatured || false
            }, photoFiles);
            setSelectedUserId('');
            setTitle('');
            setDesc('');
            setPhotoFiles([]);
            setPreviews([]);
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error(err);
            alert("Hata!");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-8">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <span className="w-2 h-8 bg-emerald-500 rounded-full"></span>
                Yayındaki İlanlar
            </h2>

            {/* Manuel İlan Ekleme Formu */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8">
                <h3 className="font-bold text-slate-800 mb-4 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    Manuel İlan Ekle (Sistem Yöneticisi)
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="sm:col-span-1">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fotoğraflar (Max 5)</label>
                            <p className="text-[10px] text-amber-600 font-bold mb-1 italic">Not: 30 gün süreli</p>
                            <div className="relative group min-h-[80px] border-2 border-dashed border-slate-300 rounded-xl hover:border-emerald-500 transition-colors flex flex-col items-center justify-center p-2 bg-white">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                />
                                {previews.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-1 w-full h-full overflow-hidden">
                                        {previews.slice(0, 5).map((p, i) => (
                                            <img key={i} src={p} className="w-full h-10 object-cover rounded" />
                                        ))}
                                        {previews.length > 5 && <div className="text-[10px] font-bold text-slate-400 flex items-center justify-center">+{previews.length - 5}</div>}
                                    </div>
                                ) : (
                                    <>
                                        <svg className="w-6 h-6 text-slate-400 group-hover:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        <span className="text-[10px] text-slate-400 font-bold mt-1 group-hover:text-emerald-600">YÜKLE</span>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="sm:col-span-1 flex flex-col gap-2">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">İlan Sahibi Ara & Seç</label>
                                <input
                                    type="text"
                                    value={userSearch}
                                    onChange={e => setUserSearch(e.target.value)}
                                    placeholder="İsim veya tel ile ara..."
                                    className="w-full border border-slate-300 rounded-t-lg px-2 py-1 text-xs outline-none bg-white font-medium mb-0"
                                />
                                <select
                                    value={selectedUserId}
                                    onChange={e => setSelectedUserId(e.target.value)}
                                    className="w-full border border-slate-300 border-t-0 rounded-b-lg px-3 py-2 text-[13px] focus:ring-1 focus:ring-slate-800 outline-none bg-white font-bold"
                                    required
                                >
                                    <option value="">Seçim yapın...</option>
                                    {filteredUsers.map(u => (
                                        <option key={u.id} value={u.id}>
                                            {u.displayName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="sm:col-span-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">İlan Başlığı</label>
                            <input value={title} onChange={e => setTitle(e.target.value)} type="text" placeholder="Örn: 2023 Model Bisiklet" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-slate-800 outline-none font-medium" required />
                        </div>
                        <div className="sm:col-span-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Şehir</label>
                            <input value={city} onChange={e => setCity(e.target.value)} type="text" placeholder="İstanbul" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-slate-800 outline-none font-medium" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Kategori</label>
                            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-slate-800 outline-none">
                                <option value="Elektronik">Elektronik</option>
                                <option value="Mutfak">Mutfak</option>
                                <option value="Ev Eşyası">Ev Eşyası</option>
                                <option value="Kitap">Kitap</option>
                                <option value="Hizmet">Hizmet</option>
                                <option value="Diğer">Diğer</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">İlan Konsepti</label>
                            <select value={concept} onChange={e => setConcept(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-slate-800 outline-none">
                                <option value="takas">Takas</option>
                                <option value="sahiplendirme">Sahiplendirme</option>
                                <option value="bedelsiz">Ücretsiz</option>
                                <option value="geridonusum">Geri Dönüşüm</option>
                                <option value="odunc">Ödünç</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Açıklama</label>
                        <textarea value={desc} onChange={e => setDesc(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-slate-800 outline-none min-h-[80px]" placeholder="İlan detayları..." required></textarea>
                    </div>
                    <button type="submit" disabled={loading} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 disabled:opacity-50 transition-all flex items-center gap-2">
                        {loading ? "Ekleniyor..." : "Manuel İlanı Sisteme Bas"}
                    </button>
                </form>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-100 italic">
                            <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">İlan & Foto</th>
                            <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Kategori / Tür</th>
                            <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Bölge / Tel</th>
                            <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Açıklama</th>
                            <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">İstatistik</th>
                            <th className="text-right py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Aksiyon</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {listings.map(l => (
                            <ListingRow key={l.id} l={l} onDelete={onDelete} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function PostRow({ p, onDelete }) {
    const [content, setContent] = useState(p.content || '');
    const [type, setType] = useState(p.type || 'soru');
    const [imageUrl, setImageUrl] = useState(p.imageUrl || null);
    const [loading, setLoading] = useState(false);
    const fileRef = useRef(null);

    async function handleUpdate() {
        setLoading(true);
        try {
            await adminUpdatePost(p.id, { content, type, imageUrl });
            alert('Güncellendi');
        } catch (e) {
            alert('Hata!');
        } finally {
            setLoading(false);
        }
    }

    async function onUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        setLoading(true);
        try {
            const urls = await uploadPhotos([file]);
            setImageUrl(urls[0]);
        } catch (e) { alert("Hata"); }
        finally { setLoading(false); }
    }

    return (
        <tr className="hover:bg-slate-50/50 transition-colors">
            <td className="py-4 px-4">
                <div className="flex items-center gap-4">
                    <div
                        onClick={() => fileRef.current?.click()}
                        className="relative w-12 h-12 flex-shrink-0 cursor-pointer group/postphoto"
                    >
                        {imageUrl ? (
                            <img src={imageUrl} className="w-full h-full rounded-xl object-cover border border-slate-200 shadow-sm" />
                        ) : (
                            <div className="w-full h-full rounded-xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center text-[8px] text-slate-400 font-black">EKLE</div>
                        )}
                        <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover/postphoto:opacity-100 flex items-center justify-center transition-opacity">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        </div>
                        <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={onUpload} />
                    </div>
                    <div className="flex-1">
                        <textarea
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-800 resize-none min-h-[40px]"
                        />
                        <div className="text-[10px] text-slate-400 mt-1">Yazar: {p.userName}</div>
                    </div>
                </div>
            </td>
            <td className="py-4 px-4">
                <select
                    value={type}
                    onChange={e => setType(e.target.value)}
                    className="text-[10px] font-bold px-2 py-1 bg-slate-100 rounded text-slate-600 uppercase border-none outline-none appearance-none"
                >
                    <option value="soru">Soru</option>
                    <option value="talep">Talep</option>
                </select>
            </td>
            <td className="py-4 px-4 text-xs font-medium text-slate-500">
                {p.commentCount || 0} Y / {p.likeCount || 0} B
            </td>
            <td className="py-4 px-4">
                <div className="flex items-center gap-2">
                    <span className="bg-slate-900 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{p.views || 0}</span>
                    <button onClick={handleUpdate} disabled={loading} className="text-emerald-600 hover:scale-110 active:scale-95 transition-all">
                        {loading ? '...' : '✓'}
                    </button>
                </div>
            </td>
            <td className="py-4 px-4 text-right">
                <button onClick={() => onDelete(p.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </td>
        </tr>
    );
}

function PostsTab({ posts, onDelete, onRefresh }) {
    const [fakeName, setFakeName] = useState('');
    const [fakeContent, setFakeContent] = useState('');
    const [fakeType, setFakeType] = useState('soru');
    const [loading, setLoading] = useState(false);

    async function handleFakeSubmit(e) {
        e.preventDefault();
        if (!fakeName.trim() || !fakeContent.trim()) return;
        setLoading(true);
        try {
            await createAdminFakePost({ content: fakeContent.trim(), type: fakeType, userName: fakeName.trim() });
            setFakeName('');
            setFakeContent('');
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error(err);
            alert("Hata oluştu.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-8">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <span className="w-2 h-8 bg-amber-500 rounded-full"></span>
                Topluluk Paylaşımları
            </h2>

            {/* Fake Gönderi Formu */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8">
                <h3 className="font-bold text-slate-800 mb-4 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    Manuel Bot (Sahte İsimle Paylaşım Yap)
                </h3>
                <form onSubmit={handleFakeSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Sahte İsim</label>
                            <input value={fakeName} onChange={e => setFakeName(e.target.value)} type="text" placeholder="Örn: Ahmet Yılmaz" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-slate-800 outline-none" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Gönderi Türü</label>
                            <select value={fakeType} onChange={e => setFakeType(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-slate-800 outline-none">
                                <option value="soru">Soru</option>
                                <option value="talep">Talep</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">İçerik</label>
                        <textarea value={fakeContent} onChange={e => setFakeContent(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-slate-800 outline-none min-h-[60px]" placeholder="Konu nedir?" required></textarea>
                    </div>
                    <button type="submit" disabled={loading} className="px-5 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center gap-2">
                        {loading ? "Gönderiliyor..." : "Bot Gönderisi Ekle"}
                    </button>
                </form>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-100 italic">
                            <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">İçerik</th>
                            <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Tür</th>
                            <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Etkileşim</th>
                            <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">İzlenme</th>
                            <th className="text-right py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">İşlem</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {posts.map(p => (
                            <PostRow key={p.id} p={p} onDelete={onDelete} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function MessagesTab({ messages }) {
    return (
        <div className="p-8">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <span className="w-2 h-8 bg-rose-500 rounded-full"></span>
                Kullanıcı Özel Mesajları (DM)
            </h2>
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Gizlilik Uyarı: Bu ekran sadece sistem yöneticileri tarafından güvenlik ihlallerini (dolandırıcılık, platform dışı ödeme vs.) denetlemek amacıyla kullanılmalıdır.
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-100 italic">
                            <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Gönderen</th>
                            <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Alıcı ID</th>
                            <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px] w-1/2">Mesaj İçeriği</th>
                            <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Tarih</th>
                            <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Durum</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {messages.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="py-8 text-center text-slate-500 text-sm font-medium">Henüz mesaj bulunmuyor.</td>
                            </tr>
                        ) : (
                            messages.map(m => (
                                <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 px-4">
                                        <div className="text-sm font-bold text-slate-900">{m.senderName || 'İsimsiz'}</div>
                                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{m.senderId?.substring(0, 8)}...</div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="text-[10px] text-indigo-600 bg-indigo-50 font-mono px-2 py-1 rounded inline-block">
                                            {m.receiverId?.substring(0, 8)}...
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700 font-medium">
                                            {m.text}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-xs font-medium text-slate-500">
                                        {m.createdAt?.seconds ? new Date(m.createdAt.seconds * 1000).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
                                    </td>
                                    <td className="py-4 px-4">
                                        {m.read ? (
                                            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">Okundu</span>
                                        ) : (
                                            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">Okunmadı</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
