import { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Mic,
  MicOff,
  Send,
  Bot,
  Volume2,
  Trophy,
  ArrowLeft,
} from "lucide-react";
import { chatMessages, mockProjects } from "../data/mock";

type Page = "home" | "repo-input" | "file-selector" | "kanban" | "ticket-detail" | "interview" | "settings";

interface InterviewProps {
  dark: boolean;
  ticketId: string | null;
  onNavigate: (page: Page, id?: string) => void;
}

type Mode = "chat" | "voice";

function WaveBar({ delay, dark }: { delay: number; dark: boolean }) {
  return (
    <div
      className={`w-1 rounded-full ${dark ? "bg-indigo-400" : "bg-indigo-500"} wave-bar`}
      style={{
        height: 32,
        animationDelay: `${delay}ms`,
        animationDuration: "900ms",
      }}
    />
  );
}

export default function Interview({ dark, ticketId, onNavigate }: InterviewProps) {
  const [mode, setMode] = useState<Mode>("chat");
  const [messages, setMessages] = useState(chatMessages);
  const [input, setInput] = useState("");
  const [micActive, setMicActive] = useState(false);
  const [transcript, setTranscript] = useState("Esperando para hablar...");
  const bottomRef = useRef<HTMLDivElement>(null);

  const allTickets = mockProjects.flatMap((p) => p.tickets);
  const ticket = allTickets.find((t) => t.id === ticketId) ?? allTickets[0];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (micActive) {
      const phrases = [
        "Si un atacante roba el token...",
        "...con rotación solo puede usarlo una vez...",
        "...el sistema detecta el reuso y revoca toda la familia...",
      ];
      let i = 0;
      const interval = setInterval(() => {
        setTranscript(phrases[i % phrases.length]);
        i++;
      }, 2000);
      return () => clearInterval(interval);
    } else {
      setTranscript("Presiona el micrófono para hablar.");
    }
  }, [micActive]);

  const bg = dark ? "bg-slate-900" : "bg-slate-50";
  const cardBg = dark ? "bg-slate-800 border-slate-700/50" : "bg-white border-slate-200";
  const textPrimary = dark ? "text-slate-100" : "text-slate-900";
  const textMuted = dark ? "text-slate-400" : "text-slate-500";
  const divider = dark ? "border-slate-700/50" : "border-slate-200";
  const inputBg = dark ? "bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500" : "bg-white border-slate-300 text-slate-900 placeholder-slate-400";

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg = {
      id: `m${Date.now()}`,
      role: "user" as const,
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    setTimeout(() => {
      const botMsg = {
        id: `m${Date.now() + 1}`,
        role: "bot" as const,
        content: "Interesante respuesta. Ahora dime: ¿cómo manejarías el caso donde el cliente pierde la respuesta con el nuevo token antes de guardarlo? ¿Cómo evitarías que el usuario quede sin acceso?",
        timestamp: new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 1200);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const questionCount = messages.filter((m) => m.role === "bot").length;
  const totalQuestions = 4;

  return (
    <div className={`min-h-full ${bg} p-6 lg:p-8 fade-in flex flex-col`}>
      <div className="max-w-2xl mx-auto w-full flex flex-col flex-1">
        {/* Back */}
        <button
          onClick={() => onNavigate("ticket-detail", ticket?.id)}
          className={`flex items-center gap-1.5 text-sm ${textMuted} hover:${dark ? "text-slate-200" : "text-slate-700"} mb-5 transition-colors`}
        >
          <ArrowLeft size={16} />
          Volver al ticket
        </button>

        {/* Interview header */}
        <div className={`${cardBg} border rounded-2xl p-4 mb-4 shadow-sm`}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className={`text-xs font-medium ${textMuted} mb-0.5`}>Evaluando ticket</p>
              <p className={`text-sm font-semibold ${textPrimary} truncate`}>{ticket?.title}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${dark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                <Trophy size={12} />
                Pregunta {Math.min(questionCount, totalQuestions)} / {totalQuestions}
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className={`mt-3 h-1.5 rounded-full overflow-hidden ${dark ? "bg-slate-700" : "bg-slate-200"}`}>
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
              style={{ width: `${Math.min((questionCount / totalQuestions) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Mode toggle */}
        <div className={`flex items-center gap-1 p-1 rounded-xl mb-4 ${dark ? "bg-slate-800 border-slate-700/50" : "bg-slate-100"} border self-start`}>
          {(["chat", "voice"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${mode === m
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md"
                  : `${textMuted} hover:${dark ? "text-slate-200" : "text-slate-700"}`
                }
              `}
            >
              {m === "chat" ? <MessageSquare size={14} /> : <Mic size={14} />}
              {m === "chat" ? "Chat" : "Voz"}
            </button>
          ))}
        </div>

        {/* Chat mode */}
        {mode === "chat" && (
          <div className={`${cardBg} border rounded-2xl shadow-sm flex flex-col flex-1`} style={{ minHeight: 400 }}>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => {
                const isBot = msg.role === "bot";
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isBot ? "" : "flex-row-reverse"} slide-in`}
                  >
                    {isBot && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
                        <Bot size={15} className="text-white" />
                      </div>
                    )}
                    <div className={`max-w-[78%] space-y-1`}>
                      <div
                        className={`px-4 py-3 rounded-2xl text-sm leading-relaxed
                          ${isBot
                            ? dark
                              ? "bg-slate-700/80 text-slate-100 rounded-tl-sm"
                              : "bg-slate-100 text-slate-800 rounded-tl-sm"
                            : "bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-tr-sm shadow-md shadow-indigo-500/20"
                          }
                        `}
                        dangerouslySetInnerHTML={{
                          __html: msg.content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                        }}
                      />
                      <p className={`text-xs ${textMuted} ${isBot ? "pl-1" : "pr-1 text-right"}`}>
                        {msg.timestamp}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className={`border-t ${divider} p-3 flex gap-2`}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Escribe tu respuesta..."
                className={`flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none transition-all duration-200
                  ${inputBg}
                  focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20
                `}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                className={`p-2.5 rounded-xl transition-all duration-200 ${input.trim() ? "btn-primary" : dark ? "bg-slate-700 text-slate-500" : "bg-slate-200 text-slate-400"}`}
              >
                <Send size={16} className={input.trim() ? "text-white" : ""} />
              </button>
            </div>
          </div>
        )}

        {/* Voice mode */}
        {mode === "voice" && (
          <div className={`${cardBg} border rounded-2xl shadow-sm flex flex-col items-center justify-center p-8 flex-1`} style={{ minHeight: 400 }}>
            {/* Bot avatar (animated when mic is active) */}
            <div className="relative mb-8">
              <div className={`w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30 transition-transform duration-200 ${micActive ? "scale-105" : ""}`}>
                <Bot size={40} className="text-white" />
              </div>
              {micActive && (
                <>
                  <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" style={{ animationDuration: "1.5s" }} />
                  <div className="absolute inset-[-8px] rounded-full bg-indigo-500/10 animate-ping" style={{ animationDuration: "2s" }} />
                </>
              )}
              {/* Speaking indicator */}
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center ${micActive ? "bg-red-500" : "bg-slate-600"} border-2 border-slate-800`}>
                <Volume2 size={11} className="text-white" />
              </div>
            </div>

            {/* Waveform */}
            <div className="flex items-center gap-1 mb-6 h-12">
              {Array.from({ length: 20 }, (_, i) => (
                <WaveBar
                  key={i}
                  delay={i * 60}
                  dark={dark}
                />
              ))}
            </div>

            {/* Transcript */}
            <div className={`w-full max-w-md text-center px-6 py-4 rounded-xl mb-8 ${dark ? "bg-slate-700/50" : "bg-slate-100"}`}>
              <p className={`text-xs font-medium ${textMuted} mb-1`}>Transcripción en tiempo real</p>
              <p className={`text-sm ${textPrimary} italic leading-relaxed`}>{transcript}</p>
            </div>

            {/* Mic button */}
            <button
              onClick={() => setMicActive((m) => !m)}
              className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300
                ${micActive
                  ? "bg-red-500 shadow-2xl shadow-red-500/40 scale-105"
                  : "bg-gradient-to-br from-indigo-600 to-violet-600 shadow-2xl shadow-indigo-500/30"
                }
              `}
            >
              {micActive ? (
                <MicOff size={28} className="text-white" />
              ) : (
                <Mic size={28} className="text-white" />
              )}
              {micActive && (
                <div className="absolute inset-0 rounded-full bg-red-400/30 pulse-ring" />
              )}
            </button>

            <p className={`mt-4 text-xs ${textMuted}`}>
              {micActive ? "Toca para detener" : "Toca el micrófono para hablar"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
