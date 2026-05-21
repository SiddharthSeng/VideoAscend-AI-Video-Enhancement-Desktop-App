import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Eye, EyeOff, Key, ExternalLink, Sparkles, AlertCircle, Trash2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

// ── Suggestion chips ──────────────────────────────────────────────────────────
function getSuggestions(file, config, isProcessing) {
  if (isProcessing) return ["Why is this slow?", "Optimize my settings"];
  if (file && config.algorithm) return ["Best algorithm for this?", "Estimate time", "Recommended CRF?"];
  if (file) return ["Best algorithm for this?", "How to upscale anime?"];
  return ["What can VideoAscend do?", "Help me get started", "Compare algorithms"];
}

// ── Build context-aware opening message ───────────────────────────────────────
function buildOpeningMessage(file, config, systemInfo, isProcessing) {
  const gpu = systemInfo?.gpu || 'your GPU';
  if (isProcessing) {
    return `Processing is underway. Your ${gpu} is handling the encode. Ask me anything about the process.`;
  }
  if (file && config.algorithm) {
    const algo = config.algorithm === 'anime4k' ? 'Anime4K v4' : config.algorithm === 'realesrgan' ? 'Real-ESRGAN' : config.algorithm;
    return `Ready to upscale **${file.name}** with **${algo}** at **${config.scaleFactor}**. Your **${gpu}** will be used for encoding. Any questions before you start?`;
  }
  if (file) {
    const suggested = (file.height && file.height < 720) ? 'Anime4K v4' : 'Real-ESRGAN';
    return `I see you've loaded **${file.name}** (${file.resolution || ''}). Based on the resolution, I'd recommend **${suggested}**. Want me to configure the settings for you?`;
  }
  return `Welcome to VideoAscend's AI Advisor! Drop a video file to get started, or ask me anything about video upscaling.`;
}

// ── Error banner ─────────────────────────────────────────────────────────────
const ERROR_MESSAGES = {
  'invalid-key':  '⚠ Invalid API key — check at console.anthropic.com',
  'rate-limit':   '⚠ Rate limit reached — wait a moment and try again',
  'api-down':     '⚠ Anthropic API is down — try again later',
  'network':      '⚠ No internet connection',
};

