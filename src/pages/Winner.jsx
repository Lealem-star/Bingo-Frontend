import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuth } from '../lib/auth/AuthProvider';

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

                <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <div className="text-sm mb-3 flex items-center gap-2">
                        <span>🏆</span>
                        <span>Winning Cartela : </span>
                        <span className="font-bold">{main.cartelaNumber || main.cardId || '-'}</span>
                    </div>

                    {typeof main.prize === 'number' && (
                        <div className="text-sm mb-3 flex items-center gap-2 text-amber-300">
                            <span>💰</span>
                            <span>Prize per winner:</span>
                            <span className="font-bold">{main.prize}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-5 gap-1 mb-3">
                        {['B', 'I', 'N', 'G', 'O'].map((h) => (
                            <div key={h} className={`text-center text-xs font-bold rounded-md py-2 ${h === 'B' ? 'bg-blue-500' : h === 'I' ? 'bg-purple-500' : h === 'N' ? 'bg-pink-500' : h === 'G' ? 'bg-green-500' : 'bg-orange-500'
                                }`}>{h}</div>
                        ))}
                        {(main.cardNumbers || Array.from({ length: 25 }, (_, i) => i === 12 ? 0 : i + 1)).map((n, idx) => {
                            const row = Math.floor(idx / 5);
                            const col = idx % 5;
                            const isCenter = row === 2 && col === 2;
                            const isHit = (main.called || []).includes(n);
                            const isWinningCell = Array.isArray(pattern) && pattern.includes(idx);
                            if (isCenter) {
                                return <div key={idx} className={`bg-green-500 rounded-md text-center py-2 text-yellow-300 ${isWinningCell ? 'ring-2 ring-yellow-400' : ''}`}>★</div>;
                            }
                            return (
                                <div key={idx} className={`text-center text-xs leading-none py-2 rounded-md border ${isHit ? 'bg-orange-500/90 border-orange-400 text-white' : 'bg-white text-slate-900 border-white/60'} ${isWinningCell ? 'ring-2 ring-yellow-400' : ''}`}>{n}</div>
                            );
                        })}
                    </div>

                    <div className="w-full h-8 rounded-md bg-amber-700/70 text-amber-200 text-xs flex items-center justify-center">
                        Redirecting to next game...
                    </div>
                    <div className="w-full h-8 rounded-md bg-slate-800/80 text-slate-200 text-xs flex items-center justify-center mt-2">
                        Auto-starting next game in {countdown}s
                    </div>
                </div>
            </div>
        </div>
    );
}
