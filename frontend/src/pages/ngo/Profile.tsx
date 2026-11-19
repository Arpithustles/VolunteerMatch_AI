import React, { useEffect, useState } from "react";
import { api } from "../../api/client";
import { useToast } from "../../components/Toast";
import { Card, PageHeader, Spinner, ErrorState } from "../../components/UI";
import { Save } from "lucide-react";

export default function NgoProfile() {
  const { push } = useToast();
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try { setForm(await api.get<any>("/profiles/organization/me")); } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const set = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }));
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { const p = await api.put<any>("/profiles/organization/me", form); setForm(p); push("Organization profile saved", "success"); }
    catch (e: any) { push(e.message, "error"); } finally { setSaving(false); }
  };
  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  const input = "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-950 text-sm";
  return (
    <div className="max-w-3xl">
      <PageHeader title="Organization profile" subtitle="This information is shown to volunteers alongside your opportunities." />
      <form onSubmit={save}>
        <Card className="p-6 space-y-4">
          {[
            ["name", "Organization name"],
            ["location", "Location"],
            ["phone", "Phone"],
            ["website", "Website"],
            ["logo_url", "Logo URL"],
          ].map(([k, label]) => <div key={k}><label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">{label}</label><input className={input} value={form[k] || ""} onChange={(e) => set(k, e.target.value)} /></div>)}
          <div><label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Mission</label><textarea rows={3} className={input} value={form.mission || ""} onChange={(e) => set("mission", e.target.value)} /></div>
          <div><label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Description</label><textarea rows={3} className={input} value={form.description || ""} onChange={(e) => set("description", e.target.value)} /></div>
          <div className="flex justify-end"><button disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold disabled:opacity-60"><Save className="w-4 h-4" />{saving ? "Saving..." : "Save changes"}</button></div>
        </Card>
      </form>
    </div>
  );
}
