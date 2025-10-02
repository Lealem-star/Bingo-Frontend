import React, { useEffect, useState } from 'react';
import { useGameWebSocket } from '../lib/ws/useGameWebSocket';
import { useAuth } from '../lib/auth/AuthProvider';

export default function GameLayout({
    stake,
    selectedCartela,
    playersCount = 0,
    prizePool = 0,
    gameId,
    onNavigate,
}) {
    const { sessionId } = useAuth();
    const [showTimeout, setShowTimeout] = useState(false);

    console.log('GameLayout - Props received:', {
        stake,
        selectedCartela,
        gameId,
        sessionId: sessionId ? 'Present' : 'Missing',
        playersCount,
        prizePool
    });

    const { connected, gameState } = useGameWebSocket(gameId, sessionId);

    // Timeout mechanism for when gameId is not available
    useEffect(() => {
        if (!gameId) {
            const timeout = setTimeout(() => {
                setShowTimeout(true);
            }, 5000); // 5 second timeout

            return () => clearTimeout(timeout);
        } else {
            setShowTimeout(false);
        }
    }, [gameId]);

    // Use WebSocket data if available, otherwise fall back to props
    const currentPlayersCount = gameState.playersCount || playersCount;
    const currentPrizePool = gameState.prizePool || prizePool;
    const calledNumbers = gameState.calledNumbers || [];
    const currentNumber = gameState.currentNumber;

    // Determine if we're in watch mode (no selected cartella)
    const isWatchMode = !selectedCartela;

    // Auto-transition back to CartelaSelection when registration starts
    useEffect(() => {
        if (isWatchMode && gameState.phase === 'registration') {
            console.log('Registration started, navigating back to CartelaSelection');
            onNavigate?.('cartela-selection');
        }
    }, [isWatchMode, gameState.phase, onNavigate]);

    // If no gameId is available, show a loading state or redirect to cartela selection
    if (!gameId) {
        console.log('GameLayout - No gameId available, showing loading state');
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 flex items-center justify-center">
                <div className="text-center text-white">
                    <div className="text-2xl mb-4">🎮</div>
                    <div className="text-lg mb-2">Loading game...</div>
                    <div className="text-sm text-gray-300 mb-4">Please wait while we prepare your game</div>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                    {showTimeout && (
                        <div className="mt-4">
                            <div className="text-sm text-yellow-300 mb-2">Taking longer than expected?</div>
                            <button
                                onClick={() => onNavigate?.('cartela-selection')}
                                className="px-6 py-3 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 transition-colors"
                            >
                                Back to Cartella Selection
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-pink-500/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-500/20 to-purple-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="max-w-md mx-auto px-3 py-3 relative z-10">
                {/* Enhanced Top Information Bar */}
                <div className="flex items-stretch gap-2 p-3 rounded-2xl bg-gradient-to-r from-purple-800/30 to-purple-900/30 ring-1 ring-white/20 shadow-2xl shadow-purple-900/20 backdrop-blur-md border border-white/10">
                    <div className="wallet-box flex-1 group">
                        <div className="wallet-label text-xs opacity-80">Game ID</div>
                        <div className="wallet-value text-sm font-bold text-yellow-300">{gameId || 'LB000000'}</div>
                    </div>
                    <div className="wallet-box flex-1 group">
                        <div className="wallet-label text-xs opacity-80">Players</div>
                        <div className="wallet-value text-sm font-bold text-green-300">{currentPlayersCount}</div>
                    </div>
                    <div className="wallet-box flex-1 group">
                        <div className="wallet-label text-xs opacity-80">Bet</div>
                        <div className="wallet-value text-sm font-bold text-blue-300">ETB {stake}</div>
                    </div>
                    <div className="wallet-box flex-1 group">
                        <div className="wallet-label text-xs opacity-80">Prize</div>
                        <div className="wallet-value text-sm font-bold text-orange-300">ETB {currentPrizePool}</div>
                    </div>
                    <div className="wallet-box flex-1 group">
                        <div className="wallet-label text-xs opacity-80">Called</div>
                        <div className="wallet-value text-sm font-bold text-pink-300">{calledNumbers.length}/75</div>
                    </div>
                    <div className="wallet-box flex-1 group">
                        <div className="wallet-label text-xs opacity-80">Status</div>
                        <div className="wallet-value text-sm font-bold text-purple-300">
                            {connected ? '🟢' : '🔴'}
                        </div>
                    </div>
                </div>

                {/* Current Number Display */}
                {currentNumber && (
                    <div className="mt-4 text-center">
                        <div className="text-6xl font-bold text-yellow-300 animate-pulse">
                            {currentNumber}
                        </div>
                        <div className="text-sm text-gray-300 mt-2">
                            Last Called Number
                        </div>
                    </div>
                )}

                {/* Main Content Area - Enhanced 2 Column Layout */}
                <div className="grid grid-cols-2 p-2 gap-3 mt-4">
                    {/* Left Card - Enhanced BINGO Grid */}
                    <div className="rounded-2xl p-4 bg-gradient-to-br from-purple-900/70 to-slate-900/50 ring-1 ring-white/20 shadow-2xl shadow-purple-900/30 backdrop-blur-md border border-white/10">
                        <div className="grid grid-cols-5 gap-1">
                            {/* B Column */}
                            <div className="space-y-0.5">
                                <div className="cartela-letter bg-gradient-to-b from-blue-500 to-blue-600 text-white font-bold text-center py-2 rounded-lg shadow-lg">B</div>
                                {Array.from({ length: 15 }, (_, i) => i + 1).map(n => {
                                    const isCalled = calledNumbers.includes(n);
                                    return (
                                        <button
                                            key={n}
                                            className={`cartela-number-btn text-[10px] leading-none transition-all duration-200 ${isCalled
                                                ? 'bg-gradient-to-b from-green-500 to-green-600 text-white animate-pulse'
                                                : 'bg-gradient-to-b from-slate-700/80 to-slate-800/80 text-slate-200'
                                                }`}
                                        >
                                            {n}
                                        </button>
                                    );
                                })}
                            </div>
                            {/* I Column */}
                            <div className="space-y-0.5">
                                <div className="cartela-letter bg-gradient-to-b from-purple-500 to-purple-600 text-white font-bold text-center py-2 rounded-lg shadow-lg">I</div>
                                {Array.from({ length: 15 }, (_, i) => i + 16).map(n => {
                                    const isCalled = calledNumbers.includes(n);
                                    return (
                                        <button
                                            key={n}
                                            className={`cartela-number-btn text-[10px] leading-none transition-all duration-200 ${isCalled
                                                ? 'bg-gradient-to-b from-green-500 to-green-600 text-white animate-pulse'
                                                : 'bg-gradient-to-b from-slate-700/80 to-slate-800/80 text-slate-200'
                                                }`}
                                        >
                                            {n}
                                        </button>
                                    );
                                })}
                            </div>
                            {/* N Column */}
                            <div className="space-y-0.5">
                                <div className="cartela-letter bg-gradient-to-b from-green-500 to-green-600 text-white font-bold text-center py-2 rounded-lg shadow-lg">N</div>
                                {Array.from({ length: 15 }, (_, i) => i + 31).map(n => {
                                    const isCalled = calledNumbers.includes(n);
                                    return (
                                        <button
                                            key={n}
                                            className={`cartela-number-btn text-[10px] leading-none transition-all duration-200 ${isCalled
                                                ? 'bg-gradient-to-b from-green-500 to-green-600 text-white animate-pulse'
                                                : 'bg-gradient-to-b from-slate-700/80 to-slate-800/80 text-slate-200'
                                                }`}
                                        >
                                            {n}
                                        </button>
                                    );
                                })}
                            </div>
                            {/* G Column */}
                            <div className="space-y-0.5">
                                <div className="cartela-letter bg-gradient-to-b from-orange-500 to-orange-600 text-white font-bold text-center py-2 rounded-lg shadow-lg">G</div>
                                {Array.from({ length: 15 }, (_, i) => i + 46).map(n => {
                                    const isCalled = calledNumbers.includes(n);
                                    return (
                                        <button
                                            key={n}
                                            className={`cartela-number-btn text-[10px] leading-none transition-all duration-200 ${isCalled
                                                ? 'bg-gradient-to-b from-green-500 to-green-600 text-white animate-pulse'
                                                : 'bg-gradient-to-b from-slate-700/80 to-slate-800/80 text-slate-200'
                                                }`}
                                        >
                                            {n}
                                        </button>
                                    );
                                })}
                            </div>
                            {/* O Column */}
                            <div className="space-y-0.5">
                                <div className="cartela-letter bg-gradient-to-b from-red-500 to-red-600 text-white font-bold text-center py-2 rounded-lg shadow-lg">O</div>
                                {Array.from({ length: 15 }, (_, i) => i + 61).map(n => {
                                    const isCalled = calledNumbers.includes(n);
                                    return (
                                        <button
                                            key={n}
                                            className={`cartela-number-btn text-[10px] leading-none transition-all duration-200 ${isCalled
                                                ? 'bg-gradient-to-b from-green-500 to-green-600 text-white animate-pulse'
                                                : 'bg-gradient-to-b from-slate-700/80 to-slate-800/80 text-slate-200'
                                                }`}
                                        >
                                            {n}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Enhanced Two Cards Stacked */}
                    <div className="space-y-3">
                        {/* Right Top Card - Enhanced Game Status */}
                        <div className="relative rounded-2xl p-4 bg-gradient-to-br from-purple-900/70 to-slate-900/50 ring-1 ring-white/20 shadow-2xl shadow-pink-500/20 backdrop-blur-md overflow-hidden border border-white/10">
                            <div className="shimmer-overlay"></div>
                            {/* Reference Design Status Header */}
                            <div className="flex items-center justify-between mb-4 px-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-white/80 text-sm font-medium">Recent Numbers</span>
                                    <div className="flex items-center gap-1">
                                        {/* TODO: Implement recent numbers display */}
                                    </div>
                                </div>
                                <button className="text-white text-lg w-8 h-8 grid place-items-center rounded-full transition-all duration-200 bg-white/10">
                                    🔊
                                </button>
                            </div>

                            {/* Reference Design Current Number Display */}
                            <div className="text-center mb-2">
                                <div className="mx-auto w-full flex items-center justify-center">
                                    {currentCalledNumber ? (
                                        <div className="w-48 h-48 rounded-full bg-white border-8 border-yellow-400 flex items-center justify-center shadow-2xl">
                                            <div className="text-purple-900 font-extrabold text-3xl">{currentCalledNumber}</div>
                                        </div>
                                    ) : (
                                        <div className="w-48 h-48 rounded-full bg-white/20 border-8 border-white/30 flex items-center justify-center">
                                            <div className="text-white/60 text-lg font-medium">Waiting...</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Bottom Card - Enhanced User's Cartella */}
                        <div className="relative rounded-2xl p-3 bg-gradient-to-br from-purple-900/70 to-slate-900/50 ring-1 ring-white/20 shadow-2xl shadow-black/30 overflow-hidden border border-white/10">
                            <div className="shimmer-overlay"></div>
                            {isWatchMode ? (
                                /* Watching Only Mode - Matching the image design */
                                <div className="rounded-xl p-4 text-center bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10">
                                    <div className="text-white font-bold text-lg mb-3 flex items-center justify-center gap-2">
                                        <span>👀</span>
                                        <span>Watching Only</span>
                                    </div>
                                    <div className="text-white/80 text-sm mb-4 space-y-2">
                                        <div className="text-white/90 text-sm leading-relaxed">
                                            {gameState.phase === 'running' ? (
                                                <>
                                                    <div className="mb-2">ይህ የዛሬ የጨዋታ ማጠናቀቅ ተጀመረ።</div>
                                                    <div className="mb-2">አዲስ የጨዋታ ማጠናቀቅ እዚህ ይጀምራል።</div>
                                                    <div className="mb-2">ተጠብቅ።</div>
                                                </>
                                            ) : gameState.phase === 'announce' ? (
                                                <>
                                                    <div className="mb-2">የጨዋታ ማጠናቀቅ ተጠናቋል።</div>
                                                    <div className="mb-2">አዲስ የጨዋታ ማጠናቀቅ እዚህ ይጀምራል።</div>
                                                    <div className="mb-2">ተጠብቅ።</div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="mb-2">የጨዋታ ምዝገባ ተከፍቷል።</div>
                                                    <div className="mb-2">አዲስ የጨዋታ ማጠናቀቅ እዚህ ይጀምራል።</div>
                                                    <div className="mb-2">ተጠብቅ።</div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Enhanced Normal Cartella Mode */
                                <>
                                    {/* Enhanced User's Cartella - 5x5 Grid */}
                                    <div className="rounded-xl p-3 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10">
                                        {/* Enhanced BINGO Header */}
                                        <div className="grid grid-cols-5 gap-1 mb-2">
                                            <div className="text-center text-white font-bold text-[10px] bg-gradient-to-b from-blue-500 to-blue-600 rounded-lg py-2 shadow-lg">B</div>
                                            <div className="text-center text-white font-bold text-[10px] bg-gradient-to-b from-purple-500 to-purple-600 rounded-lg py-2 shadow-lg">I</div>
                                            <div className="text-center text-white font-bold text-[10px] bg-gradient-to-b from-green-500 to-green-600 rounded-lg py-2 shadow-lg">N</div>
                                            <div className="text-center text-white font-bold text-[10px] bg-gradient-to-b from-pink-500 to-pink-600 rounded-lg py-2 shadow-lg">G</div>
                                            <div className="text-center text-white font-bold text-[10px] bg-gradient-to-b from-orange-500 to-orange-600 rounded-lg py-2 shadow-lg">O</div>
                                        </div>

                                        {/* TODO: Implement cartella grid */}
                                        <div className="grid grid-cols-5 gap-1">
                                            {Array.from({ length: 25 }, (_, i) => (
                                                <div key={i} className="w-full text-[9px] leading-none py-2 rounded-lg border bg-gradient-to-b from-slate-700/80 to-slate-800/80 text-slate-200 border-white/20">
                                                    {i === 12 ? '★' : '0'}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Enhanced Cartela Number Display */}
                                    <div className="text-center mt-3">
                                        <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white text-sm font-bold px-4 py-2 rounded-full inline-block shadow-lg border border-amber-400/30">
                                            🎫 Cartela #{selectedCartela || 47}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Enhanced Bottom Action Buttons */}
                <div className="flex justify-between p-3 mt-4 gap-3">
                    <button
                        onClick={() => onNavigate?.('game')}
                        className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-3 rounded-xl font-bold flex-1 text-sm hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 border border-orange-400/30"
                    >
                        Leave
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-3 rounded-xl font-bold flex-1 flex items-center justify-center gap-2 text-sm hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 border border-red-500/30"
                    >
                        <span className="animate-spin">↻</span>
                        <span>Refresh</span>
                    </button>
                    <button
                        onClick={() => { }}
                        disabled={isWatchMode}
                        className={`px-4 py-3 rounded-xl font-bold flex-1 text-sm transition-all duration-200 ${isWatchMode
                            ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-gray-300 cursor-not-allowed border border-gray-400/30 opacity-50'
                            : 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white hover:from-yellow-500 hover:via-orange-600 hover:to-red-600 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 border border-yellow-400/30'
                            }`}
                    >
                        🎉 BINGO
                    </button>
                </div>
            </div>
        </div>
    );
}