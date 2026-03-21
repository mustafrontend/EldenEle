'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { getAllListings, getAllUsers, deleteUser, deleteListing, getAllMessages, toggleUserFeatured, getBotStatus, updateBotStatus, createAdminFakeListing, adminUpdateUser, adminUpdateListing, uploadPhotos, getAllVisitors, getAllNews, createNews, updateNews, deleteNews } from '../../lib/listingService';
import { getAllPosts, deletePost, createAdminFakePost, adminUpdatePost, subscribeComments, createComment } from '../../lib/communityService';
import AppHeader from '../../components/AppHeader';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Global WhatsApp API Helper
const sendWA = async (phone, body) => {
    if (!phone) return toast.error('Telefon numarası bulunamadı!');
    const tid = toast.loading('WhatsApp gönderiliyor...');
    try {
        const res = await fetch('/api/whatsapp/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: phone, body })
        });
        const data = await res.json();
        if (data.success) {
            toast.success('Mesaj başarıyla gönderildi! 🐾', { id: tid });
        } else {
            toast.error('Hata: ' + data.error, { id: tid });
        }
    } catch (e) {
        toast.error('Gönderim sırasında hata oluştu!', { id: tid });
    }
};

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
    const [news, setNews] = useState([]);
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
            const [u, l, p, m, v, n] = await Promise.all([
                getAllUsers(),
                getAllListings(),
                getAllPosts(),
                getAllMessages(),
                getAllVisitors(),
                getAllNews()
            ]);
            setUsers(u);
            setListings(l);
            setPosts(p);
            setMessages(m);
            setVisitors(v);
            setNews(n);
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
            toast.error('Bot ayarı güncellenemedi');
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
            toast.success('Kullanıcı durumu güncellendi.');
        } catch (e) {
            console.error(e);
            toast.error('Hata oluştu');
        }
    }

    async function handleDeleteUser(id) {
        if (!window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
        try {
            await deleteUser(id);
            setUsers(prev => prev.filter(u => u.id !== id));
            toast.success('Kullanıcı silindi.');
        } catch (e) { toast.error('Hata oluştu'); }
    }

    async function handleDeleteListing(id) {
        if (!window.confirm('Bu ilanı silmek istediğinize emin misiniz?')) return;
        try {
            await deleteListing(id);
            setListings(prev => prev.filter(l => l.id !== id));
            toast.success('İlan silindi.');
        } catch (e) { toast.error('Hata oluştu'); }
    }

    async function handleDeletePost(id) {
        if (!window.confirm('Bu paylaşımı silmek istediğinize emin misiniz?')) return;
        try {
            await deletePost(id);
            setPosts(prev => prev.filter(p => p.id !== id));
            toast.success('Paylaşım silindi.');
        } catch (e) { toast.error('Hata oluştu'); }
    }

    async function handleDeleteNews(id) {
        if (!window.confirm('Bu duyuruyu silmek istediğinize emin misiniz?')) return;
        try {
            await deleteNews(id);
            setNews(prev => prev.filter(n => n.id !== id));
            toast.success('Duyuru silindi.');
        } catch (e) { toast.error('Hata oluştu'); }
    }

    async function handleToggleNewsActive(id, currentStatus) {
        try {
            await updateNews(id, { isActive: !currentStatus });
            setNews(prev => prev.map(n => n.id === id ? { ...n, isActive: !currentStatus } : n));
            toast.success('Duyuru durumu güncellendi.');
        } catch (e) {
            console.error("Duyuru güncelleme hatası:", e);
            toast.error('Hata: ' + (e.message || 'Bilinmeyen hata'));
        }
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 mb-10">
                    <Card title="Toplam Kullanıcı" value={users.length} icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" color="blue" />
                    <Card title="Toplam İlan" value={listings.length} icon="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" color="emerald" />
                    <Card title="Topluluk Gönderisi" value={posts.length} icon="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" color="amber" />
                    <Card title="Ağ Ziyaretçisi" value={visitors.length} icon="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" color="indigo" />
                    <Card title="Gönderilen Mesaj" value={messages.length} icon="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" color="rose" />
                    <Card title="WhatsApp Tıklama" value={listings.reduce((sum, l) => sum + (l.whatsappClicks || 0), 0)} icon="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" color="emerald" />
                </div>

                {/* Tabs */}
                <div className="flex gap-2 p-1 bg-slate-200/50 rounded-2xl w-full sm:w-fit mb-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
                    <Tab title="Özet" active={activeTab === 'summary'} onClick={() => setActiveTab('summary')} />
                    <Tab title="Webmaster AI 🤖" active={activeTab === 'webmaster'} onClick={() => setActiveTab('webmaster')} />
                    <Tab title="Ziyaretçiler" active={activeTab === 'visitors'} onClick={() => setActiveTab('visitors')} />
                    <Tab title="Kullanıcılar" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
                    <Tab title="İlanlar" active={activeTab === 'listings'} onClick={() => setActiveTab('listings')} />
                    <Tab title="Gönderiler" active={activeTab === 'posts'} onClick={() => setActiveTab('posts')} />
                    <Tab title="Mesajlar (DM)" active={activeTab === 'messages'} onClick={() => setActiveTab('messages')} />
                    <Tab title="Duyurular (Haberler)" active={activeTab === 'news'} onClick={() => setActiveTab('news')} />
                </div>

                {/* Tables */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                    {activeTab === 'summary' && <SummaryTab listings={listings} posts={posts} visitors={visitors} />}
                    {activeTab === 'webmaster' && <WebmasterTab users={users} listings={listings} visitors={visitors} news={news} posts={posts} />}
                    {activeTab === 'visitors' && <VisitorsTab visitors={visitors} />}
                    {activeTab === 'users' && <UsersTab users={users} onDelete={handleDeleteUser} onToggleFeatured={handleToggleFeatured} onRefresh={loadData} />}
                    {activeTab === 'listings' && <ListingsTab listings={listings} users={users} onDelete={handleDeleteListing} onRefresh={loadData} />}
                    {activeTab === 'posts' && <PostsTab posts={posts} onDelete={handleDeletePost} onRefresh={loadData} />}
                    {activeTab === 'messages' && <MessagesTab messages={messages} users={users} listings={listings} />}
                    {activeTab === 'news' && <NewsTab news={news} onDelete={handleDeleteNews} onToggleActive={handleToggleNewsActive} onRefresh={loadData} />}
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

function SummaryTab({ listings, posts, visitors }) {
    const totalViews = listings.reduce((sum, l) => sum + (l.views || 0), 0) + posts.reduce((sum, p) => sum + (p.views || 0), 0);
    const totalWhatsApp = listings.reduce((sum, l) => sum + (l.whatsappClicks || 0), 0);
    const totalVisitors = visitors.length;

    // Timeline logic for visitors
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        d.setHours(0, 0, 0, 0);
        return {
            dateStr: d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'narrow' }),
            timestamp: d.getTime(),
            visitors: 0
        };
    });

    visitors.forEach(v => {
        if (!v.timestamp?.seconds) return;
        const vDate = new Date(v.timestamp.seconds * 1000);
        vDate.setHours(0, 0, 0, 0);
        const dayMatch = last7Days.find(d => d.timestamp === vDate.getTime());
        if (dayMatch) {
            dayMatch.visitors += 1;
        }
    });

    const visitorsToday = last7Days[6].visitors;

    const all = [
        ...listings.map(l => ({ ...l, itemType: 'İlan', title: l.title || 'İsimsiz İlan' })),
        ...posts.map(p => ({ ...p, itemType: 'Topluluk', title: (p.content || '').substring(0, 40) + '...' }))
    ].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 10);

    return (
        <div className="p-8">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <span className="w-2 h-8 bg-indigo-500 rounded-full"></span>
                Sistem Özeti & Performans
            </h2>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 p-5 rounded-2xl shadow-sm">
                    <div className="text-[10px] uppercase font-black tracking-widest text-indigo-400 mb-1">Bugünkü Tekil Ziyaret</div>
                    <div className="text-3xl font-black text-indigo-700">{visitorsToday.toLocaleString('tr-TR')}</div>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 p-5 rounded-2xl shadow-sm">
                    <div className="text-[10px] uppercase font-black tracking-widest text-emerald-400 mb-1">Toplam Ziyaret (Log)</div>
                    <div className="text-3xl font-black text-emerald-700">{totalVisitors.toLocaleString('tr-TR')}</div>
                </div>
                <div className="bg-gradient-to-br from-rose-50 to-white border border-rose-100 p-5 rounded-2xl shadow-sm">
                    <div className="text-[10px] uppercase font-black tracking-widest text-rose-400 mb-1">Tüm Görüntülenmeler</div>
                    <div className="text-3xl font-black text-rose-700">{totalViews.toLocaleString('tr-TR')}</div>
                </div>
                <div className="bg-gradient-to-br from-[#25D366]/10 to-white border border-[#25D366]/20 p-5 rounded-2xl shadow-sm">
                    <div className="text-[10px] uppercase font-black tracking-widest text-[#25D366] mb-1">WP Tıklama & Yönlendirme</div>
                    <div className="text-3xl font-black text-[#1FAF53]">{totalWhatsApp.toLocaleString('tr-TR')}</div>
                </div>
            </div>

            {/* Visitor Traffic Chart */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
                    Son 7 Günlük Ziyaretçi Trafiği
                </h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={last7Days}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="dateStr" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} allowDecimals={false} />
                            <Tooltip
                                cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontWeight: 'bold', fontSize: '12px' }}
                                labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                            />
                            <Line type="monotone" dataKey="visitors" name="Ziyaretçi" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#6366f1' }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
                <div className="bg-slate-50 border-b border-slate-100 px-5 py-4">
                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                        En Çok Etkileşim Alan 10 İçerik
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 italic bg-white">
                                <th className="text-left py-3 px-5 text-slate-400 font-bold uppercase tracking-widest text-[9px]">Tür</th>
                                <th className="text-left py-3 px-5 text-slate-400 font-bold uppercase tracking-widest text-[9px]">Başlık_İçerik</th>
                                <th className="text-left py-3 px-5 text-slate-400 font-bold uppercase tracking-widest text-[9px]">Sahibi</th>
                                <th className="text-right py-3 px-5 text-slate-400 font-bold uppercase tracking-widest text-[9px]">WhatsApp</th>
                                <th className="text-right py-3 px-5 text-slate-400 font-bold uppercase tracking-widest text-[9px]">İzlenme</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {all.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-3 px-5">
                                        <span className={`text-[9px] font-black px-2 py-1 rounded-[4px] uppercase tracking-wider ${item.itemType === 'İlan' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {item.itemType}
                                        </span>
                                    </td>
                                    <td className="py-3 px-5 text-xs font-bold text-slate-900">{item.title}</td>
                                    <td className="py-3 px-5 text-xs font-medium text-slate-500">{item.userName || '-'}</td>
                                    <td className="py-3 px-5 text-right">
                                        {item.whatsappClicks > 0 ? (
                                            <span className="bg-[#25D366]/10 text-[#25D366] text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter">
                                                {item.whatsappClicks} TIK
                                            </span>
                                        ) : (
                                            <span className="text-slate-300 text-[10px] font-bold">-</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-5 text-right">
                                        <span className="bg-slate-900 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm">
                                            {item.views || 0}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
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
    const [tokens, setTokens] = useState(u.tokens || 0);
    const [badgesInput, setBadgesInput] = useState((u.badges || []).join(', '));
    const [loading, setLoading] = useState(false);

    async function handleUpdate() {
        setLoading(true);
        try {
            const badgesArr = badgesInput.split(',').map(s => s.trim()).filter(Boolean);
            await adminUpdateUser(u.id, { phone, password, tokens: Number(tokens), badges: badgesArr });
            toast.success('Güncellendi');
        } catch (e) {
            toast.error('Hata!');
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
            <td className="py-4 px-4 flex items-center gap-2">
                <input value={phone} onChange={e => setPhone(e.target.value)} className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold" />
                {phone && (
                    <button
                        onClick={() => sendWA(phone, `Merhaba ${u.displayName}, EldenEle ekibi olarak sizinle iletişime geçiyoruz.`)}
                        className="p-1.5 bg-[#25D366] text-white rounded-md hover:scale-110 active:scale-95 transition-all shadow-sm"
                        title="WhatsApp Yaz"
                    >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.313 1.592 5.448 0 9.886-4.438 9.889-9.886.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.821-.98zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>
                    </button>
                )}
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
                <input
                    type="number"
                    value={tokens}
                    onChange={e => setTokens(e.target.value)}
                    className="w-16 bg-white border border-slate-200 rounded px-2 py-1 text-xs font-black text-indigo-600"
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
        </tr >
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
        } catch (e) { toast.error("Kullanıcı oluşturulurken bir hata oluştu."); }
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
                            <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Rozetler (Görsel)</th>
                            <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Jetonlar</th>
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
    const [userIsFeatured, setUserIsFeatured] = useState(l.userIsFeatured || false);
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
                photos,
                userIsFeatured
            });
            toast.success('İlan başarıyla güncellendi.');
        } catch (e) {
            toast.error('Güncelleme sırasında bir hata oluştu.');
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
                    <div className="flex items-center gap-2">
                        <input
                            value={userPhone}
                            onChange={e => setUserPhone(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-[11px] font-black text-indigo-600 p-0 w-24 outline-none"
                            placeholder="05XX..."
                        />
                        {userPhone && (
                            <button
                                onClick={() => sendWA(userPhone, `Merhaba, '${title}' ilanınız hakkında EldenEle ekibi olarak sizinle iletişime geçiyoruz.`)}
                                className="p-1 bg-[#25D366] text-white rounded shadow-sm hover:scale-110 active:scale-95 transition-all"
                                title="WhatsApp Gönder"
                            >
                                <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.313 1.592 5.448 0 9.886-4.438 9.889-9.886.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.821-.98zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>
                            </button>
                        )}
                    </div>
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
                    <div className="flex flex-col items-center bg-[#25D366] text-white px-2 py-1 rounded-lg">
                        <span className="text-[10px] font-black leading-none">{l.whatsappClicks || 0}</span>
                        <span className="text-[7px] uppercase font-bold opacity-80">WP</span>
                    </div>
                    <div className="flex flex-col items-center bg-slate-900 text-white px-2 py-1 rounded-lg">
                        <span className="text-[10px] font-black leading-none">{l.views || 0}</span>
                        <span className="text-[7px] uppercase font-bold opacity-50">Göz</span>
                    </div>
                    <button
                        onClick={() => setUserIsFeatured(!userIsFeatured)}
                        className={`p-2.5 rounded-xl transition-all shadow-sm ${userIsFeatured ? 'bg-amber-500 text-white shadow-amber-200' : 'bg-slate-100 text-slate-400'}`}
                        title={userIsFeatured ? "Öne Çıkarılmış" : "Öne Çıkar"}
                    >
                        <svg className="w-4 h-4" fill={userIsFeatured ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                        </svg>
                    </button>
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
    const [isFeatured, setIsFeatured] = useState(false);
    const [loading, setLoading] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState(new Set());

    const toggleGroup = (uid) => {
        const next = new Set(expandedGroups);
        if (next.has(uid)) next.delete(uid);
        else next.add(uid);
        setExpandedGroups(next);
    };

    const groupedListings = useMemo(() => {
        const groups = {};
        listings.forEach(l => {
            const uid = l.userId || 'Bilinmeyen_Kullanici';
            if (!groups[uid]) {
                groups[uid] = {
                    userId: uid,
                    userName: l.userName || 'İsimsiz Kullanıcı',
                    listings: []
                };
            }
            groups[uid].listings.push(l);
        });
        return Object.values(groups).sort((a, b) => b.listings.length - a.listings.length);
    }, [listings]);

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
                userIsFeatured: isFeatured
            }, photoFiles);
            setIsFeatured(false);
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
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">İlan Konsepti</label>
                                <select value={concept} onChange={e => setConcept(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-slate-800 outline-none">
                                    <option value="takas">Takas</option>
                                    <option value="sahiplendirme">Sahiplendirme</option>
                                    <option value="bedelsiz">Ücretsiz</option>
                                    <option value="geridonusum">Geri Dönüşüm</option>
                                    <option value="odunc">Ödünç</option>
                                </select>
                            </div>
                            <div className="flex items-end flex-1">
                                <label className="flex items-center gap-2 cursor-pointer bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 w-full select-none hover:bg-amber-100 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={isFeatured}
                                        onChange={e => setIsFeatured(e.target.checked)}
                                        className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                                    />
                                    <span className="text-[10px] font-black text-amber-900 uppercase tracking-tighter">İlanı Öne Çıkar</span>
                                </label>
                            </div>
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
            <div className="space-y-8">
                {groupedListings.map(group => {
                    const isExpanded = expandedGroups.has(group.userId);
                    const totalWp = group.listings.reduce((sum, l) => sum + (l.whatsappClicks || 0), 0);
                    const totalViews = group.listings.reduce((sum, l) => sum + (l.views || 0), 0);

                    return (
                        <div key={group.userId} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all">
                            <div
                                onClick={() => toggleGroup(group.userId)}
                                className="bg-slate-50/80 px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm border border-indigo-100 shadow-inner">
                                        {(group.userName[0] || 'U').toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 className="font-extrabold text-sm text-slate-900 tracking-tight leading-none mb-1 flex items-center gap-2">
                                            {group.userName}
                                            <svg className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{group.userId.slice(-6)}</span>
                                            {totalWp > 0 && <span className="text-[9px] font-black text-[#25D366] bg-[#25D366]/10 px-1.5 py-0.5 rounded uppercase tracking-tighter">{totalWp} WP TIK.</span>}
                                            {totalViews > 0 && <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-tighter">{totalViews} GÖZ.</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg shadow-sm">
                                    {group.listings.length} AKTİF İLAN
                                </div>
                            </div>
                            {isExpanded && (
                                <div className="overflow-x-auto border-t border-slate-100">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-slate-100 italic bg-white">
                                                <th className="text-left py-3 px-4 text-slate-400 font-bold uppercase tracking-widest text-[9px]">İlan & Foto</th>
                                                <th className="text-left py-3 px-4 text-slate-400 font-bold uppercase tracking-widest text-[9px]">Kategori / Tür</th>
                                                <th className="text-left py-3 px-4 text-slate-400 font-bold uppercase tracking-widest text-[9px]">Bölge / Tel</th>
                                                <th className="text-left py-3 px-4 text-slate-400 font-bold uppercase tracking-widest text-[9px]">Açıklama</th>
                                                <th className="text-left py-3 px-4 text-slate-400 font-bold uppercase tracking-widest text-[9px]">İstatistik</th>
                                                <th className="text-right py-3 px-4 text-slate-400 font-bold uppercase tracking-widest text-[9px]">Aksiyon</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {group.listings.map(l => (
                                                <ListingRow key={l.id} l={l} onDelete={onDelete} />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function PostRow({ p, onDelete }) {
    const [content, setContent] = useState(p.content || '');
    const [type, setType] = useState(p.type || 'soru');
    const [imageUrl, setImageUrl] = useState(p.imageUrl || null);
    const [loading, setLoading] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const fileRef = useRef(null);

    async function handleUpdate() {
        setLoading(true);
        try {
            await adminUpdatePost(p.id, { content, type, imageUrl });
            toast.success('Güncellendi');
        } catch (e) {
            toast.error('Hata!');
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
        } catch (e) { toast.error("Hata"); }
        finally { setLoading(false); }
    }

    return (
        <>
            <tr className={`hover:bg-slate-50/50 transition-colors ${showComments ? 'bg-indigo-50/30' : ''}`}>
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
                            <div className="text-[10px] text-slate-400 mt-1 uppercase font-black">Yazar: {p.userName}</div>
                        </div>
                    </div>
                </td>
                <td className="py-4 px-4">
                    <select
                        value={type}
                        onChange={e => setType(e.target.value)}
                        className="text-[10px] font-black px-2 py-1 bg-white border border-slate-200 rounded text-slate-600 uppercase outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        <option value="soru">Soru</option>
                        <option value="talep">Talep</option>
                    </select>
                </td>
                <td className="py-4 px-4">
                    <button
                        onClick={() => setShowComments(!showComments)}
                        className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${showComments ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}`}
                    >
                        <svg className={`w-4 h-4 ${showComments ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="text-xs font-black">{p.commentCount || 0}</span>
                    </button>
                    <div className="text-[9px] text-slate-400 mt-1 ml-1 font-bold">{p.likeCount || 0} Beğeni</div>
                </td>
                <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                        <span className="bg-slate-900 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{p.views || 0}</span>
                        <button onClick={handleUpdate} disabled={loading} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all">
                            {loading ? '...' : '✓'}
                        </button>
                    </div>
                </td>
                <td className="py-4 px-4 text-right">
                    <button onClick={() => onDelete(p.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </td>
            </tr>
            {showComments && (
                <tr>
                    <td colSpan="5" className="px-8 pb-8 bg-indigo-50/30">
                        <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-5 animate-in fade-in slide-in-from-top-2 duration-300">
                            <AdminComments postId={p.id} />
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

function AdminComments({ postId }) {
    const [comments, setComments] = useState([]);
    const [newReply, setNewReply] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const unsub = subscribeComments(postId, (data) => {
            setComments(data);
        });
        return () => unsub();
    }, [postId]);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!newReply.trim()) return;
        setLoading(true);
        try {
            await createComment({ postId, content: newReply.trim(), isAdminReply: true });
            setNewReply('');
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-4">
            <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest border-b border-indigo-50 pb-2">Yanıtlar ve Yönetim</h4>

            <div className="space-y-4 max-h-80 overflow-y-auto pr-2 scrollbar-thin">
                {comments.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400 font-medium italic bg-slate-50/50 rounded-xl border border-dashed border-slate-200">Henüz yorum yok. İlk yanıtı siz verin.</div>
                ) : (
                    comments.map(c => (
                        <div key={c.id} className="group/admincomm">
                            <div className="flex gap-3">
                                {!c.isAdmin && (
                                    <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden bg-slate-200 ring-2 ring-white shadow-sm flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase mt-1">
                                        {(c.userName || 'U')[0]}
                                    </div>
                                )}
                                <div className={`flex-1 px-4 py-3 rounded-2xl border transition-all duration-300 ${c.isAdmin
                                    ? 'bg-white border-2 border-red-600 shadow-[0_4px_12px_rgba(220,38,38,0.08)] relative overflow-hidden'
                                    : 'bg-slate-50 border-slate-200'
                                    }`}>
                                    {c.isAdmin && (
                                        <div className="absolute top-0 right-0 px-2.5 py-1 bg-red-600 text-[7px] font-black text-white uppercase tracking-tighter rounded-bl-lg shadow-sm">
                                            RESMİ
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2 font-black text-[12px] tracking-tight">
                                            <span className={c.isAdmin ? 'text-red-700 uppercase' : 'text-slate-900 italic opacity-80'}>{c.userName}</span>
                                        </div>
                                        <span className="text-[9px] text-slate-400 font-bold uppercase">{c.createdAt?.seconds ? new Date(c.createdAt.seconds * 1000).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                    </div>
                                    <p className={`text-[12px] leading-relaxed ${c.isAdmin ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>{c.content}</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
                <input
                    value={newReply}
                    onChange={e => setNewReply(e.target.value)}
                    placeholder="Admin olarak yanıtla..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all placeholder:text-slate-300"
                />
                <button
                    disabled={loading || !newReply.trim()}
                    className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 transition-all active:scale-[0.98] shadow-lg shadow-red-200"
                >
                    {loading ? '...' : 'Yanıtla'}
                </button>
            </form>
        </div>
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
                <h3 className="font-bold text-slate-800 mb-4 text-[11px] uppercase tracking-widest flex items-center gap-2">
                    <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    Sistem Botu / Duyuru Paylaş
                </h3>
                <form onSubmit={handleFakeSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Paylaşan İsim (Sahte/Gerçek)</label>
                            <input value={fakeName} onChange={e => setFakeName(e.target.value)} type="text" placeholder="Örn: EldenEle Admin" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-slate-800 outline-none transition-all" required />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">İçerik Kategorisi</label>
                            <select value={fakeType} onChange={e => setFakeType(e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-slate-800 outline-none transition-all">
                                <option value="soru">Soru</option>
                                <option value="talep">Talep</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Mesaj İçeriği</label>
                        <textarea value={fakeContent} onChange={e => setFakeContent(e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-slate-800 outline-none min-h-[60px] transition-all" placeholder="Topluluğa ne söylemek istersin?" required></textarea>
                    </div>
                    <button type="submit" disabled={loading} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200 hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-[0.98]">
                        {loading ? "..." : "Şimdi Yayınla"}
                    </button>
                </form>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-100 italic">
                            <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">İçerik</th>
                            <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Tür</th>
                            <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Yorumlar</th>
                            <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">İzlenme</th>
                            <th className="text-right py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Aksiyon</th>
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

function MessagesTab({ messages, users, listings }) {
    // Daha hızlı arama için kullanıcı ve ilan haritası oluştur
    const userMap = new Map();
    users.forEach(u => userMap.set(u.id, u));

    const listingMap = new Map();
    listings.forEach(l => listingMap.set(l.id, l));

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-8 bg-rose-500 rounded-full"></span>
                    Kullanıcı Özel Mesajları (DM)
                </h2>
                <div className="flex gap-2">
                    <div className="px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-100 flex items-center gap-2 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                        <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">
                            {messages.filter(m => !m.read).length} OKUNMAYAN
                        </span>
                    </div>
                </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="leading-tight">Gizlilik Uyarı: Bu ekran sadece sistem yöneticileri tarafından dolandırıcılık veya platform dışı ödeme girişimlerini denetlemek amacıyla kullanılmalıdır.</span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-100 italic bg-slate-50/30">
                            <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Gönderen</th>
                            <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Alıcı & İletişim</th>
                            <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px] w-1/3">Mesaj İçeriği</th>
                            <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Tarih</th>
                            <th className="text-center py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Durum</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {messages.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="py-12 text-center text-slate-500 text-sm font-medium">Henüz mesaj bulunmuyor.</td>
                            </tr>
                        ) : (
                            messages.map(m => {
                                const receiver = userMap.get(m.receiverId);
                                const sender = userMap.get(m.senderId);
                                const listing = listingMap.get(m.listingId);
                                const receiverPhone = receiver?.phone || '';

                                const waMessage = listing
                                    ? `Merhaba ${receiver?.displayName}, '${listing.title}' ilanınız için EldenEle üzerinden yeni bir mesajınız var. Müsait olduğunuzda kontrol edebilirsiniz.`
                                    : `Merhaba ${receiver?.displayName}, EldenEle üzerinden yeni bir mesajınız var. Müsait olduğunuzda kontrol edebilirsiniz.`;

                                return (
                                    <tr key={m.id} className={`hover:bg-slate-50/80 transition-all ${!m.read ? 'bg-amber-50/10' : ''}`}>
                                        <td className="py-4 px-4">
                                            <div className="text-sm font-bold text-slate-900">{m.senderName || 'İsimsiz'}</div>
                                            <div className="text-[9px] text-slate-400 font-black uppercase tracking-tighter mt-0.5 opacity-60">ID: {m.senderId?.substring(0, 8)}</div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col">
                                                    <div className="text-xs font-black text-slate-700">{receiver?.displayName || 'Yükleniyor...'}</div>
                                                    <div className="text-[9px] text-indigo-500 font-mono opacity-80">{m.receiverId?.substring(0, 8)}...</div>
                                                </div>
                                                {receiverPhone && (
                                                    <button
                                                        onClick={() => sendWA(receiverPhone, waMessage)}
                                                        className="p-1.5 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E] transition-colors shadow-sm active:scale-95"
                                                        title="WhatsApp ile İletişime Geç"
                                                    >
                                                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.313 1.592 5.448 0 9.886-4.438 9.889-9.886.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.821-.98zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="bg-white border border-slate-100 rounded-xl p-3 text-[13px] text-slate-700 font-medium shadow-sm leading-relaxed max-w-md">
                                                {m.text}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="text-[11px] font-bold text-slate-500">{m.createdAt?.seconds ? new Date(m.createdAt.seconds * 1000).toLocaleDateString('tr-TR') : '-'}</div>
                                            <div className="text-[9px] font-black text-slate-400 uppercase">{m.createdAt?.seconds ? new Date(m.createdAt.seconds * 1000).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            {m.read ? (
                                                <span className="text-[9px] font-black px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 uppercase tracking-tighter">Okundu</span>
                                            ) : (
                                                <span className="text-[9px] font-black px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg border border-amber-100 uppercase tracking-tighter animate-pulse shadow-sm">Okunmadı</span>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}


function HtmlEditor({ value, onChange, placeholder = "İçerik..." }) {
    const editorRef = useRef(null);

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value || '';
        }
    }, [value]);

    const handleCommand = (command, val = null) => {
        document.execCommand(command, false, val);
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    return (
        <div className="space-y-1">
            <div className="flex bg-slate-50 border border-slate-200 border-b-0 rounded-t-xl p-1.5 gap-1 shadow-sm">
                <button type="button" onClick={() => handleCommand('bold')} className="p-1.5 px-3 hover:bg-white hover:shadow-sm rounded-lg text-[10px] font-black transition-all active:scale-90" title="Kalın">B</button>
                <button type="button" onClick={() => handleCommand('italic')} className="p-1.5 px-3 hover:bg-white hover:shadow-sm rounded-lg text-[10px] font-black italic transition-all active:scale-90" title="İtalik">I</button>
                <button type="button" onClick={() => handleCommand('underline')} className="p-1.5 px-3 hover:bg-white hover:shadow-sm rounded-lg text-[10px] font-black underline transition-all active:scale-90" title="Altı Çizili">U</button>
                <div className="w-px h-5 bg-slate-200 mx-1 self-center"></div>
                <button type="button" onClick={() => handleCommand('insertUnorderedList')} className="p-1.5 px-3 hover:bg-white hover:shadow-sm rounded-lg text-[10px] font-black transition-all active:scale-90" title="Liste">• List</button>
                <button type="button" onClick={() => handleCommand('formatBlock', '<h3>')} className="p-1.5 px-3 hover:bg-white hover:shadow-sm rounded-lg text-[10px] font-black transition-all active:scale-90" title="Başlık">H</button>
                <button type="button" onClick={() => handleCommand('removeFormat')} className="p-1.5 px-3 hover:bg-white hover:shadow-sm rounded-lg text-[10px] font-black transition-all active:scale-90 opacity-50" title="Formatı Temizle">✕</button>
            </div>
            <div
                ref={editorRef}
                contentEditable
                onInput={(e) => onChange(e.currentTarget.innerHTML)}
                onBlur={(e) => onChange(e.currentTarget.innerHTML)}
                className="w-full bg-white border border-slate-200 rounded-b-xl px-4 py-3 text-[13px] font-medium min-h-[120px] outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 transition-all prose prose-sm max-w-none"
            />
        </div>
    );
}

function NewsTab({ news, onDelete, onToggleActive, onRefresh }) {
    const [loading, setLoading] = useState(false);
    const [showPassive, setShowPassive] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    // Form fields for new news
    const [formData, setFormData] = useState({
        type: 'popup',
        title: '',
        desc: '',
        badge: '',
        badgeColor: 'bg-orange-100 text-orange-600 border-orange-200',
        emoji: '🐾',
        image: '',
        buttons: [
            { id: 1, text: 'Anladım', type: 'link', value: '/' },
            { id: 2, text: 'Belki Sonra', type: 'link', value: '' }
        ],
        ctaColor: 'bg-orange-500 hover:bg-orange-400 shadow-orange-500/30',
        accentColor: 'from-orange-50 to-amber-50',
        isActive: true
    });

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            type: 'popup',
            title: '',
            desc: '',
            badge: '',
            badgeColor: 'bg-orange-100 text-orange-600 border-orange-200',
            emoji: '🐾',
            image: '',
            buttons: [
                { id: 1, text: 'Anladım', type: 'link', value: '/' },
                { id: 2, text: 'Belki Sonra', type: 'link', value: '' }
            ],
            ctaColor: 'bg-orange-500 hover:bg-orange-400 shadow-orange-500/30',
            accentColor: 'from-orange-50 to-amber-50',
            isActive: true
        });
    };

    function handleEdit(n) {
        setEditingId(n.id);
        setFormData({
            type: n.type || 'popup',
            title: n.title || '',
            desc: n.desc || '',
            badge: n.badge || '',
            badgeColor: n.badgeColor || 'bg-orange-100 text-orange-600 border-orange-200',
            emoji: n.emoji || '🐾',
            image: n.image || '',
            buttons: n.buttons || [
                { id: 1, text: 'Anladım', type: 'link', value: '/' },
                { id: 2, text: 'Belki Sonra', type: 'link', value: '' }
            ],
            ctaColor: n.ctaColor || 'bg-orange-500 hover:bg-orange-400 shadow-orange-500/30',
            accentColor: n.accentColor || 'from-orange-50 to-amber-50',
            isActive: n.isActive !== false,
            ctaHref: n.ctaHref || '',
            ctaText: n.ctaText || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function handleAiFormat() {
        if (!formData.desc.trim() || isAiLoading) return;
        setIsAiLoading(true);
        const tid = toast.loading('PatiAI metni güzelleştiriyor...');
        try {
            const res = await fetch('/api/ai/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    task: 'format-news-html',
                    data: { input: formData.desc }
                })
            });
            const result = await res.json();
            const aiHtml = result.choices?.[0]?.message?.content;
            if (aiHtml) {
                setFormData(prev => ({ ...prev, desc: aiHtml }));
                toast.success('Metin başarıyla optimize edildi! ✨', { id: tid });
            } else {
                toast.error('AI yanıtı alınamadı.', { id: tid });
            }
        } catch (e) {
            toast.error('AI servisi şu an meşgul.', { id: tid });
        } finally {
            setIsAiLoading(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingId) {
                await updateNews(editingId, {
                    ...formData,
                    decorEmoji: formData.type === 'popup' ? ['🐾', '🎀', '🐱', '🦴'] : []
                });
                toast.success('Duyuru güncellendi');
            } else {
                await createNews({
                    ...formData,
                    id: 'news_' + Date.now(),
                    decorEmoji: formData.type === 'popup' ? ['🐾', '🎀', '🐱', '🦴'] : []
                });
                toast.success('Duyuru oluşturuldu');
            }
            resetForm();
            if (onRefresh) onRefresh();
        } catch (e) {
            toast.error('Hata oluştu');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-8 bg-orange-500 rounded-full"></span>
                    Duyuru Yönetimi
                </h2>
                <button
                    onClick={() => setShowPassive(!showPassive)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${showPassive ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-orange-600 text-white border-orange-500 shadow-lg shadow-orange-500/20'
                        }`}
                >
                    {showPassive ? 'Pasifleri Gizle' : 'Tümünü Göster'}
                </button>
            </div>

            {/* Create/Edit News Form */}
            <div className={`border rounded-2xl p-6 mb-8 transition-all ${editingId ? 'bg-indigo-50/50 border-indigo-200' : 'bg-orange-50/50 border-orange-100'}`}>
                <h3 className={`font-bold mb-4 text-xs uppercase tracking-widest ${editingId ? 'text-indigo-900' : 'text-orange-900'}`}>
                    {editingId ? 'Duyuruyu Düzenle' : 'Yeni Duyuru Ekle'}
                </h3>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Tür</label>
                        <select
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold"
                        >
                            <option value="popup">Popup (Ekranda Çıkar)</option>
                            <option value="general">General (Yazı Altı)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Başlık</label>
                        <input
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold"
                            placeholder="Örn: İlk Mama Hediyesi!" required
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Badge (Rozet)</label>
                        <input
                            value={formData.badge}
                            onChange={e => setFormData({ ...formData, badge: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold"
                            placeholder="Örn: Sahiplenicilere Özel"
                        />
                    </div>
                    <div className="md:col-span-3">
                        <div className="flex justify-between items-end mb-1">
                            <label className="block text-[10px] font-black text-slate-400 uppercase">Açıklama (HTML Editor)</label>
                            <button
                                type="button"
                                onClick={handleAiFormat}
                                disabled={isAiLoading || !formData.desc.trim()}
                                className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95"
                            >
                                {isAiLoading ? 'Hazırlanıyor...' : '✨ PatiAI ile Güzelleştir'}
                            </button>
                        </div>
                        <HtmlEditor
                            value={formData.desc}
                            onChange={(val) => setFormData({ ...formData, desc: val })}
                            placeholder="Duyuru metni buraya... (Kalın, italik ve listeler kullanabilirsiniz)"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Emoji / Görsel URL</label>
                        <div className="flex gap-2">
                            <input
                                value={formData.emoji}
                                onChange={e => setFormData({ ...formData, emoji: e.target.value })}
                                className="w-12 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-center"
                                placeholder="🐾"
                            />
                            <input
                                value={formData.image}
                                onChange={e => setFormData({ ...formData, image: e.target.value })}
                                className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold"
                                placeholder="Görsel URL (Opsiyonel)"
                            />
                        </div>
                    </div>
                    {formData.type === 'popup' && (
                        <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/50 p-4 rounded-xl border border-orange-100 italic">
                            {formData.buttons.map((btn, idx) => (
                                <div key={btn.id} className="space-y-2">
                                    <label className="block text-[10px] font-black text-orange-700 uppercase">Buton {idx + 1}</label>
                                    <div className="flex gap-2">
                                        <input
                                            value={btn.text}
                                            onChange={e => {
                                                const newBtns = [...formData.buttons];
                                                newBtns[idx].text = e.target.value;
                                                setFormData({ ...formData, buttons: newBtns });
                                            }}
                                            className="w-1/3 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold"
                                            placeholder="Metin"
                                        />
                                        <select
                                            value={btn.type}
                                            onChange={e => {
                                                const newBtns = [...formData.buttons];
                                                newBtns[idx].type = e.target.value;
                                                setFormData({ ...formData, buttons: newBtns });
                                            }}
                                            className="w-1/3 bg-white border border-slate-200 rounded-lg px-2 py-2 text-xs font-bold"
                                        >
                                            <option value="link">Linke Git</option>
                                            <option value="action">Öneri/Mesaj Gönder</option>
                                        </select>
                                        <input
                                            value={btn.value}
                                            onChange={e => {
                                                const newBtns = [...formData.buttons];
                                                newBtns[idx].value = e.target.value;
                                                setFormData({ ...formData, buttons: newBtns });
                                            }}
                                            className="w-1/3 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold"
                                            placeholder="Link/Değer"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {formData.type === 'general' && (
                        <div className="md:col-span-1">
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Banner Linki (Opsiyonel)</label>
                            <input
                                value={formData.ctaHref}
                                onChange={e => setFormData({ ...formData, ctaHref: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold"
                                placeholder="/link"
                            />
                        </div>
                    )}
                    <div className="flex items-end gap-2">
                        <button type="submit" disabled={loading} className={`flex-1 text-white font-black text-[10px] uppercase py-3 rounded-lg tracking-widest transition-all ${editingId ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-orange-600 hover:bg-orange-500'}`}>
                            {loading ? 'İşleniyor...' : (editingId ? 'DEĞİŞİKLİKLERİ KAYDET' : 'DUYURU YAYINLA')}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-3 bg-slate-200 text-slate-600 font-black text-[10px] uppercase rounded-lg hover:bg-slate-300 transition-all"
                            >
                                İPTAL
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* News List */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-100 italic">
                            <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Tür</th>
                            <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Başlık / Açıklama</th>
                            <th className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">CTA / Link</th>
                            <th className="text-right py-4 px-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Aksiyon</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {news
                            .filter(n => showPassive || n.isActive !== false)
                            .map(n => (
                                <NewsRow key={n.id} n={n} onDelete={onDelete} onToggleActive={onToggleActive} onEdit={() => handleEdit(n)} />
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function NewsRow({ n, onDelete, onToggleActive, onEdit }) {
    return (
        <tr className="hover:bg-slate-50 transition-colors">
            <td className="py-4 px-4">
                <span className={`text-[9px] font-black px-2 py-1 rounded-[4px] uppercase tracking-wider ${n.type === 'popup' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {n.type === 'popup' ? 'POPUP' : 'GENEL'}
                </span>
            </td>
            <td className="py-4 px-4">
                <div className="text-xs font-black text-slate-900">{n.title}</div>
                <div className="text-[10px] text-slate-500 line-clamp-1">{n.desc}</div>
            </td>
            <td className="py-4 px-4">
                {n.type === 'popup' ? (
                    <div className="flex flex-col gap-1">
                        {n.buttons?.map((b, i) => (
                            <div key={i} className="text-[9px] flex items-center gap-1">
                                <span className="font-black text-slate-700">{b.text}:</span>
                                <span className={`px-1 rounded ${b.type === 'link' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
                                    {b.type === 'link' ? 'Link' : 'Öneri'}
                                </span>
                                <span className="text-slate-400 truncate max-w-[80px]">{b.value || '-'}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="text-[10px] font-bold text-slate-700">{n.ctaText || '-'}</div>
                        <div className="text-[9px] text-indigo-500 font-mono">{n.ctaHref || 'Link yok'}</div>
                    </>
                )}
            </td>
            <td className="py-4 px-4 text-right flex items-center justify-end gap-2">
                <button
                    onClick={onEdit}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                    title="Düzenle"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button
                    onClick={() => onToggleActive(n.id, n.isActive !== false)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${n.isActive !== false ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}
                >
                    {n.isActive !== false ? 'AKTİF' : 'PASİF'}
                </button>
                <button onClick={() => onDelete(n.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors" title="Sil">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </td>
        </tr>
    );
}

function WebmasterTab({ users, listings, visitors, news, posts }) {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Merhaba Sayın Yönetici! Ben EldenEle Webmaster AI. 🛠️\n\nSEO uyumlu duyuru hazırlama, ziyaretçi trafiğini analiz etme veya platform verilerinden rapor çıkarma konusunda sana yardım etmeye hazırım. Ne yapmamı istersin? (Örn: "Sevimli bir sahiplendirme duyurusu oluştur" veya "Ziyaretçi verilerini analiz et")' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    async function handleChat(e) {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/ai/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    task: 'admin-webmaster',
                    data: {
                        context: {
                            question: input,
                            stats: {
                                totalUsers: users.length,
                                totalListings: listings.length,
                                totalVisitors: visitors.length,
                                totalNews: news.length,
                                totalPosts: posts.length
                            },
                            recentListings: listings.slice(0, 5).map(l => ({ title: l.title, city: l.city })),
                            recentVisitors: visitors.slice(0, 10).map(v => ({ path: v.path, platform: v.platform }))
                        }
                    }
                })
            });

            const data = await res.json();
            const aiContent = data.choices?.[0]?.message?.content || "Analiz sırasında bir sorun oluştu.";
            setMessages(prev => [...prev, { role: 'assistant', content: aiContent }]);
        } catch (err) {
            toast.error("Webmaster asistanı şu an yanıt veremiyor.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="p-8 h-[700px] flex flex-col">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <span className="w-2 h-8 bg-slate-900 rounded-full"></span>
                Webmaster & SEO Strateji Üssü
            </h2>

            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl relative">
                <div className="bg-slate-900 border-b border-white/5 px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">EldenEle SEO/Webmaster Engine 2.0</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl p-4 text-[13px] leading-relaxed shadow-sm ${m.role === 'user'
                                ? 'bg-indigo-600 text-white font-medium'
                                : 'bg-slate-900 border border-slate-800 text-slate-200'
                                }`}>
                                <pre className="whitespace-pre-wrap font-sans">{m.content}</pre>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex gap-2">
                                <span className="w-2 h-2 bg-slate-700 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-slate-700 rounded-full animate-bounce [animation-delay:-.3s]"></span>
                                <span className="w-2 h-2 bg-slate-700 rounded-full animate-bounce [animation-delay:-.5s]"></span>
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>

                <div className="p-4 bg-slate-900 border-t border-white/5">
                    <form onSubmit={handleChat} className="flex gap-3">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="SEO raporu oluştur, duyuru hazırla veya verileri analiz et..."
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                        />
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
