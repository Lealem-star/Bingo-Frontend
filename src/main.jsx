import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './lib/auth/AuthProvider.jsx'
import { ToastProvider } from './contexts/ToastContext.jsx'
import { WebSocketProvider } from './contexts/WebSocketContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ToastProvider>
        <WebSocketProvider>
          <App />
        </WebSocketProvider>
      </ToastProvider>
    </AuthProvider>
  </StrictMode>,
)
