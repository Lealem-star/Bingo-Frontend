import React, { useState, useEffect } from 'react';
import Game from './pages/Game';
import CartelaSelection from './pages/CartelaSelection';
import Rules from './components/Rules';
import Scores from './pages/Scores';
import History from './pages/History';
import Wallet from './pages/Wallet';
import Profile from './pages/Profile';
import GameLayout from './pages/GameLayout';
import { AuthProvider } from './lib/auth/AuthProvider.jsx';
import { ToastProvider } from './contexts/ToastContext.jsx';
import { WebSocketProvider } from './contexts/WebSocketContext.jsx';
import AdminLayout from './admin/AdminLayout.jsx';

function App() {
  const [currentPage, setCurrentPage] = useState('game');
  const [selectedStake, setSelectedStake] = useState(null);
  const [selectedCartela, setSelectedCartela] = useState(null);
  const [currentGameId, setCurrentGameId] = useState(null);
  const [isAdminApp, setIsAdminApp] = useState(false);

  // Handle query parameter routing for admin panel
  useEffect(() => {
    const checkAdminParam = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const isAdmin = urlParams.get('admin') === 'true';
      console.log('Admin parameter check:', isAdmin); // Debug log
      if (isAdmin) {
        setCurrentPage('admin');
      } else {
        setCurrentPage('game');
      }
    };

    // Check initial admin parameter
    checkAdminParam();

    // Listen for URL changes (including query parameter changes)
    const handleUrlChange = () => {
      checkAdminParam();
    };

    window.addEventListener('popstate', handleUrlChange);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);


  const handleStakeSelected = (stake) => {
    console.log('Stake selected:', stake);
    setSelectedStake(stake);
    setCurrentPage('cartela-selection');
    console.log('Navigating to cartela-selection');
  };

  const handleCartelaSelected = (cartela) => {
    console.log('handleCartelaSelected called:', { cartela, currentGameId, selectedStake });
    setSelectedCartela(cartela);
    // Navigate to game layout; preserve stake even if cartela is null (watch mode)
    setCurrentPage('game-layout');
  };

  const handleGameIdUpdate = (gameId) => {
    setCurrentGameId(gameId);
  };

  const handleNavigate = (page) => {
    console.log('Navigating from', currentPage, 'to', page, 'with stake:', selectedStake, 'cartela:', selectedCartela);

    if (page === 'game') {
      // Clear stake when leaving selection or game layout back to stake selection
      if (currentPage === 'cartela-selection' || currentPage === 'game-layout') {
        setSelectedStake(null);
        setSelectedCartela(null);
      }
      // Otherwise, preserve the current state when navigating from other pages
    }
    setCurrentPage(page);
  };

  const renderPage = () => {
    console.log('Current page:', currentPage, 'Selected stake:', selectedStake);
    switch (currentPage) {
      case 'game':
        return <Game onNavigate={handleNavigate} onStakeSelected={handleStakeSelected} selectedCartela={selectedCartela} selectedStake={selectedStake} currentGameId={currentGameId} />;
      case 'cartela-selection':
        return <CartelaSelection onNavigate={handleNavigate} stake={selectedStake} onCartelaSelected={handleCartelaSelected} onGameIdUpdate={handleGameIdUpdate} />;
      case 'game-layout':
        return <GameLayout stake={selectedStake} selectedCartela={selectedCartela} onNavigate={handleNavigate} />;
      case 'admin':
        return <AdminLayout onNavigate={handleNavigate} />;
      case 'rules':
        return <Rules onNavigate={handleNavigate} />;
      case 'scores':
        return <Scores onNavigate={handleNavigate} />;
      // history removed
      case 'wallet':
        return <Wallet onNavigate={handleNavigate} />;
      case 'profile':
        return <Profile onNavigate={handleNavigate} />;
      default:
        return <Game onNavigate={handleNavigate} onStakeSelected={handleStakeSelected} selectedCartela={selectedCartela} selectedStake={selectedStake} />;
    }
  };

  return (
    <AuthProvider>
      <ToastProvider>
        <WebSocketProvider>
          <div className="App">
            {renderPage()}
          </div>
        </WebSocketProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
