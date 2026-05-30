import React, { useState, useRef, useEffect } from 'react';
import './Chat.css';

export default function Chat({ apiHost }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Greetings, Commander. I am the Galactic Federation Archivist. I have indexed **50 core documents** from the Galactic Archives, detailing planets, species, technologies, and factions. Ask me any query, and I will search the record.',
      sources: []
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // State for side drawer displaying retrieved chunk
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState(null);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const currentQuery = input;
    setInput('');
    setIsLoading(true);

    try {
      // Build conversation history (excluding the very first welcome message)
      const history = messages
        .filter((_, idx) => idx > 0)
        .map(msg => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        }));

      const res = await fetch(`${apiHost}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: currentQuery,
          history: history
        })
      });

      if (!res.ok) {
        throw new Error('API server returned an error');
      }

      const data = await res.json();
      
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer,
          sources: data.sources || []
        }
      ]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ **Transmission Error:** Unable to establish a connection with the Core Archive Server. 
          
          Please verify that the Python backend is running at \`${apiHost}\`.`,
          sources: []
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const openSourceDrawer = (source) => {
    setSelectedSource(source);
    setDrawerOpen(true);
  };

  return (
    <div className="chat-container animated-entry">
      <div className="chat-main">
        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message-row ${msg.role === 'user' ? 'user-row' : 'assistant-row'}`}>
              <div className="message-avatar">
                {msg.role === 'user' ? 'CMD' : 'ARC'}
              </div>
              <div className="message-bubble-wrapper">
                <div className="message-bubble">
                  {/* Clean text formatting for simple Markdown elements */}
                  <div className="message-text">
                     {msg.content.split('\n').map((paragraph, pIdx) => {
                       // Format bold texts (**text**)
                       let formatted = paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                       // Format code chunks (`code`)
                       formatted = formatted.replace(/`(.*?)`/g, '<code>$1</code>');
                       
                       if (paragraph.startsWith('### ')) {
                         return <h3 key={pIdx}>{paragraph.replace('### ', '')}</h3>;
                       }
                       if (paragraph.startsWith('* ')) {
                         return <li key={pIdx} dangerouslySetInnerHTML={{ __html: formatted.replace('* ', '') }} />;
                       }
                       return <p key={pIdx} dangerouslySetInnerHTML={{ __html: formatted }} />;
                     })}
                  </div>
                </div>
                
                {/* Sources section inside assistant bubble */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="sources-container">
                    <span className="sources-title">Retrieved Sources:</span>
                    <div className="sources-chips">
                      {msg.sources.map((src, srcIdx) => (
                        <button 
                          key={srcIdx} 
                          className="source-chip" 
                          onClick={() => openSourceDrawer(src)}
                        >
                          <span className={`classification-dot ${src.classification.toLowerCase()}`}></span>
                          <span className="source-name">{src.title.replace('Planet ', '').replace('The ', '')}</span>
                          <span className="source-score">{(src.score * 100).toFixed(0)}%</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message-row assistant-row">
              <div className="message-avatar typing">...</div>
              <div className="message-bubble-wrapper">
                <div className="message-bubble typing-bubble">
                  <div className="typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="chat-input-bar">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your query about planets, technologies, or factions..."
            className="chat-input"
            disabled={isLoading}
          />
          <button type="submit" className="send-btn" disabled={isLoading || !input.trim()}>
            {isLoading ? '...' : 'TRANSMIT'}
          </button>
        </form>
      </div>

      {/* Slide-out Source Context Drawer */}
      {drawerOpen && selectedSource && (
        <div className="drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <div className="source-drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Source Context Detail</h3>
              <button className="close-btn" onClick={() => setDrawerOpen(false)}>&times;</button>
            </div>
            <div className="drawer-body">
              <div className="source-meta-card">
                <div className="meta-row">
                  <span className="meta-label">Document:</span>
                  <span className="meta-val">{selectedSource.title}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Category:</span>
                  <span className="meta-val highlight">{selectedSource.category}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Security Clearance:</span>
                  <span className={`meta-val classification ${selectedSource.classification.toLowerCase()}`}>
                    {selectedSource.classification}
                  </span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Relevance Confidence:</span>
                  <span className="meta-val">{(selectedSource.score * 100).toFixed(2)}%</span>
                </div>
              </div>
              <div className="source-content-block">
                <h4>Retrieved Text Segment:</h4>
                <div className="chunk-text-box">
                  {selectedSource.content}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
