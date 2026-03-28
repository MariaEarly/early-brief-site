import { useState, useRef, useEffect } from "react";

// ─── Design tokens — Early Brief ───────────────────────────────────────────
const T = {
  bg:    "#F4F0E6",
  ink:   "#1A1814",
  muted: "#4A4540",
  ghost: "#8A8480",
  green: "#2C4A2E",
  terra: "#9E3D1B",
  rule:  "rgba(26, 24, 20, 0.14)",
  sans:  "'Hanken Grotesk', sans-serif",
  disp:  "'Cormorant', serif",
  mono:  "'IBM Plex Mono', monospace",
};

// ─── Suggested questions ────────────────────────────────────────────────────
const SUGGESTED = [
  "Que prévoit l'article 12 sur les structures complexes ?",
  "Comment fonctionne la vérification à distance (Art. 7) ?",
  "Quelles sont les exigences sur les bénéficiaires effectifs ?",
  "Qu'est-ce qui change pour les IBAN virtuels (Art. 9) ?",
  "Quelles sont les obligations de screening sanctions (Art. 29-30) ?",
  "Que dit l'Annexe I sur les moyens d'identification électronique ?",
  "Quelles mesures de vigilance simplifiée pour les comptes pooled ?",
  "Que dit l'Art. 19 sur l'identification des PPE ?",
];

const COMPARE_Q = [
  "Comparez Art. 7 (vérification à distance) entre EBA et AMLA",
  "Comparez les mesures EDD (Art. 25-28) entre EBA et AMLA",
  "Comparez l'approche sur les SMOs (Art. 13) entre EBA et AMLA",
];

const CHANGES_Q = [
  "Donne-moi une synthèse complète des changements AMLA vs EBA",
  "Quels sont les nouveaux articles ajoutés par AMLA ?",
  "Qu'est-ce qu'AMLA a changé sur le recital 12 (représentation) ?",
];

// ─── Inline markdown renderer ───────────────────────────────────────────────
function renderInline(text, key) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <span key={key}>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**"))
          return <strong key={i} style={{ fontWeight: 600, color: T.ink }}>{p.slice(2, -2)}</strong>;
        if (p.startsWith("`") && p.endsWith("`"))
          return (
            <code key={i} style={{
              fontFamily: T.mono, fontSize: "11px",
              background: "rgba(26,24,20,0.07)", padding: "1px 5px",
            }}>{p.slice(1, -1)}</code>
          );
        return p;
      })}
    </span>
  );
}

function renderContent(text) {
  const lines = text.split("\n");
  const els = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { els.push(<div key={i} style={{ height: "8px" }} />); i++; continue; }
    if (line.startsWith("## ")) {
      els.push(
        <p key={i} style={{
          fontFamily: T.disp, fontSize: "18px", fontWeight: 600,
          color: T.ink, marginTop: "20px", marginBottom: "6px", lineHeight: 1.2,
        }}>{renderInline(line.slice(3))}</p>
      ); i++; continue;
    }
    if (line.startsWith("### ")) {
      els.push(
        <p key={i} style={{
          fontFamily: T.mono, fontSize: "10px", fontWeight: 600,
          color: T.terra, textTransform: "uppercase", letterSpacing: "1.5px",
          marginTop: "16px", marginBottom: "4px",
        }}>{line.slice(4)}</p>
      ); i++; continue;
    }
    if (line.match(/^\d+\.\s/)) {
      els.push(
        <p key={i} style={{ margin: "4px 0", paddingLeft: "16px", position: "relative", fontSize: "14px", color: T.muted, lineHeight: 1.65 }}>
          <span style={{ position: "absolute", left: 0, color: T.terra, fontFamily: T.mono, fontSize: "11px" }}>
            {line.match(/^(\d+\.)/)[1]}
          </span>
          {renderInline(line.replace(/^\d+\.\s/, ""))}
        </p>
      ); i++; continue;
    }
    if (line.startsWith("- ") || line.startsWith("• ")) {
      els.push(
        <p key={i} style={{ margin: "4px 0", paddingLeft: "14px", position: "relative", fontSize: "14px", color: T.muted, lineHeight: 1.65 }}>
          <span style={{ position: "absolute", left: "1px", color: T.terra }}>–</span>
          {renderInline(line.slice(2))}
        </p>
      ); i++; continue;
    }
    els.push(
      <p key={i} style={{ margin: "4px 0", fontSize: "14px", color: T.muted, lineHeight: 1.7, fontWeight: 300 }}>
        {renderInline(line)}
      </p>
    ); i++;
  }
  return els;
}

