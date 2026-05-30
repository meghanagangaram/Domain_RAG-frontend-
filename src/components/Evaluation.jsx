import React, { useState, useEffect } from 'react';
import './Evaluation.css';

export default function Evaluation({ apiHost }) {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [expandedCase, setExpandedCase] = useState(null);
  const [timer, setTimer] = useState(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${apiHost}/api/evaluation-status`);
      if (res.ok) {
        const data = await res.json();
        setIsRunning(data.is_running);
        if (data.latest_results) {
          setResults(data.latest_results);
        }
      }
    } catch (e) {
      console.error('Error fetching evaluation status:', e);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Poll status every 4 seconds if running
    const interval = setInterval(() => {
      fetchStatus();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const triggerEvaluation = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setExpandedCase(null);
    try {
      const res = await fetch(`${apiHost}/api/evaluate`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setIsRunning(data.is_running);
      }
    } catch (e) {
      console.error('Error starting evaluation:', e);
      setIsRunning(false);
    }
  };

  const toggleExpandCase = (id) => {
    setExpandedCase(expandedCase === id ? null : id);
  };

  const formatPercentage = (val) => {
    return `${(val * 100).toFixed(0)}%`;
  };

  const formatScore = (val) => {
    return val.toFixed(2);
  };

  return (
    <div className="eval-tab-container animated-entry">
      <div className="eval-controls-card">
        <div className="controls-left">
          <h2>RAG Evaluation & Validation Suite</h2>
          <p>Assess retrieval accuracy (Hit Rate, MRR) and response quality (Faithfulness, Relevance, Recall) against a 20 Q&A benchmark using LLM-as-a-judge.</p>
        </div>
        <button 
          className={`run-eval-btn ${isRunning ? 'running' : ''}`}
          onClick={triggerEvaluation}
          disabled={isRunning}
        >
          {isRunning ? (
            <div className="btn-loader">
              <span className="spinner"></span> Running Judge Stream...
            </div>
          ) : 'Run Complete Evaluation'}
        </button>
      </div>

      {isRunning && (
        <div className="running-notice glow-effect">
          <div className="radar-animation">
            <div className="radar-circle"></div>
            <div className="radar-line"></div>
          </div>
          <div className="running-text">
            <h3>Judge Engine Processing...</h3>
            <p>Running the 20 benchmark test cases through the RAG pipeline and invoking Gemini to score faithfulness, factual hallucinations, and alignment with target documents. This typically takes 10-15 seconds.</p>
          </div>
        </div>
      )}

      {results ? (
        <div className="eval-results-dashboard">
          
          {/* Summary Metric Cards */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-header">
                <h4>Retrieval Hit Rate</h4>
                <span className="metric-badge primary">Accuracy</span>
              </div>
              <div className="metric-value-container">
                <svg className="radial-progress" viewBox="0 0 36 36">
                  <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="circle-fill hit" strokeDasharray={`${results.retrieval_hit_rate * 100}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="metric-number">{formatPercentage(results.retrieval_hit_rate)}</div>
              </div>
              <p className="metric-desc">Target document retrieved in Top-4 chunks.</p>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <h4>Retrieval MRR</h4>
                <span className="metric-badge secondary">Precision</span>
              </div>
              <div className="metric-value-container">
                <svg className="radial-progress" viewBox="0 0 36 36">
                  <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="circle-fill mrr" strokeDasharray={`${results.retrieval_mrr * 100}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="metric-number">{formatScore(results.retrieval_mrr)}</div>
              </div>
              <p className="metric-desc">Mean Reciprocal Rank. Rewards retrieving target at rank 1.</p>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <h4>Faithfulness</h4>
                <span className="metric-badge success">Judge</span>
              </div>
              <div className="metric-value-container">
                <svg className="radial-progress" viewBox="0 0 36 36">
                  <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="circle-fill faithfulness" strokeDasharray={`${results.avg_faithfulness * 100}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="metric-number">{formatScore(results.avg_faithfulness)}</div>
              </div>
              <p className="metric-desc">Groundedness. Checks that answers do not hallucinate details.</p>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <h4>Answer Relevance</h4>
                <span className="metric-badge warning">Judge</span>
              </div>
              <div className="metric-value-container">
                <svg className="radial-progress" viewBox="0 0 36 36">
                  <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="circle-fill relevance" strokeDasharray={`${results.avg_relevance * 100}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="metric-number">{formatScore(results.avg_relevance)}</div>
              </div>
              <p className="metric-desc">How directly the generated answer addresses the question.</p>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <h4>Context Recall</h4>
                <span className="metric-badge warning">Judge</span>
              </div>
              <div className="metric-value-container">
                <svg className="radial-progress" viewBox="0 0 36 36">
                  <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="circle-fill recall" strokeDasharray={`${results.avg_recall * 100}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="metric-number">{formatScore(results.avg_recall)}</div>
              </div>
              <p className="metric-desc">Factual coverage matching the benchmark gold standard.</p>
            </div>
          </div>

          {/* Visual SVG Chart */}
          <div className="chart-wrapper">
            <h3>Metrics Overview Profile</h3>
            <div className="chart-container-svg">
              <svg width="100%" height="240" viewBox="0 0 600 240" preserveAspectRatio="none">
                {/* Background Grid Lines */}
                <line x1="50" y1="40" x2="550" y2="40" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <line x1="50" y1="90" x2="550" y2="90" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <line x1="50" y1="140" x2="550" y2="140" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <line x1="50" y1="190" x2="550" y2="190" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                
                {/* Y Axis Labels */}
                <text x="35" y="44" fill="#546e7a" fontSize="10" textAnchor="end">1.0</text>
                <text x="35" y="94" fill="#546e7a" fontSize="10" textAnchor="end">0.6</text>
                <text x="35" y="144" fill="#546e7a" fontSize="10" textAnchor="end">0.3</text>
                <text x="35" y="194" fill="#546e7a" fontSize="10" textAnchor="end">0.0</text>
                
                {/* Bars - calculated relative to height (y=190 baseline, max y=40, height range=150) */}
                {/* 1. Hit Rate */}
                <defs>
                  <linearGradient id="bar-blue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00d2ff" />
                    <stop offset="100%" stopColor="rgba(0,210,255,0.1)" />
                  </linearGradient>
                  <linearGradient id="bar-purple" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#bd00ff" />
                    <stop offset="100%" stopColor="rgba(189,0,255,0.1)" />
                  </linearGradient>
                  <linearGradient id="bar-green" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00e676" />
                    <stop offset="100%" stopColor="rgba(0,230,118,0.1)" />
                  </linearGradient>
                </defs>

                {/* Hit Rate Bar */}
                <rect x="90" y={190 - results.retrieval_hit_rate * 150} width="40" height={results.retrieval_hit_rate * 150} fill="url(#bar-blue)" rx="4" />
                <text x="110" y={180 - results.retrieval_hit_rate * 150} fill="#fff" fontSize="10" fontWeight="600" textAnchor="middle">{results.retrieval_hit_rate.toFixed(2)}</text>
                <text x="110" y="210" fill="#90a4ae" fontSize="10" textAnchor="middle">Hit Rate</text>

                {/* MRR Bar */}
                <rect x="190" y={190 - results.retrieval_mrr * 150} width="40" height={results.retrieval_mrr * 150} fill="url(#bar-purple)" rx="4" />
                <text x="210" y={180 - results.retrieval_mrr * 150} fill="#fff" fontSize="10" fontWeight="600" textAnchor="middle">{results.retrieval_mrr.toFixed(2)}</text>
                <text x="210" y="210" fill="#90a4ae" fontSize="10" textAnchor="middle">MRR</text>

                {/* Faithfulness Bar */}
                <rect x="290" y={190 - results.avg_faithfulness * 150} width="40" height={results.avg_faithfulness * 150} fill="url(#bar-green)" rx="4" />
                <text x="310" y={180 - results.avg_faithfulness * 150} fill="#fff" fontSize="10" fontWeight="600" textAnchor="middle">{results.avg_faithfulness.toFixed(2)}</text>
                <text x="310" y="210" fill="#90a4ae" fontSize="10" textAnchor="middle">Faithfulness</text>

                {/* Relevance Bar */}
                <rect x="390" y={190 - results.avg_relevance * 150} width="40" height={results.avg_relevance * 150} fill="url(#bar-blue)" rx="4" />
                <text x="410" y={180 - results.avg_relevance * 150} fill="#fff" fontSize="10" fontWeight="600" textAnchor="middle">{results.avg_relevance.toFixed(2)}</text>
                <text x="410" y="210" fill="#90a4ae" fontSize="10" textAnchor="middle">Relevance</text>

                {/* Recall Bar */}
                <rect x="490" y={190 - results.avg_recall * 150} width="40" height={results.avg_recall * 150} fill="url(#bar-purple)" rx="4" />
                <text x="510" y={180 - results.avg_recall * 150} fill="#fff" fontSize="10" fontWeight="600" textAnchor="middle">{results.avg_recall.toFixed(2)}</text>
                <text x="510" y="210" fill="#90a4ae" fontSize="10" textAnchor="middle">Recall</text>
              </svg>
            </div>
            <div className="dashboard-meta-info">
              <span>Last verified run: {results.timestamp}</span>
              <span>Test Cases: {results.total_test_cases}</span>
              <span>Execution Time: {results.duration_seconds}s</span>
            </div>
          </div>

          {/* Detailed cases grid */}
          <div className="eval-cases-section">
            <h3>Benchmark Cases Detail</h3>
            <div className="cases-list">
              {results.results.map((c) => (
                <div key={c.id} className={`case-row-wrapper ${expandedCase === c.id ? 'expanded' : ''}`}>
                  <div className="case-row-header" onClick={() => toggleExpandCase(c.id)}>
                    <div className="case-header-left">
                      <span className="case-number">#{c.id}</span>
                      <span className="case-query-preview">{c.query}</span>
                    </div>
                    <div className="case-header-right">
                      <div className="mini-metrics">
                        <span className={`score-badge ${c.retrieval_hit ? 'pass' : 'fail'}`}>
                          Hit: {c.retrieval_hit ? 'Yes' : 'No'}
                        </span>
                        <span className="score-badge value">F: {c.metrics.faithfulness.toFixed(1)}</span>
                        <span className="score-badge value">R: {c.metrics.relevance.toFixed(1)}</span>
                      </div>
                      <span className="expand-indicator">{expandedCase === c.id ? '▲' : '▼'}</span>
                    </div>
                  </div>
                  
                  {expandedCase === c.id && (
                    <div className="case-row-details">
                      <div className="details-grid">
                        <div className="detail-item">
                          <h5>Target Document ID</h5>
                          <p><code>{c.target_doc_id}</code></p>
                        </div>
                        <div className="detail-item">
                          <h5>Retrieved Chunks</h5>
                          <div className="detail-retrieved-list">
                            {c.retrieved_sources.map((s, sIdx) => (
                              <div key={sIdx} className="mini-source-row">
                                <span className="mini-source-title">{s.title.replace('Planet ', '')}</span>
                                <span className="mini-source-score">{(s.score * 100).toFixed(0)}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="expanded-qna-block">
                        <div className="qna-sub-block">
                          <h5>Ground Truth Answer (Gold Standard)</h5>
                          <div className="content-box gold">{c.ground_truth}</div>
                        </div>
                        <div className="qna-sub-block">
                          <h5>RAG System Answer</h5>
                          <div className="content-box sys">{c.generated_answer}</div>
                        </div>
                      </div>

                      <div className="judge-reasoning-card">
                        <h5>LLM-as-a-judge Reasoning</h5>
                        <p>{c.reasoning}</p>
                        <div className="bar-metrics-detail">
                          <div className="bar-metric-row">
                            <label>Faithfulness</label>
                            <div className="metric-bar-outer">
                              <div className="metric-bar-inner f" style={{ width: `${c.metrics.faithfulness * 100}%` }}></div>
                            </div>
                            <span>{c.metrics.faithfulness.toFixed(2)}</span>
                          </div>
                          <div className="bar-metric-row">
                            <label>Relevance</label>
                            <div className="metric-bar-outer">
                              <div className="metric-bar-inner rel" style={{ width: `${c.metrics.relevance * 100}%` }}></div>
                            </div>
                            <span>{c.metrics.relevance.toFixed(2)}</span>
                          </div>
                          <div className="bar-metric-row">
                            <label>Recall</label>
                            <div className="metric-bar-outer">
                              <div className="metric-bar-inner rec" style={{ width: `${c.metrics.recall * 100}%` }}></div>
                            </div>
                            <span>{c.metrics.recall.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="no-eval-results animated-entry">
          <div className="placeholder-art">📊</div>
          <h3>No Evaluation Results Found</h3>
          <p>Run the automated validation suite to test retrieval hit rate and evaluate answer hallucinations using LLM-as-a-judge.</p>
          <button className="run-eval-btn" onClick={triggerEvaluation} disabled={isRunning}>
            {isRunning ? 'Running...' : 'Run First Evaluation'}
          </button>
        </div>
      )}
    </div>
  );
}
