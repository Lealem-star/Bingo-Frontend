import React, { useEffect, useState } from 'react';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../lib/auth/AuthProvider';
import { useWebSocket } from '../contexts/WebSocketContext';
import lbLogo from '../assets/lb.png';
import StatsPanel from '../components/StatsPanel';
import { apiFetch, getApiBase } from '../lib/api/client';

export default function Game({ onNavigate, onStakeSelected, selectedStake }) {
    const [adminPost, setAdminPost] = useState(null);
    const apiBase = getApiBase();
    const { sessionId } = useAuth();
    useWebSocket();

    useEffect(() => {
        let isMounted = true;
        const loadAdminPost = async () => {
            try {
                const data = await apiFetch('/admin/posts', { method: 'GET', timeoutMs: 20000 });
                const posts = Array.isArray(data?.posts) ? data.posts : [];
                const active = posts.find(p => p?.active === true) || null;
                if (active) {
                    // Prefix relative upload path with API base
                    const url = active.url?.startsWith('http') ? active.url : `${apiBase}${active.url}`;
                    if (isMounted) setAdminPost({ ...active, url });
                } else {
                    if (isMounted) setAdminPost(null);
                }
            } catch (e) {
                console.error('Failed to load admin post:', e);
                if (isMounted) setAdminPost(null);
            }
        };
        loadAdminPost();
        const t = setInterval(loadAdminPost, 30000);
        return () => { isMounted = false; clearInterval(t); };
    }, [apiBase]);
    const joinStake = (s) => {
        onStakeSelected?.(s);
    };

    // Show initial screen when no stake is selected
    if (!selectedStake) {
        console.log('Rendering initial screen - no stake selected');
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900" style={{ position: 'relative' }}>
                <header className="p-4">
                    <div className="app-header">
                        <div className="app-logo">
                            <div className="logo-circle">
                                <img src={lbLogo} alt="Love Bingo Logo" className="logo-image" />
                            </div>
                            <span className="app-title">Love Bingo</span>
                        </div>
                        <button className="rules-button" onClick={() => onNavigate?.('rules')}>
                            <span className="rules-icon">❓</span>
                            <span>Rules</span>
                        </button>
                    </div>
                    <h1 className="text-center text-3xl md:text-4xl font-extrabold leading-tight mt-6 text-white">
                        Welcome to Love Bingo
                    </h1>
                    <div className="text-center text-white mt-4">
                        <p>Choose your stake amount to start playing</p>
                    </div>
                </header>

                <main className="p-4 space-y-4">
                    <div className="stake-card rounded-2xl p-4 mx-auto max-w-md fade-in-up mt-4">
                        <div className="stake-card__header">
                            <div className="play-icon">▶</div>
                            <div className="stake-card__title">Choose Your Stake</div>
                        </div>
                        <div className="flex justify-center gap-4 mt-8">
                            <button onClick={() => joinStake(10)} className="stake-btn stake-green">
                                <div className="play-icon-small">▶</div>
                                <span>Play 10</span>
                            </button>
                            <button onClick={() => joinStake(50)} className="stake-btn stake-blue">
                                <div className="play-icon-small">▶</div>
                                <span>Play 50</span>
                            </button>
                        </div>
                    </div>

                    {/* Admin Announcement - Always visible under stake card */}
                    {adminPost && (
                        <div className="mx-auto max-w-md w-full px-2 my-6">
                            <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-slate-900/60 to-purple-900/40 backdrop-blur-md shadow-2xl ring-1 ring-white/10">
                                {/* subtle overlay */}
                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

                                {/* badge */}
                                <div className="absolute top-2 left-2 z-10">
                                    <span className="px-2 py-1 text-[10px] font-semibold rounded-full bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-sm">
                                        {adminPost.kind === 'image' ? 'Announcement' : 'Announcement • Video'}
                                    </span>
                                </div>

                                {adminPost.kind === 'image' ? (
                                    <img
                                        src={adminPost.url}
                                        alt={adminPost.caption || 'Announcement'}
                                        className="w-full h-44 sm:h-56 md:h-64 object-cover"
                                        onError={(e) => {
                                            e.target.src = lbLogo;
                                            e.target.alt = 'Love Bingo Logo';
                                        }}
                                    />
                                ) : (
                                    <video
                                        src={adminPost.url}
                                        className="w-full h-44 sm:h-56 md:h-64 object-cover"
                                        controls
                                        muted
                                        playsInline
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            const fallbackImg = document.createElement('img');
                                            fallbackImg.src = lbLogo;
                                            fallbackImg.alt = 'Love Bingo Logo';
                                            fallbackImg.className = 'w-full h-44 sm:h-56 md:h-64 object-cover';
                                            e.target.parentNode.insertBefore(fallbackImg, e.target);
                                        }}
                                    />
                                )}
                                {adminPost.caption ? (
                                    <div className="p-3 sm:p-4 text-white text-sm leading-snug bg-black/40 border-t border-white/10">
                                        {adminPost.caption}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    )}

                    <StatsPanel />
                </main>

                <BottomNav current="game" onNavigate={onNavigate} />
            </div>
        );
    }






    // If no stake selected, show initial screen
    return null;


}