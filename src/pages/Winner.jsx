import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuth } from '../lib/auth/AuthProvider';
import CartellaCard from '../components/CartellaCard';

export default function Winner({ onNavigate }) {
    const { gameState } = useWebSocket();
    const { user } = useAuth();
    const [countdown, setCountdown] = useState(10);

    // Countdown timer
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else {
            // Redirect to cartela selection after 10 seconds
            onNavigate?.('cartela-selection');
        }
    }, [countdown, onNavigate]);

    const winners = gameState.winners || [];
    const isMulti = winners.length > 1;
    const main = winners[0] || {};

    // Find a winning pattern indices for display (rows, cols, diagonals)
    const findWinningPattern = (grid = [[]], called = []) => {
        if (!Array.isArray(grid) || grid.length !== 5) return null;
        const patterns = [
            [0, 1, 2, 3, 4],
            [5, 6, 7, 8, 9],
            [10, 11, 12, 13, 14],
            [15, 16, 17, 18, 19],
            [20, 21, 22, 23, 24],
            [0, 5, 10, 15, 20],
            [1, 6, 11, 16, 21],
            [2, 7, 12, 17, 22],
            [3, 8, 13, 18, 23],
            [4, 9, 14, 19, 24],
            [0, 6, 12, 18, 24],
            [4, 8, 12, 16, 20]
        ];
        for (const p of patterns) {
            const nums = p.map(idx => grid[Math.floor(idx / 5)]?.[idx % 5]).filter(n => n !== 0);
            if (nums.length === 5 && nums.every(n => called.includes(n))) return p;
        }
        return null;
    };

    const pattern = findWinningPattern(main.cardNumbers, main.called);

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-slate-900/80 backdrop-blur-md border border-white/10 shadow-2xl p-6 text-white relative">
                {/* Countdown Timer */}
                <div className="absolute top-4 right-4 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold">
                    {countdown}s
                </div>

                <div className="flex flex-col items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-yellow-400/90 flex items-center justify-center shadow-lg">
                        <span className="text-slate-900 text-2xl">👑</span>
                    </div>
                    <div className="text-yellow-300 font-extrabold text-3xl tracking-wide">BINGO!</div>
                    {isMulti ? (
                        <>
                            <div className="text-lg text-white/90">🎉 {winners.length} players won!</div>
                            {typeof main.prize === 'number' && (
                                <div className="text-sm text-amber-300">Each wins: <span className="font-bold">{main.prize}</span></div>
                            )}
                        </>
                    ) : (
                        <div className="text-lg text-white/90">🎉 {main.name || 'Winner'} WON! 🎉</div>
                    )}
                </div>

                {isMulti && (
                    <div className="flex flex-wrap gap-2 justify-center mb-6">
                        {winners.map((w, i) => (
                            <div key={i} className="px-3 py-2 rounded-full bg-white/10 border border-white/15 text-sm">
                                <span className="font-semibold mr-2">{w.name || w.cartelaNumber || `Player ${i + 1}`}</span>
                                <span className="opacity-80">#{w.cartelaNumber || w.cardId}</span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="rounded-xl bg-white/5 border border-white/10 p-6">
                    <div className="text-sm mb-4 flex items-center gap-2">
                        <span>🏆</span>
                        <span>Winning Cartela : </span>
                        <span className="font-bold text-yellow-300">{main.cartelaNumber || main.cardId || '-'}</span>
                    </div>

                    {typeof main.prize === 'number' && (
                        <div className="text-sm mb-4 flex items-center gap-2 text-amber-300">
                            <span>💰</span>
                            <span>Prize per winner:</span>
                            <span className="font-bold">{main.prize}</span>
                        </div>
                    )}

                    {/* Beautiful Cartella Card */}
                    <div className="flex justify-center mb-6">
                        <CartellaCard 
                            id={main.cartelaNumber || main.cardId || 'Winner'}
                            card={main.cardNumbers ? [
                                main.cardNumbers.slice(0, 5),
                                main.cardNumbers.slice(5, 10),
                                main.cardNumbers.slice(10, 15),
                                main.cardNumbers.slice(15, 20),
                                main.cardNumbers.slice(20, 25)
                            ] : null}
                            called={main.called || []}
                            isPreview={false}
                        />
                    </div>

                    <div className="w-full h-8 rounded-md bg-amber-700/70 text-amber-200 text-xs flex items-center justify-center">
                        አዲስ ጭዋታ ለመጀመር.....
                    </div>
                    <div className="w-full h-8 rounded-md bg-slate-800/80 text-slate-200 text-xs flex items-center justify-center mt-2">
                        Auto-starting next game in {countdown}s
                    </div>
                </div>
            </div>
        </div>
    );
}
