import React, { useState, useEffect } from 'react';
import Game from './pages/Game';
import Rules from './components/Rules';
import Scores from './pages/Scores';
import Wallet from './pages/Wallet';
import Profile from './pages/Profile';
import { AuthProvider } from './lib/auth/AuthProvider.jsx';
import { ToastProvider } from './contexts/ToastContext.jsx';
import { WebSocketProvider } from './contexts/WebSocketContext.jsx';
import AdminLayout from './admin/AdminLayout.jsx';

function App() {
  const [currentPage, setCurrentPage] = useState('game');
  const [selectedStake, setSelectedStake] = useState(null);
  const [selectedCartela, setSelectedCartela] = useState(null);
  const [currentGameId, setCurrentGameId] = useState(null);


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
    setSelectedStake(stake);
  };



  const handleNavigate = (page) => {
    console.log('Navigating from', currentPage, 'to', page, 'with stake:', selectedStake, 'cartela:', selectedCartela);

    if (page === 'game') {
      // Only clear stake if we're coming from cartela-selection page (back button)
      if (currentPage === 'cartela-selection') {
        setSelectedStake(null);
        setSelectedCartela(null);
      }
      // Otherwise, preserve the current state when navigating from other pages
    }
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'game':
        return <Game onNavigate={handleNavigate} onStakeSelected={handleStakeSelected} selectedStake={selectedStake} />;
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
        return <Game onNavigate={handleNavigate} onStakeSelected={handleStakeSelected} selectedStake={selectedStake} />;
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