export default function AIAdvisor({ open, onClose, file, config, systemInfo, isProcessing, onApplyConfig, onNavigate, onStartProcessing }) {
  const { theme } = useTheme();
  const isDark    = theme === 'dark';

  const [uiState,    setUiState]    = useState('loading'); // loading | no-key | chat
  const [messages,   setMessages]   = useState([]);
  const [input,      setInput]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null); // null | 'invalid-key' | 'rate-limit' | 'api-down' | 'network'
  const [apiKey,     setApiKey]     = useState('');
  const [showKey,    setShowKey]    = useState(false);
  const [keyError,   setKeyError]   = useState('');
  const [keyPopover, setKeyPopover] = useState(false);
  const [toast,      setToast]      = useState(null);

  const messagesEndRef = useRef(null);
  const conversationRef = useRef([]);

  // Check for stored key on open
  useEffect(() => {
    if (!open) return;
    const checkKey = async () => {
      setUiState('loading');
      let key = null;
      if (isElectron && window.electronAPI.getApiKey) {
        key = await window.electronAPI.getApiKey().catch(() => null);
      } else {
        key = sessionStorage.getItem('anthropic_key');
      }
      if (key) {
        setUiState('chat');
        if (messages.length === 0) {
          const opening = buildOpeningMessage(file, config, systemInfo, isProcessing);
          const msg = { role: 'assistant', content: opening, id: Date.now() };
          setMessages([msg]);
          conversationRef.current = [{ role: 'assistant', content: opening }];
        }
      } else {
        setUiState('no-key');
      }
    };
    checkKey();
  }, [open]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Key management ────────────────────────────────────────────────────────
  const handleSaveKey = useCallback(async () => {
    const trimmed = apiKey.trim();
    if (!trimmed.startsWith('sk-ant-')) {
      setKeyError('API keys start with sk-ant-');
      return;
    }
    setKeyError('');
    if (isElectron && window.electronAPI.saveApiKey) {
      await window.electronAPI.saveApiKey(trimmed).catch(() => {});
    } else {
      sessionStorage.setItem('anthropic_key', trimmed);
    }
    setUiState('chat');
    const opening = buildOpeningMessage(file, config, systemInfo, isProcessing);
    const msg = { role: 'assistant', content: opening, id: Date.now() };
    setMessages([msg]);
    conversationRef.current = [{ role: 'assistant', content: opening }];
  }, [apiKey, file, config, systemInfo, isProcessing]);

  const handleClearKey = useCallback(async () => {
    if (isElectron && window.electronAPI.clearApiKey) {
      await window.electronAPI.clearApiKey().catch(() => {});
    } else {
      sessionStorage.removeItem('anthropic_key');
    }
    setUiState('no-key');
    setApiKey('');
    setKeyPopover(false);
    setMessages([]);
    conversationRef.current = [];
  }, []);

  // ── Send message ──────────────────────────────────────────────────────────
  const buildSystemPrompt = useCallback(() => {
    const ctx = {
      file: file ? { name: file.name, resolution: file.resolution, duration: file.duration, fps: file.fps } : null,
      config,
      gpu: systemInfo?.gpu || 'unknown',
      isProcessing,
    };
    return `You are VideoAscend's built-in AI advisor — an expert in video upscaling, frame interpolation, and encoding.

Algorithms:
- Anime4K v4: best for anime/animation, GLSL shaders, very fast on any GPU
- Real-ESRGAN: best for photorealistic content, slower, needs Vulkan GPU  
- Real-CUGAN: anime-focused neural network, better edge preservation
- RIFE: frame interpolation only, smooth slow-motion or high-FPS

Encoding:
- H.264: best compatibility
- H.265: 40% smaller files
- AV1: best compression, slowest encode
- CRF: 0-17 visually lossless, 18-23 excellent, 24-28 good, 28+ noticeable loss

Current context: ${JSON.stringify(ctx)}

Rules:
- Give concise actionable advice under 150 words unless asked for more
- Use **bold** for key terms
- When recommending settings, embed an <action> block so they auto-apply
- Format actions as: <action>{"type":"applyConfig","config":{...}}</action>`;
  }, [file, config, systemInfo, isProcessing]);

  const sendMessage = useCallback(async (userMessage) => {
    if (!userMessage.trim() || loading) return;
    setError(null);
    setLoading(true);

    const userMsg = { role: 'user', content: userMessage, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    conversationRef.current = [...conversationRef.current, { role: 'user', content: userMessage }];
    setInput('');

    let key = null;
    try {
      if (isElectron && window.electronAPI.getApiKey) {
        key = await window.electronAPI.getApiKey();
      } else {
        key = sessionStorage.getItem('anthropic_key');
      }
      if (!key) { setUiState('no-key'); setLoading(false); return; }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: buildSystemPrompt(),
          messages: conversationRef.current.filter(m => m.role !== 'assistant' || conversationRef.current.indexOf(m) !== 0),
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw { status: response.status, message: err.error?.message };
      }

      const data  = await response.json();
      let reply   = data.content[0]?.text || '';

      // Parse action blocks
      const actionMatch = reply.match(/<action>(.*?)<\/action>/s);
      if (actionMatch) {
        try {
          const action = JSON.parse(actionMatch[1]);
          if (action.type === 'applyConfig' && onApplyConfig) {
            onApplyConfig(action.config);
            showToast(`AI applied settings ✓`);
          }
          if (action.type === 'navigate' && onNavigate) onNavigate(action.view);
          if (action.type === 'startProcessing' && onStartProcessing) onStartProcessing();
        } catch {}
        reply = reply.replace(/<action>.*?<\/action>/gs, '').trim();
      }

      conversationRef.current = [...conversationRef.current, { role: 'assistant', content: reply }];
      setMessages(prev => [...prev, { role: 'assistant', content: reply, id: Date.now() }]);

    } catch (err) {
      if (err?.status === 401) setError('invalid-key');
      else if (err?.status === 429) setError('rate-limit');
      else if (err?.status >= 500) setError('api-down');
      else setError('network');
    } finally {
      setLoading(false);
    }
  }, [loading, buildSystemPrompt, onApplyConfig, onNavigate, onStartProcessing]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
    if (e.key === 'Escape') onClose();
  };

  // ── Render markdown-ish text ──────────────────────────────────────────────
  const renderContent = (text) => {
    return text.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: isDark ? '#e2e8f0' : '#1e293b' }}>{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  if (!open) return null;

  const bg       = isDark ? '#13151f' : '#ffffff';
  const border   = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';
  const textMuted = isDark ? '#64748b' : '#94a3b8';

  const suggestions = getSuggestions(file, config, isProcessing);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', zIndex: 150 }}
      />

      {/* Sheet — slides up covering 75% */}
      <div
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: '78%',
          background: bg,
          borderRadius: '16px 16px 0 0',
          border: `1px solid ${border}`,
          borderBottom: 'none',
          boxShadow: '0 -16px 60px rgba(0,0,0,0.5)',
          zIndex: 160,
          display: 'flex', flexDirection: 'column',
          animation: 'slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Sheet titlebar */}
        <div style={{
          height: 44, display: 'flex', alignItems: 'center',
          padding: '0 14px', gap: 8, flexShrink: 0,
          borderBottom: `1px solid ${border}`,
        }}>
          <Sparkles size={14} style={{ color: '#a78bfa' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: isDark ? '#e2e8f0' : '#1e293b', flex: 1 }}>AI Advisor</span>

          {/* Key status / popover */}
          {uiState === 'chat' && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setKeyPopover(p => !p)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                  <span style={{ fontSize: 9, color: '#10b981', fontWeight: 600 }}>Connected</span>
                </div>
              </button>
              {keyPopover && (
                <div style={{
                  position: 'absolute', top: 24, right: 0,
                  background: isDark ? '#1e2130' : '#fff',
                  border: `1px solid ${border}`, borderRadius: 10, padding: 12,
                  minWidth: 160, zIndex: 200, boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: isDark ? '#e2e8f0' : '#1e293b', margin: '0 0 8px' }}>API Key</p>
                  <p style={{ fontSize: 10, fontFamily: 'monospace', color: textMuted, margin: '0 0 8px' }}>sk-ant-••••••••</p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={handleClearKey} style={{ flex: 1, padding: '4px', borderRadius: 6, fontSize: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', cursor: 'pointer' }}>
                      Remove
                    </button>
                    <button onClick={() => { setKeyPopover(false); handleClearKey(); }} style={{ flex: 1, padding: '4px', borderRadius: 6, fontSize: 10, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', border: `1px solid ${border}`, color: textMuted, cursor: 'pointer' }}>
                      Change
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Clear chat */}
          {uiState === 'chat' && messages.length > 0 && (
            <button
              onClick={() => { setMessages([]); conversationRef.current = []; }}
              title="Clear conversation"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, padding: 4 }}
            >
              <Trash2 size={13} />
            </button>
          )}

          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        {/* ── State 1: No key ─────────────────────────────────────────────────── */}
        {uiState === 'no-key' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px 20px', gap: 12 }}>
            <div style={{ fontSize: 40 }}>🤖</div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: isDark ? '#e2e8f0' : '#1e293b', margin: '0 0 6px' }}>
                AI Advisor needs an API key
              </p>
              <p style={{ fontSize: 11, color: textMuted, margin: 0, lineHeight: 1.5 }}>
                Your key is stored locally and never sent anywhere except Anthropic's API directly.
              </p>
            </div>

            <div style={{ width: '100%', maxWidth: 300 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', borderRadius: 10, border: `1px solid ${keyError ? '#ef4444' : 'rgba(124,92,252,0.4)'}`, overflow: 'hidden' }}>
                <input
                  type={showKey ? 'text' : 'password'}
                  placeholder="sk-ant-..."
                  value={apiKey}
                  onChange={e => { setApiKey(e.target.value); setKeyError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleSaveKey()}
                  style={{ flex: 1, padding: '9px 12px', background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: isDark ? '#e2e8f0' : '#1e293b', fontFamily: 'monospace' }}
                />
                <button onClick={() => setShowKey(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 8px', color: textMuted }}>
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  onClick={handleSaveKey}
                  disabled={!apiKey.trim().startsWith('sk-ant-')}
                  style={{
                    padding: '9px 14px', background: apiKey.trim().startsWith('sk-ant-') ? 'linear-gradient(135deg,#7c5cfc,#6366f1)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
                    border: 'none', color: apiKey.trim().startsWith('sk-ant-') ? '#fff' : textMuted,
                    cursor: apiKey.trim().startsWith('sk-ant-') ? 'pointer' : 'not-allowed',
                    fontSize: 11, fontWeight: 700,
                  }}
                >
                  Save →
                </button>
              </div>
              {keyError && (
                <p style={{ fontSize: 10, color: '#ef4444', margin: '4px 0 0 4px' }}>{keyError}</p>
              )}
            </div>

            <button
              onClick={() => {
                if (isElectron) window.electronAPI.openExternal('https://console.anthropic.com');
                else window.open('https://console.anthropic.com', '_blank');
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a78bfa', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              Get your free key at console.anthropic.com <ExternalLink size={11} />
            </button>
          </div>
        )}

        {/* ── State 2: Chat ────────────────────────────────────────────────────── */}
        {uiState === 'chat' && (
          <>
            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div style={{
                    maxWidth: '85%',
                    padding: '8px 12px',
                    borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg,#7c5cfc,#6366f1)'
                      : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    border: msg.role === 'assistant' ? `1px solid ${border}` : 'none',
                    fontSize: 11, lineHeight: 1.55,
                    color: msg.role === 'user' ? '#fff' : isDark ? '#e2e8f0' : '#1e293b',
                  }}>
                    {msg.role === 'assistant' ? renderContent(msg.content) : msg.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div style={{ display: 'flex', gap: 4, padding: '8px 12px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderRadius: '14px 14px 14px 4px', alignSelf: 'flex-start', border: `1px solid ${border}` }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa', animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Error banner */}
            {error && (
              <div style={{ margin: '0 14px', padding: '8px 12px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 10, color: '#f87171' }}>{ERROR_MESSAGES[error]}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {error === 'invalid-key' && (
                    <button onClick={() => { setError(null); handleClearKey(); }} style={{ fontSize: 9, padding: '2px 8px', borderRadius: 5, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', cursor: 'pointer' }}>
                      Update Key
                    </button>
                  )}
                  <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }}>
                    <X size={11} />
                  </button>
                </div>
              </div>
            )}

            {/* Suggestion chips */}
            {messages.length <= 1 && !loading && (
              <div style={{ display: 'flex', gap: 5, padding: '6px 14px', overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0 }}>
                {suggestions.map(s => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    style={{
                      padding: '5px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600,
                      whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer',
                      background: isDark ? 'rgba(124,92,252,0.1)' : 'rgba(124,92,252,0.08)',
                      border: '1px solid rgba(124,92,252,0.25)', color: '#a78bfa',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div style={{
              padding: '10px 14px 14px',
              borderTop: `1px solid ${border}`,
              display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0,
            }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about upscaling, settings, algorithms…"
                rows={1}
                style={{
                  flex: 1, padding: '9px 12px', borderRadius: 10, fontSize: 11, lineHeight: 1.4,
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  border: `1px solid ${border}`, color: isDark ? '#e2e8f0' : '#1e293b',
                  outline: 'none', resize: 'none', fontFamily: 'inherit',
                  maxHeight: 100, overflowY: 'auto',
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                style={{
                  width: 34, height: 34, borderRadius: 10, border: 'none',
                  background: input.trim() && !loading ? 'linear-gradient(135deg,#7c5cfc,#6366f1)' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                  cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'all 0.15s',
                }}
              >
                <Send size={14} style={{ color: input.trim() && !loading ? '#fff' : textMuted }} />
              </button>
            </div>
          </>
        )}

        {/* Loading state */}
        {uiState === 'loading' && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(124,92,252,0.3)', borderTop: '2px solid #7c5cfc', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(16,185,129,0.9)', color: '#fff', padding: '6px 16px',
          borderRadius: 20, fontSize: 11, fontWeight: 600, zIndex: 200, whiteSpace: 'nowrap',
          boxShadow: '0 4px 20px rgba(16,185,129,0.4)',
        }}>
          {toast}
        </div>
      )}
    </>
  );
}
