import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Send, Sparkles, Loader2, MessageSquare } from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Card, Badge } from "../../components/UI";

type Msg = { role: "user" | "assistant"; content: string; opportunities?: any[] };

export default function AssistantPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! I can help you find opportunities, explain your AI matches, check application status, or show upcoming activities. What would you like to do?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | undefined>();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || loading) return;
    setMessages((m) => [...m, { role: "user", content: message }]);
    setInput(""); setLoading(true);
    try {
      const res = await api.post<any>("/assistant/chat", { message, conversation_id: conversationId });
      setConversationId(res.conversation_id);
      setMessages((m) => [...m, { role: "assistant", content: res.reply, opportunities: res.opportunities }]);
    } catch (e: any) {
      setMessages((m) => [...m, { role: "assistant", content: `Sorry, I could not process that: ${e.message}` }]);
    } finally { setLoading(false); }
  };

  const suggestions = user?.role === "volunteer"
    ? ["Find weekend volunteering opportunities", "Which opportunities match my skills?", "Why is my top recommendation a good fit?", "What skills should I improve?", "Show my upcoming activities", "Find remote volunteering opportunities"]
    : ["What can I manage from my dashboard?", "How do I review applicants?", "Show my opportunities summary"];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center"><MessageSquare className="w-5 h-5" /></div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">AI Volunteer Assistant</h1>
          <p className="text-sm text-slate-500">Grounded in your real profile, opportunities and applications.</p>
        </div>
        <Badge tone="emerald"><Sparkles className="w-3 h-3 mr-1" />Context-aware</Badge>
      </div>

      <Card className="flex flex-col h-[65vh]">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"}`}>
                {m.content}
                {m.opportunities && m.opportunities.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {m.opportunities.slice(0, 4).map((o: any) => (
                      <Link key={o.id} to={`/opportunities/${o.id}`} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/70 dark:bg-slate-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50">{o.title}</Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && <div className="flex justify-start"><div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-500 inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Thinking with your platform data...</div></div>}
          <div ref={bottomRef} />
        </div>
        {messages.length <= 2 && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button key={s} onClick={() => send(s)} className="text-xs px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300 hover:text-emerald-700">{s}</button>
            ))}
          </div>
        )}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }} placeholder="Ask about opportunities, matches, applications..." className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-950 text-sm" />
          <button onClick={() => send()} disabled={loading || !input.trim()} className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold inline-flex items-center gap-2"><Send className="w-4 h-4" />Send</button>
        </div>
      </Card>
    </div>
  );
}
