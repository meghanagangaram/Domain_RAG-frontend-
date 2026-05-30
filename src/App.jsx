import React, { useState, useEffect } from 'react';
import Chat from './components/Chat';
import Documents from './components/Documents';
import Evaluation from './components/Evaluation';

const API_HOST = 'http://127.0.0.1:8000';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [backendOnline, setBackendOnline] = useState(false);
  const [checkingBackend, setCheckingBackend] = useState(true);

  // Ping backend to check status
  const checkBackendStatus = async () => {
    try {
      const res = await fetch(`${API_HOST}/api/documents`);
      if (res.ok) {
        setBackendOnline(true);
      } else {
        setBackendOnline(false);
      }
    } catch (e) {
      setBackendOnline(false);
    } finally {
      setCheckingBackend(false);
    }
  };

  useEffect(() => {
    checkBackendStatus();
    // Ping every 5 seconds
    const interval = setInterval(checkBackendStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      {/* Visual Space dust background overlay */}
      <div className="starfields"></div>

      <header className="app-header">
        <div className="logo">
          {/* Custom SVG logo icon representing space and data */}
          <svg className="logo-icon" viewBox="0 0 24 24">
            <defs>
              <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00d2ff" />
                <stop offset="100%" stopColor="#bd00ff" />
              </linearGradient>
            </defs>
            <path d="M12 2L2 22h20L12 2zm0 4l6.5 13H5.5L12 6zm-1 5h2v4h-2v-4zm0 5h2v2h-2v-2z" />
          </svg>
          GALACTIC ARCHIVE
        </div>

        <nav className="nav-tabs">
          <button 
            className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            Chat Console
          </button>
          <button 
            className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            Index Explorer
          </button>
          <button 
            className={`tab-btn ${activeTab === 'evaluation' ? 'active' : ''}`}
            onClick={() => setActiveTab('evaluation')}
          >
            Validation Suite
          </button>
        </nav>

        <div className="api-status">
          <span className={`status-dot ${backendOnline ? 'online' : 'offline'}`}></span>
          <span>{checkingBackend ? 'Syncing...' : backendOnline ? 'Archive Online' : 'Archive Offline'}</span>
        </div>
      </header>

      <main className="app-content">
        <div className="glass-panel glow-effect">
          {activeTab === 'chat' && <Chat apiHost={API_HOST} />}
          {activeTab === 'documents' && <Documents apiHost={API_HOST} />}
          {activeTab === 'evaluation' && <Evaluation apiHost={API_HOST} />}
        </div>
      </main>
    </div>
  );
}
