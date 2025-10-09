import React, { useEffect, useState } from 'react';
import CartellaCard from '../components/CartellaCard';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuth } from '../lib/auth/AuthProvider';
import { playNumberSound, preloadNumberSounds } from '../lib/audio/numberSounds';
import BottomNav from '../components/BottomNav';

export default function GameLayout({
    stake,
    selectedCartela,
    onNavigate,
}) {
    const { sessionId } = useAuth();
    const [showTimeout, setShowTimeout] = useState(false);

    console.log('GameLayout - Props received:', {
        stake,
        selectedCartela,
        sessionId: sessionId ? 'Present' : 'Missing'
    });

    const { connected, gameState, claimBingo } = useWebSocket();

    // Use ONLY WebSocket data - no props fallbacks
    const currentPlayersCount = gameState.playersCount || 0;
    const currentPrizePool = gameState.prizePool || 0;
    const calledNumbers = gameState.calledNumbers || [];
    const currentNumber = gameState.currentNumber;
    const currentGameId = gameState.gameId;

    console.log('GameLayout - WebSocket state:', {
        connected,
        gameState: {
            phase: gameState.phase,
            gameId: gameState.gameId,
            playersCount: gameState.playersCount,
            prizePool: gameState.prizePool,
            yourCard: gameState.yourCard,
            yourCardNumber: gameState.yourCardNumber
        },
        currentGameId,
        props: { selectedCartela, stake }
    });

    // Sound control
    const [isSoundOn, setIsSoundOn] = useState(true);

    // Preload sounds on first user toggle on (or mount if desired)
    useEffect(() => {
        // Attempt a deferred preload to speed up first play; ignore failures on restricted devices
        const id = setTimeout(() => {
            try { preloadNumberSounds(); } catch { /* noop */ }
        }, 1000);
        return () => clearTimeout(id);
    }, []);

    // Play sound when a new number arrives and sound is enabled
    useEffect(() => {
        if (isSoundOn && typeof currentNumber === 'number') {
            playNumberSound(currentNumber).catch(() => { });
        }
    }, [currentNumber, isSoundOn]);

    // Navigate to winner page when phase enters announce (for both players and watch mode)
    useEffect(() => {
        if (gameState.phase === 'announce') {
            // Navigate to winner page for all users (players and watch mode)
            onNavigate?.('winner');
        }
    }, [gameState.phase, onNavigate]);

    // Timeout mechanism for when gameId is not available
    useEffect(() => {
        if (!currentGameId) {
            const timeout = setTimeout(() => {
                setShowTimeout(true);
            }, 5000); // 5 second timeout

            return () => clearTimeout(timeout);
        } else {
            setShowTimeout(false);
        }
    }, [currentGameId]);
    const yourBingoCard = gameState.yourCard;
    const yourCardNumber = gameState.yourCardNumber || selectedCartela;

    // Determine if we're in watch mode (no selected cartella and no bingo card from WebSocket)
    const isWatchMode = !selectedCartela && !yourBingoCard;

    console.log('GameLayout - Bingo card data:', {
        yourBingoCard: yourBingoCard ? 'Present' : 'Missing',
        yourCardNumber,
        selectedCartela,
        isWatchMode
    });

    // Auto-transition back to CartelaSelection when registration starts
    useEffect(() => {
        if (isWatchMode && gameState.phase === 'registration') {
            console.log('Registration started, navigating back to CartelaSelection');
            onNavigate?.('cartela-selection');
        }
    }, [isWatchMode, gameState.phase, onNavigate]);

    // If we don't have a gameId and we're not connected, show loading state
    if (!currentGameId && !connected) {
        console.log('GameLayout - No gameId and not connected, showing loading state');
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 flex items-center justify-center">
                <div className="text-center text-white">
                    <div className="text-2xl mb-4">🎮</div>
                    <div className="text-lg mb-2">Connecting to game...</div>
                    <div className="text-sm text-gray-300 mb-4">Please wait while we connect to the game</div>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>

                    {/* Removed debug panel */}

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

    // If we're connected but don't have gameId yet, wait a bit longer for the snapshot
    if (!currentGameId && connected && gameState.phase === 'waiting') {
        console.log('GameLayout - Connected but waiting for game state...');
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 flex items-center justify-center">
                <div className="text-center text-white">
                    <div className="text-2xl mb-4">🎮</div>
                    <div className="text-lg mb-2">Loading game state...</div>
                    <div className="text-sm text-gray-300 mb-4">Please wait while we load the current game</div>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                </div>
            </div>
        );
    }

    // If we have a gameId but it's still loading, show a different loading state
    if (!currentGameId && connected) {
        console.log('GameLayout - Connected but no gameId yet, showing game loading state');
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 flex items-center justify-center">
                <div className="text-center text-white">
                    <div className="text-2xl mb-4">🎮</div>
                    <div className="text-lg mb-2">Loading game data...</div>
                    <div className="text-sm text-gray-300 mb-4">Please wait while we load the game information</div>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                </div>
            </div>
        );
    }

    // If we still don't have a gameId after connection, show the game interface anyway
    // This handles the case where the game is starting but we haven't received the gameId yet
    if (!currentGameId) {
        console.log('GameLayout - No gameId available, showing game interface with fallback data');
        // Use fallback data from websocket state
        const fallbackGameId = gameState.gameId || 'Loading...';
        const fallbackPlayersCount = currentPlayersCount || 0;
        const fallbackPrizePool = currentPrizePool || 0;

        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 relative overflow-hidden">
                {/* Animated background elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
                </div>

                {/* Header */}
                <header className="relative z-10 p-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-lg">🎮</span>
                            </div>
                            <div>
                                <h1 className="text-white font-bold text-xl">Love Bingo</h1>
                                <p className="text-white/70 text-sm">Game #{fallbackGameId}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-white/70 text-sm">Players</div>
                            <div className="text-white font-bold text-lg">{fallbackPlayersCount}</div>
                        </div>
                    </div>
                </header>

                {/* Main Game Area */}
                <main className="relative z-10 px-4 pb-20">
                    {/* Game Status */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-6">
                        <div className="text-center">
                            <div className="text-white/90 text-sm mb-2">Current Number</div>
                            <div className="text-6xl font-bold text-white mb-2">
                                {(() => {
                                    if (!currentNumber) return '--';
                                    const letter = currentNumber <= 15 ? 'B' : currentNumber <= 30 ? 'I' : currentNumber <= 45 ? 'N' : currentNumber <= 60 ? 'G' : 'O';
                                    return `${letter}-${currentNumber}`;
                                })()}
                            </div>
                            <div className="text-white/70 text-sm">
                                {calledNumbers.length} numbers called
                            </div>
                        </div>
                    </div>

                    {/* Prize Pool */}
                    <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 backdrop-blur-sm rounded-2xl p-4 mb-6">
                        <div className="text-center">
                            <div className="text-white/90 text-sm mb-1">Prize Pool</div>
                            <div className="text-3xl font-bold text-white">ETB {fallbackPrizePool}</div>
                        </div>
                    </div>

                    {/* BINGO Grid */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-6">
                        <div className="text-center text-white font-bold text-lg mb-4">BINGO</div>
                        <div className="grid grid-cols-5 gap-2">
                            {['B', 'I', 'N', 'G', 'O'].map((letter, colIndex) => (
                                <div key={letter} className="text-center">
                                    <div className="text-white font-bold text-lg mb-2">{letter}</div>
                                    <div className="space-y-1">
                                        {Array.from({ length: 15 }, (_, rowIndex) => {
                                            const number = colIndex * 15 + rowIndex + 1;
                                            const isCalled = calledNumbers.includes(number);
                                            return (
                                                <div
                                                    key={number}
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isCalled
                                                        ? 'bg-green-500 text-white'
                                                        : 'bg-white/20 text-white/70'
                                                        }`}
                                                >
                                                    {number}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Your Cartella */}
                    {!isWatchMode && (selectedCartela || yourCardNumber) && (
                        <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-sm rounded-2xl p-4 mb-6">
                            <div className="text-center text-white font-bold text-lg mb-4">
                                Your Cartella #{yourCardNumber}
                            </div>
                            <div className="grid grid-cols-5 gap-2">
                                {['B', 'I', 'N', 'G', 'O'].map((letter, colIndex) => (
                                    <div key={letter} className="text-center">
                                        <div className="text-white font-bold text-sm mb-1">{letter}</div>
                                        <div className="space-y-1">
                                            {Array.from({ length: 3 }, (_, rowIndex) => {
                                                const number = colIndex * 15 + rowIndex + 1;
                                                const isCalled = calledNumbers.includes(number);
                                                return (
                                                    <div
                                                        key={number}
                                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isCalled
                                                            ? 'bg-green-500 text-white'
                                                            : 'bg-white/20 text-white/70'
                                                            }`}
                                                    >
                                                        {number}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Watch Mode Message */}
                    {isWatchMode && (
                        <div className="bg-yellow-500/20 backdrop-blur-sm rounded-2xl p-4 mb-6">
                            <div className="text-center text-white">
                                <div className="text-lg font-bold mb-2">👀 Watch Mode</div>
                                <div className="text-sm text-white/70">
                                    You're watching this game. Select a cartella to play!
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Game Controls */}
                    <div className="flex justify-center space-x-4">
                        <button
                            onClick={() => onNavigate?.('cartela-selection')}
                            className="px-6 py-3 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 transition-colors"
                        >
                            Back to Selection
                        </button>
                        {!isWatchMode && (
                            <button
                                onClick={() => {
                                    // Handle bingo claim
                                    console.log('Bingo claimed!');
                                }}
                                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                            >
                                Claim Bingo
                            </button>
                        )}
                    </div>
                </main>
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
                {/* Enhanced Top Information Bar (compact with custom CSS) */}
                <div className="game-info-bar compact flex items-stretch rounded-2xl flex-nowrap mb-6">
                    <div className="wallet-box wallet-box--compact flex-1 group">
                        <div className="wallet-label">Game ID</div>
                        <div className="wallet-value font-bold text-yellow-300 truncate">{currentGameId || 'LB000000'}</div>
                    </div>
                    <div className="wallet-box wallet-box--compact flex-1 group">
                        <div className="wallet-label">Players</div>
                        <div className="wallet-value font-bold text-green-300">{currentPlayersCount}</div>
                    </div>
                    <div className="wallet-box wallet-box--compact flex-1 group">
                        <div className="wallet-label">Bet</div>
                        <div className="wallet-value font-bold text-blue-300">ETB {stake}</div>
                    </div>
                    <div className="wallet-box wallet-box--compact flex-1 group">
                        <div className="wallet-label">Prize</div>
                        <div className="wallet-value font-bold text-orange-300">ETB {currentPrizePool}</div>
                    </div>
                    <div className="wallet-box wallet-box--compact flex-1 group">
                        <div className="wallet-label">Called</div>
                        <div className="wallet-value font-bold text-pink-300">{calledNumbers.length}/75</div>
                    </div>
                </div>





                {/* Main Content Area - Enhanced 2 Column Layout */}
                <div className="grid grid-cols-2 p-2 gap-6 mt-6 mb-6 mr-4">
                    {/* Left Card - Enhanced BINGO Grid */}
                    <div className="rounded-2xl p-4 bg-gradient-to-br from-purple-900/70 to-slate-900/50 ring-1 ring-white/20 shadow-2xl shadow-purple-900/30 backdrop-blur-md border border-white/10">
                        <div className="grid grid-cols-5 gap-1">
                            {/* B Column */}
                            <div className="space-y-0.5">
                                <div className="cartela-letter relative w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white font-bold text-center flex items-center justify-center shadow-xl border-2 border-white/30 mx-auto">
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/30"></div>
                                    <span className="relative z-10 text-sm drop-shadow-sm">B</span>
                                </div>
                                {Array.from({ length: 15 }, (_, i) => i + 1).map(n => {
                                    const isCalled = calledNumbers.includes(n);
                                    const isCurrentNumber = currentNumber === n;
                                    return (
                                        <button
                                            key={n}
                                            className={`cartela-number-btn text-[10px] leading-none transition-all duration-200 ${isCurrentNumber
                                                ? 'bg-gradient-to-b from-green-500 to-green-600 text-white animate-pulse ring-2 ring-yellow-400'
                                                : isCalled
                                                    ? 'bg-gradient-to-b from-red-500 to-red-600 text-white'
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
                                <div className="cartela-letter relative w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 text-white font-bold text-center flex items-center justify-center shadow-xl border-2 border-white/30 mx-auto">
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/30"></div>
                                    <span className="relative z-10 text-sm drop-shadow-sm">I</span>
                                </div>
                                {Array.from({ length: 15 }, (_, i) => i + 16).map(n => {
                                    const isCalled = calledNumbers.includes(n);
                                    const isCurrentNumber = currentNumber === n;
                                    return (
                                        <button
                                            key={n}
                                            className={`cartela-number-btn text-[10px] leading-none transition-all duration-200 ${isCurrentNumber
                                                ? 'bg-gradient-to-b from-green-500 to-green-600 text-white animate-pulse ring-2 ring-yellow-400'
                                                : isCalled
                                                    ? 'bg-gradient-to-b from-red-500 to-red-600 text-white'
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
                                <div className="cartela-letter relative w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 text-white font-bold text-center flex items-center justify-center shadow-xl border-2 border-white/30 mx-auto">
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/30"></div>
                                    <span className="relative z-10 text-sm drop-shadow-sm">N</span>
                                </div>
                                {Array.from({ length: 15 }, (_, i) => i + 31).map(n => {
                                    const isCalled = calledNumbers.includes(n);
                                    const isCurrentNumber = currentNumber === n;
                                    return (
                                        <button
                                            key={n}
                                            className={`cartela-number-btn text-[10px] leading-none transition-all duration-200 ${isCurrentNumber
                                                ? 'bg-gradient-to-b from-green-500 to-green-600 text-white animate-pulse ring-2 ring-yellow-400'
                                                : isCalled
                                                    ? 'bg-gradient-to-b from-red-500 to-red-600 text-white'
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
                                <div className="cartela-letter relative w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white font-bold text-center flex items-center justify-center shadow-xl border-2 border-white/30 mx-auto">
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/30"></div>
                                    <span className="relative z-10 text-sm drop-shadow-sm">G</span>
                                </div>
                                {Array.from({ length: 15 }, (_, i) => i + 46).map(n => {
                                    const isCalled = calledNumbers.includes(n);
                                    const isCurrentNumber = currentNumber === n;
                                    return (
                                        <button
                                            key={n}
                                            className={`cartela-number-btn text-[10px] leading-none transition-all duration-200 ${isCurrentNumber
                                                ? 'bg-gradient-to-b from-green-500 to-green-600 text-white animate-pulse ring-2 ring-yellow-400'
                                                : isCalled
                                                    ? 'bg-gradient-to-b from-red-500 to-red-600 text-white'
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
                                <div className="cartela-letter relative w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-center flex items-center justify-center shadow-xl border-2 border-white/30 mx-auto">
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/30"></div>
                                    <span className="relative z-10 text-sm drop-shadow-sm">O</span>
                                </div>
                                {Array.from({ length: 15 }, (_, i) => i + 61).map(n => {
                                    const isCalled = calledNumbers.includes(n);
                                    const isCurrentNumber = currentNumber === n;
                                    return (
                                        <button
                                            key={n}
                                            className={`cartela-number-btn text-[10px] leading-none transition-all duration-200 ${isCurrentNumber
                                                ? 'bg-gradient-to-b from-green-500 to-green-600 text-white animate-pulse ring-2 ring-yellow-400'
                                                : isCalled
                                                    ? 'bg-gradient-to-b from-red-500 to-red-600 text-white'
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
                    <div className="space-y-6 ml-4">
                        {/* Floating Bingo Balls - Recent Numbers */}
                        <div className="relative rounded-3xl p-4 bg-gradient-to-br from-slate-900/70 via-slate-800/60 to-purple-900/60 ring-2 ring-white/20 shadow-2xl shadow-purple-500/30 backdrop-blur-xl overflow-hidden border border-white/20">
                            {/* Decorative background overlays */}
                            <div className="pointer-events-none absolute -top-10 -left-10 w-40 h-40 rounded-full bg-purple-500/10 blur-3xl"></div>
                            <div className="pointer-events-none absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-blue-500/10 blur-3xl"></div>
                            {/* Left fade for tube entrance */}
                            <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-slate-950/70 to-transparent"></div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1 justify-start min-w-0 overflow-hidden flex-nowrap">
                                    {(() => {
                                        const recent = [...calledNumbers.slice(-3), currentNumber]
                                            .filter((n) => typeof n === 'number');
                                        const toShow = recent.slice(-4);
                                        const toBadge = (n) => {
                                            const letter = n <= 15 ? 'B' : n <= 30 ? 'I' : n <= 45 ? 'N' : n <= 60 ? 'G' : 'O';
                                            const color = n <= 15
                                                ? 'from-blue-500 to-blue-600'
                                                : n <= 30
                                                    ? 'from-purple-500 to-purple-600'
                                                    : n <= 45
                                                        ? 'from-green-500 to-green-600'
                                                        : n <= 60
                                                            ? 'from-orange-500 to-orange-600'
                                                            : 'from-red-500 to-red-600';
                                            return (
                                                <div
                                                    key={`recent-${n}`}
                                                    className={`inline-flex items-center h-7 px-2 rounded-full bg-gradient-to-br ${color} text-white text-[10px] font-bold shadow-md border border-white/30`}
                                                >
                                                    <span className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">{`${letter}-${n}`}</span>
                                                </div>
                                            );
                                        };
                                        return toShow.map(toBadge);
                                    })()}
                                </div>
                                <button
                                    onClick={() => setIsSoundOn(v => !v)}
                                    className={`shrink-0 text-white w-8 h-8 grid place-items-center rounded-full transition-all duration-200 ${isSoundOn ? 'bg-white/10' : 'bg-white/5 opacity-70'}`}
                                    aria-label={isSoundOn ? 'Mute' : 'Unmute'}
                                    title={isSoundOn ? 'Mute' : 'Unmute'}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                                        {isSoundOn ? (
                                            <path d="M11 5l-4 4H4v6h3l4 4V5zm6.54 1.46a8 8 0 010 11.31M15.36 8.64a4.5 4.5 0 010 6.36" strokeLinecap="round" strokeLinejoin="round" />
                                        ) : (
                                            <>
                                                <path d="M11 5l-4 4H4v6h3l4 4V5" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M18 9l-6 6M12 9l6 6" strokeLinecap="round" strokeLinejoin="round" />
                                            </>
                                        )}
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Floating Current Number Ball */}
                        <div className="relative rounded-3xl p-6 bg-gradient-to-br from-slate-900/70 via-slate-800/60 to-purple-900/60 ring-2 ring-white/20 shadow-2xl shadow-purple-500/30 backdrop-blur-xl overflow-hidden border border-white/20">
                            {/* Decorative background overlays */}
                            <div className="pointer-events-none absolute -top-16 left-1/3 w-56 h-56 rounded-full bg-yellow-400/10 blur-3xl"></div>
                            <div className="pointer-events-none absolute -bottom-20 right-1/4 w-64 h-64 rounded-full bg-orange-500/10 blur-3xl"></div>
                            <div className="text-center">
                                <div className="mx-auto w-full flex items-center justify-center">
                                    {currentNumber ? (
                                        <div className="relative">
                                            <div className="w-36 h-36 md:w-44 md:h-44 rounded-full bg-white border-[10px] border-yellow-400 shadow-2xl flex items-center justify-center">
                                                <div className="relative z-10 text-purple-700 font-extrabold text-2xl md:text-3xl text-center">
                                                    {(() => {
                                                        const letter = currentNumber <= 15 ? 'B' : currentNumber <= 30 ? 'I' : currentNumber <= 45 ? 'N' : currentNumber <= 60 ? 'G' : 'O';
                                                        return `${letter}-${currentNumber}`;
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <div className="w-36 h-36 md:w-44 md:h-44 rounded-full bg-white/70 border-[10px] border-gray-300 shadow-xl flex items-center justify-center">
                                                <div className="relative z-10 text-gray-700 text-xl font-semibold">Waiting...</div>
                                            </div>
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
                                                    <div className="mb-2">ጭዋታው ተጀምሯል።</div>
                                                    <div className="mb-2">ቀጣይ ጭዋታ እስኪጀምር እዚህ ይቆዩ።</div>
                                                    <div className="mb-2">መልካም ተዝናኖት መልካም ዕድል።</div>
                                                </>
                                            ) : gameState.phase === 'announce' ? (
                                                <>
                                                    <div className="mb-2">ጨዋታው ተጠናቋል።</div>
                                                    <div className="mb-2">የአሸናፊ ማስታወቂያ ወደሚታይበት ያመራሉ።</div>
                                                    <div className="mb-2">በቅርቡ ወደ ቀጣይ ጭዋታ ይቀላቀላሉ።</div>
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
                                    <div className="rounded-xl p-3 mt-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10">
                                        {/* Enhanced BINGO Header */}
                                        {/* <div className="grid grid-cols-5 gap-1 mb-2">
                                            <div className="text-center text-white font-bold text-[10px] bg-gradient-to-b from-blue-500 to-blue-600 rounded-lg py-2 shadow-lg">B</div>
                                            <div className="text-center text-white font-bold text-[10px] bg-gradient-to-b from-purple-500 to-purple-600 rounded-lg py-2 shadow-lg">I</div>
                                            <div className="text-center text-white font-bold text-[10px] bg-gradient-to-b from-green-500 to-green-600 rounded-lg py-2 shadow-lg">N</div>
                                            <div className="text-center text-white font-bold text-[10px] bg-gradient-to-b from-pink-500 to-pink-600 rounded-lg py-2 shadow-lg">G</div>
                                            <div className="text-center text-white font-bold text-[10px] bg-gradient-to-b from-orange-500 to-orange-600 rounded-lg py-2 shadow-lg">O</div>
                                        </div> */}

                                        {/* Implemented cartella grid using CartellaCard */}
                                        <CartellaCard
                                            id={yourCardNumber || selectedCartela}
                                            card={yourBingoCard}
                                            called={calledNumbers}
                                            isPreview={false}
                                        />
                                    </div>

                                    {/* Enhanced Cartela Number Display */}
                                    {/* <div className="text-center mt-3">
                                        <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white text-sm font-bold px-4 py-2 rounded-full inline-block shadow-lg border border-amber-400/30">
                                            🎫 Cartela #{yourCardNumber || selectedCartela || 47}
                                        </div>
                                    </div> */}

                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Enhanced Bottom Action Buttons */}
                <div className="flex justify-between p-4 mt-6 gap-4">
                    {/* Leave Button */}
                    <button
                        onClick={() => onNavigate?.('game')}
                        className="group relative flex-1 bg-gradient-to-br from-slate-600 to-slate-700 text-white px-6 py-4 rounded-2xl font-bold text-sm hover:from-slate-500 hover:to-slate-600 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 border border-slate-400/30 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                        <div className="relative flex items-center justify-center gap-2">
                            <span className="text-lg">🚪</span>
                            <span>Leave Game</span>
                        </div>
                    </button>

                    {/* Refresh Button */}
                    <button
                        onClick={() => window.location.reload()}
                        className="group relative flex-1 bg-gradient-to-br from-blue-500 to-blue-600 text-white px-6 py-4 rounded-2xl font-bold text-sm hover:from-blue-400 hover:to-blue-500 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 border border-blue-400/30 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                        <div className="relative flex items-center justify-center gap-2">
                            <span className="text-lg group-hover:rotate-180 transition-transform duration-500">🔄</span>
                            <span>Refresh</span>
                        </div>
                    </button>

                    {/* BINGO Button */}
                    <button
                        onClick={() => { claimBingo(); }}
                        disabled={isWatchMode}
                        className={`group relative flex-1 px-6 py-4 rounded-2xl font-bold text-sm transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 overflow-hidden ${isWatchMode
                            ? 'bg-gradient-to-br from-gray-500 to-gray-600 text-gray-300 cursor-not-allowed border border-gray-400/30 opacity-50'
                            : 'bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 text-white hover:from-yellow-300 hover:via-orange-400 hover:to-red-400 border border-yellow-400/30'
                            }`}
                    >
                        {!isWatchMode && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                        )}
                        <div className="relative flex items-center justify-center gap-2">
                            <span className="text-lg group-hover:animate-bounce">🎉</span>
                            <span className="font-extrabold">BINGO!</span>
                        </div>
                        {!isWatchMode && (
                            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 rounded-2xl"></div>
                        )}
                    </button>
                </div>

                <BottomNav current="game" onNavigate={onNavigate} />

            </div>
        </div>
    );
}