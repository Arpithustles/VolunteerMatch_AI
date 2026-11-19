import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { useToast } from "../../components/Toast";
import { Card, PageHeader, Spinner, ErrorState, EmptyState } from "../../components/UI";
import { OpportunityCard, OpportunityCardData } from "../../components/OpportunityCard";

export default function SavedPage() {
  const { push } = useToast();
  const [items, setItems] = useState<OpportunityCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try { setItems(await api.get<OpportunityCardData[]>("/saved")); } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const remove = async (id: number) => {
    try { await api.del(`/saved/${id}`); push("Removed from saved", "info"); load(); } catch (e: any) { push(e.message, "error"); }
  };

  return (
    <div>
      <PageHeader title="Saved opportunities" subtitle="Keep promising events and causes within reach." />
      {error && <ErrorState message={error} onRetry={load} />}
      {loading ? <Spinner /> : items.length === 0 ? (
        <Card>
          <EmptyState
            title="No saved opportunities"
            description="Use the star button while exploring to save events here."
            action={<Link to="/volunteer/explore" className="text-sm font-semibold text-emerald-600">Explore opportunities</Link>}
          />
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((opportunity) => (
            <OpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
              saved
              onToggleSave={() => remove(opportunity.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
