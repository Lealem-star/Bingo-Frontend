import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../lib/auth/AuthProvider';

const WebSocketContext = createContext();

export function WebSocketProvider({ children }) {
    const { sessionId } = useAuth();
    const wsRef = useRef(null);
    const [connected, setConnected] = useState(false);
    const [gameState, setGameState] = useState({
        phase: 'waiting',
        gameId: null,
        playersCount: 0,
        prizePool: 0,
        calledNumbers: [],
        currentNumber: null,
        takenCards: [],
        yourSelection: null,
        yourCard: null,
        yourCardNumber: null,
        countdown: 0,
        registrationEndTime: null,
        isWatchMode: false,
        winners: []
    });
    const [lastEvent, setLastEvent] = useState(null);
    const [currentStake, setCurrentStake] = useState(null);
    const [messageCount, setMessageCount] = useState(0);
    const [pendingGameStart, setPendingGameStart] = useState(null);

    const send = useCallback((type, payload) => {
        const ws = wsRef.current;
        const message = JSON.stringify({ type, payload });
        console.log('WebSocket send:', { type, payload, connected, readyState: ws?.readyState });

        if (ws && ws.readyState === WebSocket.OPEN) {
            try {
                ws.send(message);
                console.log('Message sent successfully:', { type, payload });
                return true;
            } catch (error) {
                console.error('Error sending message:', error);
                return false;
            }
        } else {
            console.warn('WebSocket not ready, message not sent:', { type, payload, readyState: ws?.readyState });
            return false;
        }
    }, [connected]);

    // Connect to WebSocket when stake is selected
    const connectToStake = useCallback((stake) => {
        if (!sessionId || !stake) {
            console.log('WebSocket connection skipped - missing sessionId or stake:', { sessionId, stake });
            return;
        }

        // If already connected to the same stake, don't reconnect
        if (connected && currentStake === stake && wsRef.current?.readyState === WebSocket.OPEN) {
            console.log('Already connected to stake:', stake);
            return;
        }

        // Close existing connection
        if (wsRef.current) {
            console.log('Closing existing connection');
            wsRef.current.close();
            wsRef.current = null;
            setConnected(false);
        }

        setCurrentStake(stake);
        console.log('Connecting to WebSocket for stake:', stake);

        let stopped = false;
        let connecting = false;
        let retry = 0;
        let heartbeat = null;
        let hasJoinedRoom = false;

        const connect = () => {
            if (connecting || stopped) {
                console.log('WebSocket connection skipped - already connecting or stopped');
                return;
            }

            connecting = true;
            const wsBase = import.meta.env.VITE_WS_URL ||
                (window.location.hostname === 'localhost' ? 'ws://localhost:3001' :
                    'wss://bingo-back-2evw.onrender.com');
            const wsUrl = `${wsBase}/ws?token=${sessionId}&stake=${stake}`;
            console.log('Connecting to WebSocket:', wsUrl);

            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('WebSocket connected successfully to stake:', stake);
                console.log('WebSocket readyState:', ws.readyState);
                setConnected(true);
                connecting = false;
                retry = 0;

                // Join the room immediately
                if (!hasJoinedRoom) {
                    console.log('Sending join_room message:', { stake });
                    ws.send(JSON.stringify({ type: 'join_room', payload: { stake } }));
                    hasJoinedRoom = true;
                }

                // Start heartbeat
                heartbeat = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        console.log('Sending ping...');
                        ws.send(JSON.stringify({ type: 'ping' }));
                    }
                }, 20000);
            };

            ws.onmessage = (e) => {
                try {
                    setMessageCount(prev => prev + 1);
                    console.log('Raw WebSocket message received:', e.data);
                    const event = JSON.parse(e.data);
                    console.log('WebSocket message received:', event);
                    console.log('WebSocket message type:', event.type);
                    console.log('WebSocket message payload:', event.payload);

                    // Special logging for game_started messages
                    if (event.type === 'game_started') {
                        console.log('🎮 GAME_STARTED MESSAGE RECEIVED!', {
                            gameId: event.payload.gameId,
                            cardNumber: event.payload.cardNumber,
                            hasCard: !!event.payload.card,
                            playersCount: event.payload.playersCount
                        });
                    }

                    setLastEvent(event);

                    switch (event.type) {
                        case 'snapshot':
                            setGameState(prev => ({
                                ...prev,
                                ...event.payload,
                                phase: event.payload.phase || 'waiting',
                                gameId: event.payload.gameId,
                                playersCount: event.payload.playersCount || 0,
                                prizePool: event.payload.prizePool || 0,
                                calledNumbers: event.payload.calledNumbers || event.payload.called || [],
                                takenCards: event.payload.takenCards || [],
                                yourSelection: event.payload.yourSelection,
                                countdown: event.payload.countdown || 0,
                                registrationEndTime: event.payload.registrationEndTime,
                                isWatchMode: event.payload.isWatchMode || false
                            }));
                            break;

                        case 'game_started':
                            console.log('Processing game_started message:', event.payload);
                            setGameState(prev => ({
                                ...prev,
                                phase: 'running',
                                gameId: event.payload.gameId,
                                playersCount: event.payload.playersCount,
                                prizePool: event.payload.prizePool,
                                calledNumbers: event.payload.calledNumbers || event.payload.called || [],
                                yourCard: event.payload.card,
                                yourCardNumber: event.payload.cardNumber,
                                isWatchMode: false
                            }));
                            setPendingGameStart(null); // Clear any pending game start
                            console.log('Game state updated after game_started');
                            break;

                        case 'number_called':
                            setGameState(prev => ({
                                ...prev,
                                currentNumber: event.payload.number,
                                calledNumbers: event.payload.calledNumbers || event.payload.called || []
                            }));
                            break;

                        case 'players_update':
                            setGameState(prev => ({
                                ...prev,
                                playersCount: event.payload.playersCount,
                                prizePool: event.payload.prizePool
                            }));
                            break;

                        case 'registration_update':
                            setGameState(prev => ({
                                ...prev,
                                takenCards: event.payload.takenCards || [],
                                prizePool: event.payload.prizePool
                            }));
                            break;

                        case 'selection_confirmed':
                            setGameState(prev => ({
                                ...prev,
                                yourSelection: event.payload.cardNumber,
                                playersCount: event.payload.playersCount,
                                prizePool: event.payload.prizePool
                            }));
                            break;

                        case 'bingo_accepted':
                            setGameState(prev => ({
                                ...prev,
                                winners: event.payload.winners || [],
                                phase: 'announce'
                            }));
                            break;

                        case 'game_finished':
                        case 'game_ended':
                            setGameState(prev => ({
                                ...prev,
                                phase: 'announce',
                                winners: (event.payload && (event.payload.winners || [])) || [],
                                calledNumbers: (event.payload && (event.payload.calledNumbers || event.payload.called)) || prev.calledNumbers,
                                currentNumber: null
                            }));
                            break;

                        case 'pong':
                            // Heartbeat response
                            break;

                        default:
                            console.log('Unhandled WebSocket event:', event.type);
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            ws.onclose = (event) => {
                console.log('WebSocket closed:', { code: event.code, reason: event.reason, wasClean: event.wasClean });
                setConnected(false);
                if (heartbeat) {
                    clearInterval(heartbeat);
                    heartbeat = null;
                }
                if (!stopped) {
                    const delay = Math.min(1000 * 2 ** retry, 10000);
                    retry += 1;
                    console.log(`Retrying connection in ${delay}ms (attempt ${retry})`);
                    setTimeout(() => {
                        // Reconnect and rejoin the room
                        connect();
                        // Rejoin the room after a short delay
                        setTimeout(() => {
                            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                                console.log('Rejoining room after reconnection');
                                wsRef.current.send(JSON.stringify({ type: 'join_room', payload: { stake } }));
                            }
                        }, 1000);
                    }, delay);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                connecting = false;
                setConnected(false);
            };
        };

        connect();

        return () => {
            stopped = true;
            if (heartbeat) {
                clearInterval(heartbeat);
            }
        };
    }, [sessionId, connected, currentStake]);

    // Debug connection state
    useEffect(() => {
        console.log('WebSocket state changed:', {
            connected,
            currentStake,
            readyState: wsRef.current?.readyState,
            OPEN: WebSocket.OPEN
        });
    }, [connected, currentStake]);

    // Disconnect when component unmounts or sessionId changes
    useEffect(() => {
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, []);

    const selectCartella = useCallback((cardNumber) => {
        return send('select_card', { cardNumber });
    }, [send]);

    const claimBingo = useCallback(() => {
        return send('bingo_claim', {});
    }, [send]);

    // Debug connection state
    useEffect(() => {
        console.log('WebSocket Context State:', {
            connected,
            currentStake,
            readyState: wsRef.current?.readyState,
            gameState: {
                phase: gameState.phase,
                gameId: gameState.gameId,
                playersCount: gameState.playersCount
            }
        });
    }, [connected, currentStake, gameState.phase, gameState.gameId, gameState.playersCount]);

    const value = {
        connected,
        gameState,
        lastEvent,
        currentStake,
        connectToStake,
        selectCartella,
        claimBingo,
        send,
        // Debug info
        wsReadyState: wsRef.current?.readyState,
        isConnecting: wsRef.current?.readyState === WebSocket.CONNECTING,
        messageCount
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
}

export function useWebSocket() {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
}
