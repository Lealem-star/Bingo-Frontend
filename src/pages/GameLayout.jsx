import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuth } from '../lib/auth/AuthProvider';

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

    const { connected, gameState, wsReadyState } = useWebSocket();

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
                                {currentNumber || '--'}
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
                <div className="game-info-bar compact flex items-stretch rounded-2xl">
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

                                        {/* Current Number Display */}
                                        {currentNumber && (
                                            <div className="mt-4 text-center">
                                                <div className="text-6xl font-bold text-yellow-300 animate-pulse">
                                                    {currentNumber}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button className="text-white text-lg w-8 h-8 grid place-items-center rounded-full transition-all duration-200 bg-white/10">
                                    🔊
                                </button>
                            </div>

                            {/* Reference Design Current Number Display */}
                            <div className="text-center mb-2">
                                <div className="mx-auto w-full flex items-center justify-center">
                                    {currentNumber ? (
                                        <div className="w-48 h-48 rounded-full bg-white border-8 border-yellow-400 flex items-center justify-center shadow-2xl">
                                            <div className="text-purple-900 font-extrabold text-3xl">{currentNumber}</div>
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
                                            🎫 Cartela #{yourCardNumber || selectedCartela || 47}
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