// ─── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const [mode, setMode] = useState("chat");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput("");
    const newMsgs = [...messages, { role: "user", content: userText }];
    setMessages(newMsgs);
    setLoading(true);
    try {
      const res = await fetch("/api/chat-rts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          messages: newMsgs.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la réponse.");
      setMessages([...newMsgs, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setMessages([...newMsgs, { role: "assistant", content: err.message || "Erreur réseau. Veuillez réessayer." }]);
    }
    setLoading(false);
  };

  const copyMsg = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  const resetChat = () => { setMessages([]); setInput(""); };
  const handleKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  const suggestions = mode === "compare" ? COMPARE_Q : mode === "changes" ? CHANGES_Q : SUGGESTED;

  const modeDesc = {
    chat:    "Questions libres · Art. 1–33, Annexe I, recitals",
    compare: "Comparaison structurée article par article · EBA oct. 2025 vs AMLA fév. 2026",
    changes: "Synthèse des modifications apportées par l'AMLA au draft EBA",
  };

  // ── Mode button ──
  const ModeBtn = ({ id, label }) => {
    const active = mode === id;
    return (
      <button
        onClick={() => { setMode(id); resetChat(); }}
        style={{
          fontFamily: T.mono, fontSize: "10px", fontWeight: active ? 600 : 400,
          textTransform: "uppercase", letterSpacing: "1.5px",
          padding: "7px 14px", background: active ? T.ink : "transparent",
          color: active ? T.bg : T.ghost,
          border: `1px solid ${active ? T.ink : T.rule}`,
          cursor: "pointer", transition: "all 0.15s",
        }}
      >{label}</button>
    );
  };

  return (
    <div style={{ fontFamily: T.sans, background: T.bg, minHeight: "100vh", paddingBottom: "48px" }}>
      {/* Polices auto-hébergées */}
      <link rel="stylesheet" href="/fonts/fonts.css" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #F4F0E6; }
        textarea:focus { outline: none; }
        textarea { background: transparent; resize: none; }
        @keyframes blink { 0%,100%{opacity:.2} 50%{opacity:1} }
      `}</style>

      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "0 60px" }}>

        {/* ── Header ── */}
        <div style={{
          borderBottom: `1px solid ${T.rule}`,
          padding: "48px 0 32px",
          marginBottom: "40px",
        }}>
          {/* Eyebrow */}
          <div style={{
            fontFamily: T.mono, fontSize: "9px", fontWeight: 600,
            textTransform: "uppercase", letterSpacing: "3px",
            color: T.terra, marginBottom: "12px",
          }}>
            Early Brief — Outil réglementaire
          </div>

          {/* Title */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h1 style={{
                fontFamily: T.disp, fontSize: "42px", fontWeight: 300,
                lineHeight: 1.1, color: T.ink, marginBottom: "8px",
              }}>
                RTS CDD — <em style={{ color: T.green, fontStyle: "normal" }}>Assistant AMLA</em>
              </h1>
              <p style={{ fontFamily: T.sans, fontSize: "13px", fontWeight: 300, color: T.muted, lineHeight: 1.6 }}>
                Art. 28(1) AMLR · Draft publié le 9 fév. 2026 · Consultation ouverte jusqu'au 8 mai 2026
              </p>
            </div>
            <a
              href="https://www.amla.europa.eu/policy/public-consultations/consultation-draft-rts-customer-due-diligence_en"
              target="_blank" rel="noreferrer"
              style={{
                fontFamily: T.mono, fontSize: "9px", letterSpacing: "1.5px",
                textTransform: "uppercase", color: T.muted,
                border: `1px solid ${T.rule}`, padding: "7px 12px",
                textDecoration: "none", whiteSpace: "nowrap",
                transition: "border-color 0.15s, color 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.terra; e.currentTarget.style.color = T.terra; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.rule; e.currentTarget.style.color = T.muted; }}
            >
              Source AMLA ↗
            </a>
          </div>

          {/* Mode selector */}
          <div style={{ display: "flex", gap: "6px", marginTop: "28px", flexWrap: "wrap" }}>
            <ModeBtn id="chat"    label="Chat libre" />
            <ModeBtn id="compare" label="EBA vs AMLA" />
            <ModeBtn id="changes" label="Changements clés" />
          </div>
          <p style={{
            fontFamily: T.mono, fontSize: "10px", color: T.ghost,
            letterSpacing: "0.3px", marginTop: "10px",
          }}>{modeDesc[mode]}</p>
        </div>

        {/* ── Suggestions ── */}
        {messages.length === 0 && (
          <div style={{ marginBottom: "40px" }}>
            <div style={{
              fontFamily: T.mono, fontSize: "9px", textTransform: "uppercase",
              letterSpacing: "3px", color: T.ink, fontWeight: 500,
              marginBottom: "16px",
            }}>
              {mode === "chat" ? "Questions suggérées" : mode === "compare" ? "Exemples de comparaison" : "Exemples de synthèse"}
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: mode === "chat" ? "1fr 1fr" : "1fr",
              gap: "8px",
            }}>
              {suggestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  style={{
                    textAlign: "left", padding: "12px 16px",
                    fontFamily: T.sans, fontSize: "13px", fontWeight: 300,
                    color: T.muted, lineHeight: 1.5,
                    background: "transparent",
                    border: `1px solid ${T.rule}`,
                    cursor: "pointer", transition: "border-color 0.15s, color 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.terra; e.currentTarget.style.color = T.ink; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.rule; e.currentTarget.style.color = T.muted; }}
                >{q}</button>
              ))}
            </div>
          </div>
        )}

        {/* ── Messages ── */}
        <div>
          {messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            return (
              <div key={idx} style={{
                marginBottom: "28px",
                display: "flex", flexDirection: "column",
                alignItems: isUser ? "flex-end" : "flex-start",
              }}>
                {/* Label */}
                <div style={{
                  fontFamily: T.mono, fontSize: "9px", fontWeight: 600,
                  textTransform: "uppercase", letterSpacing: "2px",
                  color: isUser ? T.terra : T.ghost,
                  marginBottom: "6px",
                }}>
                  {isUser ? "Vous" : "Assistant réglementaire"}
                </div>

                {/* Bubble */}
                <div style={{
                  maxWidth: "88%",
                  padding: "16px 20px",
                  background: isUser ? "rgba(158,61,27,0.05)" : "transparent",
                  border: `1px solid ${isUser ? "rgba(158,61,27,0.2)" : T.rule}`,
                  lineHeight: 1.65,
                }}>
                  {isUser
                    ? <p style={{ fontSize: "14px", color: T.ink, fontWeight: 400 }}>{msg.content}</p>
                    : renderContent(msg.content)
                  }
                </div>

                {/* Copy button */}
                {!isUser && (
                  <button
                    onClick={() => copyMsg(msg.content, idx)}
                    style={{
                      marginTop: "6px", fontFamily: T.mono, fontSize: "9px",
                      letterSpacing: "1px", textTransform: "uppercase",
                      color: copied === idx ? T.green : T.ghost,
                      background: "transparent", border: "none",
                      cursor: "pointer", padding: "2px 0",
                      transition: "color 0.15s",
                    }}
                  >{copied === idx ? "✓ Copié" : "Copier"}</button>
                )}
              </div>
            );
          })}

          {/* Loading */}
          {loading && (
            <div style={{ marginBottom: "28px" }}>
              <div style={{
                fontFamily: T.mono, fontSize: "9px", fontWeight: 600,
                textTransform: "uppercase", letterSpacing: "2px",
                color: T.ghost, marginBottom: "6px",
              }}>Assistant réglementaire</div>
              <div style={{ display: "flex", gap: "5px", padding: "16px 0" }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: "5px", height: "5px", background: T.ghost,
                    borderRadius: "50%",
                    animation: `blink 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Input ── */}
        <div style={{
          borderTop: `1px solid ${T.rule}`, paddingTop: "24px", marginTop: "8px",
        }}>
          {messages.length > 0 && (
            <button
              onClick={resetChat}
              style={{
                fontFamily: T.mono, fontSize: "9px", letterSpacing: "1.5px",
                textTransform: "uppercase", color: T.ghost,
                background: "transparent", border: "none",
                cursor: "pointer", marginBottom: "14px", padding: 0,
                transition: "color 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.color = T.terra}
              onMouseLeave={e => e.currentTarget.style.color = T.ghost}
            >← Nouvelle conversation</button>
          )}

          <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={2}
              placeholder={
                mode === "compare"  ? "Ex : Comparez Art. 7 entre EBA et AMLA…" :
                mode === "changes"  ? "Ex : Quels sont les nouveaux articles ajoutés ?" :
                "Posez une question sur le draft RTS CDD…"
              }
              style={{
                flex: 1, padding: "12px 14px",
                fontFamily: T.sans, fontSize: "14px", fontWeight: 300,
                color: T.ink, lineHeight: 1.5,
                border: `1px solid ${T.rule}`,
                background: "transparent",
                outline: "none",
              }}
              onFocus={e => e.currentTarget.style.borderColor = T.green}
              onBlur={e => e.currentTarget.style.borderColor = T.rule}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              style={{
                fontFamily: T.mono, fontSize: "10px", fontWeight: 600,
                textTransform: "uppercase", letterSpacing: "2px",
                padding: "0 24px", height: "70px",
                background: input.trim() && !loading ? T.green : T.rule,
                color: input.trim() && !loading ? "#FAF9F6" : T.ghost,
                border: "none", cursor: input.trim() && !loading ? "pointer" : "default",
                transition: "background 0.15s",
                whiteSpace: "nowrap",
              }}
            >Envoyer</button>
          </div>

          {/* Footer note */}
          <div style={{
            borderTop: `1px solid ${T.rule}`, marginTop: "28px", paddingTop: "16px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            flexWrap: "wrap", gap: "8px",
          }}>
            <p style={{ fontFamily: T.mono, fontSize: "9px", color: T.ghost, letterSpacing: "0.3px" }}>
              Base documentaire · Art. 1–33 + Annexe I + track changes AMLA/EBA
            </p>
            <a
              href="https://early-brief.com"
              target="_blank" rel="noreferrer"
              style={{
                fontFamily: T.mono, fontSize: "9px", color: T.ghost,
                textDecoration: "none", letterSpacing: "1px",
              }}
            >Early Brief →</a>
          </div>
        </div>
      </div>
    </div>
  );
}
