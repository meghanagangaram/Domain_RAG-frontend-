import React, { useState, useEffect } from 'react';
import './Documents.css';

export default function Documents({ apiHost }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedClassification, setSelectedClassification] = useState('All');
  
  // Selected single document details view
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docContent, setDocContent] = useState('');
  const [docLoading, setDocLoading] = useState(false);
  const [reindexing, setReindexing] = useState(false);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiHost}/api/documents`);
      if (res.ok) {
        const data = await res.json();
        setDocs(data);
      }
    } catch (e) {
      console.error('Error fetching documents:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleSelectDoc = async (docId) => {
    setDocLoading(true);
    setSelectedDoc(docs.find(d => d.id === docId));
    try {
      const res = await fetch(`${apiHost}/api/documents/${docId}`);
      if (res.ok) {
        const data = await res.json();
        // Remove frontmatter yaml block from display to keep it clean
        const cleaned = data.raw_content.replace(/^---\s*\n.*?\n---\s*\n/s, '');
        setDocContent(cleaned);
      }
    } catch (e) {
      setDocContent('Error retrieving document content.');
    } finally {
      setDocLoading(false);
    }
  };

  const handleRebuildIndex = async () => {
    if (reindexing) return;
    setReindexing(true);
    try {
      const res = await fetch(`${apiHost}/api/rebuild-index`, { method: 'POST' });
      if (res.ok) {
        alert('Indexing triggered! Chunks are being recomputed in the background.');
        setTimeout(fetchDocs, 3000);
      }
    } catch (e) {
      alert('Error triggering reindex.');
    } finally {
      setReindexing(false);
    }
  };

  // Filter docs
  const filteredDocs = docs.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory;
    const matchesClass = selectedClassification === 'All' || doc.classification === selectedClassification;
    return matchesSearch && matchesCategory && matchesClass;
  });

  const categories = ['All', 'Planets', 'Space Stations', 'Species', 'Factions', 'Technologies'];
  const classifications = ['All', 'Public', 'Restricted', 'Top Secret'];

  return (
    <div className="docs-tab-container animated-entry">
      <div className="docs-sidebar-panel">
        <div className="panel-header">
          <h3>Galactic Index ({filteredDocs.length})</h3>
          <button 
            className="reindex-btn" 
            onClick={handleRebuildIndex}
            disabled={reindexing}
          >
            {reindexing ? 'Reindexing...' : 'Rebuild Index'}
          </button>
        </div>
        
        {/* Search & Filters */}
        <div className="search-filters-box">
          <input
            type="text"
            className="docs-search-input"
            placeholder="Search document title..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <div className="filter-select-group">
            <div className="select-container">
              <label>Category</label>
              <select 
                value={selectedCategory} 
                onChange={e => setSelectedCategory(e.target.value)}
              >
                {categories.map((c, i) => <option key={i} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="select-container">
              <label>Clearance</label>
              <select 
                value={selectedClassification} 
                onChange={e => setSelectedClassification(e.target.value)}
              >
                {classifications.map((c, i) => <option key={i} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* List of Docs */}
        <div className="docs-list-scroll">
          {loading ? (
            <div className="loader">Querying index database...</div>
          ) : filteredDocs.length === 0 ? (
            <div className="no-docs-found">No documents match the search criteria.</div>
          ) : (
            filteredDocs.map(doc => (
              <div 
                key={doc.id} 
                className={`doc-list-item ${selectedDoc?.id === doc.id ? 'active' : ''}`}
                onClick={() => handleSelectDoc(doc.id)}
              >
                <div className="doc-item-title">{doc.title}</div>
                <div className="doc-item-meta">
                  <span className="doc-item-cat">{doc.category}</span>
                  <span className={`doc-item-class ${doc.classification.toLowerCase()}`}>
                    {doc.classification}
                  </span>
                  <span className="doc-item-chunks">{doc.chunks_count} chunks</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Document Content View */}
      <div className="doc-content-viewer">
        {selectedDoc ? (
          <div className="viewer-inner">
            <div className="viewer-header">
              <div>
                <h2>{selectedDoc.title}</h2>
                <div className="header-meta-chips">
                  <span className="meta-category-chip">{selectedDoc.category}</span>
                  <span className={`meta-classification-chip ${selectedDoc.classification.toLowerCase()}`}>
                    {selectedDoc.classification} Security
                  </span>
                </div>
              </div>
            </div>
            <div className="viewer-body">
              {docLoading ? (
                <div className="content-loader">Decrypting data streams...</div>
              ) : (
                <div className="markdown-content">
                  {docContent.split('\n').map((line, idx) => {
                    if (line.startsWith('# ')) {
                      return <h1 key={idx}>{line.replace('# ', '')}</h1>;
                    }
                    if (line.startsWith('## ')) {
                      return <h2 key={idx}>{line.replace('## ', '')}</h2>;
                    }
                    if (line.startsWith('**')) {
                      // Bold details line
                      let cleanLine = line.replace(/\*\*/g, '');
                      return <p key={idx} className="highlights-line"><strong>{cleanLine}</strong></p>;
                    }
                    if (line.trim() === '') {
                      return <div key={idx} style={{ height: '0.8rem' }} />;
                    }
                    return <p key={idx}>{line}</p>;
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="viewer-placeholder">
            <div className="placeholder-icon">🛸</div>
            <h3>Select a record from the Galactic Index</h3>
            <p>Access decrypted lore data streams, planetary maps, and defensive specifications.</p>
          </div>
        )}
      </div>
    </div>
  );
}
