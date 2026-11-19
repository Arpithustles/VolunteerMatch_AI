import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PlusCircle, Trash2, Pencil } from "lucide-react";
import { api } from "../../api/client";
import { useToast } from "../../components/Toast";
import { Card, PageHeader, Spinner, ErrorState, EmptyState, Badge } from "../../components/UI";

export default function NgoOpportunities() {
  const { push } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try { setItems(await api.get<any[]>("/opportunities/mine")); } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const remove = async (id: number) => {
    if (!confirm("Delete this opportunity? Applications and tasks linked to it will also be removed.")) return;
    try { await api.del(`/opportunities/${id}`); push("Opportunity deleted", "success"); load(); }
    catch (e: any) { push(e.message, "error"); }
  };

  return (
    <div>
      <PageHeader title="Manage opportunities" subtitle="Create, update and close your organization's volunteering opportunities." actions={<Link to="/ngo/opportunities/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold"><PlusCircle className="w-4 h-4" />New opportunity</Link>} />
      {error && <ErrorState message={error} onRetry={load} />}
      {loading ? <Spinner /> : items.length === 0 ? <Card><EmptyState title="No opportunities yet" description="Create your first opportunity to start receiving applications." action={<Link to="/ngo/opportunities/new" className="text-sm font-semibold text-teal-600">Create opportunity</Link>} /></Card> : (
        <div className="space-y-3">
          {items.map((o) => (
            <Card key={o.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-slate-900 dark:text-white">{o.title}</h2><Badge tone={o.status === "open" ? "emerald" : "slate"}>{o.status}</Badge><Badge tone="slate">{o.mode}</Badge>{o.is_demo && <Badge tone="amber">demo</Badge>}</div>
                <p className="text-xs text-slate-500 mt-1">{o.category} · {o.location || "TBD"} · {o.start_date || "TBD"} to {o.end_date || "TBD"}</p>
                <p className="text-xs text-slate-500 mt-1">{o.approved_count}/{o.volunteers_required} approved · deadline {o.application_deadline || "none"}</p>
              </div>
              <div className="flex items-center gap-2">
                <Link to={`/ngo/opportunities/${o.id}/edit`} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold"><Pencil className="w-3.5 h-3.5" />Edit</Link>
                <button onClick={() => remove(o.id)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold"><Trash2 className="w-3.5 h-3.5" />Delete</button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
