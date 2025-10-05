import React, { useState, useEffect } from 'react';
// Removed Game and CartelaSelection imports as related routes are deleted
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
    console.log('Current page:', currentPage, 'Selected stake:', selectedStake);
    switch (currentPage) {
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
        return (
          <div className="flex min-h-screen items-center justify-center p-8 text-center">
            <div>
              <img src="/lb.png" alt="Love Bingo" className="mx-auto mb-6 h-24 w-24" />
              <h1 className="text-2xl font-semibold">Welcome to Love Bingo</h1>
              <p className="mt-2 text-gray-600">Use the menu to navigate.</p>
            </div>
          </div>
        );
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
