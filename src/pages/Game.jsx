import React, { useEffect, useState } from 'react';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../lib/auth/AuthProvider';
import { useWebSocket } from '../contexts/WebSocketContext';
import lbLogo from '../assets/lb.png';
import StatsPanel from '../components/StatsPanel';
import GameLayout from './GameLayout';
import { apiFetch, getApiBase } from '../lib/api/client';

export default function Game({ onNavigate, onStakeSelected, selectedStake, selectedCartela, currentGameId }) {
    const [adminPost, setAdminPost] = useState(null);
    const apiBase = getApiBase();
    const { sessionId } = useAuth();
    const { connected, gameState, wsReadyState } = useWebSocket();

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
                        <div className="mx-auto max-w-md w-full px-2">
                            <div className="rounded-2xl overflow-hidden ring-1 ring-white/10 bg-white/5 shadow-lg">
                                {adminPost.kind === 'image' ? (
                                    <img
                                        src={adminPost.url}
                                        alt={adminPost.caption || 'Announcement'}
                                        className="w-full h-32 sm:h-40 md:h-48 object-cover"
                                    />
                                ) : (
                                    <video
                                        src={adminPost.url}
                                        className="w-full h-32 sm:h-40 md:h-48 object-cover"
                                        controls
                                        muted
                                        playsInline
                                    />
                                )}
                                {adminPost.caption ? (
                                    <div className="p-2 sm:p-3 text-white text-xs sm:text-sm bg-black/30">
                                        {adminPost.caption}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    )}

                    <StatsPanel />

                    {/* Debug Panel - Mobile Testing */}
                    <div className="mx-auto max-w-md w-full px-2">
                        <div className="p-2 bg-black/30 rounded-lg text-xs">
                            <div className="text-yellow-300 font-bold mb-1">🔧 Debug Info:</div>
                            <div className="text-white/80 space-y-1">
                                <div>Session: {sessionId ? '✅' : '❌'}</div>
                                <div>Stake: {selectedStake || 'None'}</div>
                                <div>Connected: {connected ? '✅' : '❌'}</div>
                                <div>WS State: {wsReadyState === 0 ? '🔄 Connecting' : wsReadyState === 1 ? '✅ Open' : wsReadyState === 2 ? '🔄 Closing' : '❌ Closed'}</div>
                                <div>Game Phase: {gameState.phase || 'Unknown'}</div>
                                <div>Game ID: {gameState.gameId || 'None'}</div>
                                <div>Players: {gameState.playersCount || 0}</div>
                                <div>Prize Pool: ETB {gameState.prizePool || 0}</div>
                            </div>
                        </div>
                    </div>
                </main>

                <BottomNav current="game" onNavigate={onNavigate} />
            </div>
        );
    }






    // If we have a selectedCartela or we're in watch mode (selectedCartela is null but stake exists), render GameLayout
    if (selectedStake) {
        console.log('Rendering GameLayout with stake:', selectedStake, 'cartela:', selectedCartela, 'gameId:', currentGameId);
        return (
            <GameLayout
                stake={selectedStake}
                selectedCartela={selectedCartela}
                gameId={currentGameId}
                onNavigate={onNavigate}
            />
        );
    }

    // If no stake selected, show initial screen
    return null;


}