import { useEffect, useState } from "react";
import { Bell, CheckCheck, ExternalLink, Trash2 } from "lucide-react";
import { api } from "../api/client";
import { Card, PageHeader, Spinner } from "../components/UI";
import { useNavigate } from "react-router-dom";

type NotificationItem = { id: number; title: string; message: string; target_url?: string | null; is_read: boolean; created_at: string };

export default function NotificationCenter() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const load = async () => {
    try {
      const result = await api.get<{ items: NotificationItem[] }>("/notifications");
      setItems(result.items);
      setError("");
    } catch (e: any) {
      setError(e.message || "Could not load notifications");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);
  const markRead = async (item: NotificationItem) => {
    try {
      await api.patch(`/notifications/${item.id}/read`);
      await load();
    } catch (e: any) {
      setError(e.message || "Could not update notification");
    }
  };
  const remove = async (id: number) => {
    try {
      await api.del(`/notifications/${id}`);
      await load();
    } catch (e: any) {
      setError(e.message || "Could not delete notification");
    }
  };
  if (loading) return <Spinner />;
  return <div>
    <PageHeader title="Notifications" subtitle="Updates about applications, matches, and your volunteer activity." />
    {error && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    <Card>
      <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800">
        <p className="text-sm text-slate-500">{items.filter((item) => !item.is_read).length} unread</p>
        <button type="button" onClick={async () => { try { await api.post("/notifications/read-all"); await load(); } catch (e: any) { setError(e.message); } }} className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"><CheckCheck className="h-4 w-4" />Mark all as read</button>
      </div>
      {items.length === 0 ? <div className="p-10 text-center text-sm text-slate-500"><Bell className="mx-auto mb-2 h-6 w-6" />No notifications yet.</div> : items.map((item) => <article key={item.id} className={`flex items-start gap-4 border-b border-slate-100 p-4 last:border-0 dark:border-slate-800 ${item.is_read ? "" : "bg-emerald-50/50 dark:bg-emerald-950/20"}`}>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-900 dark:text-white">{item.title}</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.message}</p>
          <p className="mt-2 text-xs text-slate-400">{new Date(item.created_at).toLocaleString()}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          {item.target_url && <button aria-label="View related item" onClick={async () => { if (!item.is_read) await markRead(item); navigate(item.target_url!); }} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><ExternalLink className="h-4 w-4" /></button>}
          {!item.is_read && <button aria-label="Mark as read" onClick={() => markRead(item)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><CheckCheck className="h-4 w-4" /></button>}
          <button aria-label="Delete notification" onClick={() => remove(item.id)} className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
        </div>
      </article>)}
    </Card>
  </div>;
}
