import React, { useEffect, useState } from "react";
import { api } from "../../api/client";
import { useToast } from "../../components/Toast";
import { Card, PageHeader, Spinner, ErrorState, EmptyState, Badge } from "../../components/UI";
import { errorMessage, type Opportunity, type OpportunityList } from "../../api/types";

export default function AdminOpportunities() {
  const { push } = useToast();
  const [items, setItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try { const d = await api.get<OpportunityList>("/opportunities?status=open&page_size=100"); setItems(d.items); }
    catch (error: unknown) { setError(errorMessage(error)); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const remove = async (id: number) => {
    if (!confirm("Remove this opportunity from the platform?")) return;
    try { await api.del(`/opportunities/${id}`); push("Opportunity removed", "success"); load(); }
    catch (error: unknown) { push(errorMessage(error), "error"); }
  };

  return (
    <div>
      <PageHeader title="Opportunity moderation" subtitle="Monitor and remove inappropriate or inactive listings." />
      {error && <ErrorState message={error} onRetry={load} />}
      {loading ? <Spinner /> : items.length === 0 ? <EmptyState title="No opportunities found" /> : (
        <div className="space-y-3">
          {items.map((o) => (
            <Card key={o.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div><div className="flex items-center gap-2"><h2 className="font-semibold text-slate-900 dark:text-white">{o.title}</h2><Badge tone="emerald">{o.status}</Badge>{o.is_demo && <Badge tone="amber">demo</Badge>}</div><p className="text-xs text-slate-500">{o.organization_name} · {o.category} · {o.location || o.mode}</p></div>
              <button onClick={() => remove(o.id)} className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold">Remove listing</button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
