import React, { useEffect, useState } from 'react';
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
    const [gameState, setGameState] = useState({
        phase: 'running',
        gameId: gameId,
        playersCount: playersCount,
        prizePool: prizePool,
        calledNumbers: [],
        currentNumber: null,
        gameStatus: 'running',
        yourCard: selectedCartela,
        winners: []
    });

    console.log('GameLayout - Props received:', {
        stake,
        selectedCartela,
        gameId,
        sessionId: sessionId ? 'Present' : 'Missing',
        playersCount,
        prizePool
    });

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

    // Use props directly since we're not using WebSocket here
    const currentPlayersCount = playersCount;
    const currentPrizePool = prizePool;
    const calledNumbers = gameState.calledNumbers || [];
    const currentNumber = gameState.currentNumber;

    // Determine if we're in watch mode (no selected cartella)
    const isWatchMode = !selectedCartela;

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
                            <p className="text-white/70 text-sm">Game #{gameId || 'Loading...'}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-white/70 text-sm">Players</div>
                        <div className="text-white font-bold text-lg">{currentPlayersCount}</div>
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
                        <div className="text-3xl font-bold text-white">ETB {currentPrizePool}</div>
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
                {!isWatchMode && selectedCartela && (
                    <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-sm rounded-2xl p-4 mb-6">
                        <div className="text-center text-white font-bold text-lg mb-4">
                            Your Cartella #{selectedCartela}
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