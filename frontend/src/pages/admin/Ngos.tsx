import React, { useEffect, useState } from "react";
import { api } from "../../api/client";
import { Card, PageHeader, Spinner, ErrorState, EmptyState } from "../../components/UI";

export default function AdminNgos() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<any[]>("/users/ngos").then(setOrgs).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Organizer management" subtitle="Registered event teams, NGOs and community organizations on the platform." />
      {error && <ErrorState message={error} />}
      {loading ? <Spinner /> : orgs.length === 0 ? <EmptyState title="No organizations found" /> : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full text-left text-sm">
            <thead><tr className="bg-slate-50 dark:bg-slate-800/50 text-[11px] uppercase tracking-wider text-slate-500"><th className="py-3 px-6">Organization</th><th className="py-3 px-6">Contact</th><th className="py-3 px-6">Location</th><th className="py-3 px-6">Joined</th></tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {orgs.map((o) => (
                <tr key={o.id}><td className="py-3 px-6 font-medium">{o.name}</td><td className="py-3 px-6 text-slate-500">{o.email}</td><td className="py-3 px-6">{o.location || "—"}</td><td className="py-3 px-6 text-slate-500">{o.created_at ? new Date(o.created_at).toLocaleDateString() : "—"}</td></tr>
              ))}
            </tbody>
          </table></div>
        </Card>
      )}
    </div>
  );
}
