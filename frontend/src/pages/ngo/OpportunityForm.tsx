import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Image as ImageIcon } from "lucide-react";
import { api } from "../../api/client";
import { useToast } from "../../components/Toast";
import { Card, PageHeader, Spinner, ErrorState } from "../../components/UI";
import { EVENT_CATEGORIES, getCategoryImage } from "../../data/eventCategories";

const blank = {
  title: "", description: "", category: "Community Initiatives", required_skills: "", preferred_skills: "",
  experience_required: "", location: "", mode: "on-site", start_date: "", end_date: "",
  available_days: "", working_hours: "", volunteers_required: 5, application_deadline: "", status: "open",
  cover_image: "",
};

export default function OpportunityForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const { push } = useToast();
  const [form, setForm] = useState<any>(blank);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    api.get<any>(`/opportunities/${id}`).then((o) => setForm({ ...blank, ...o, start_date: o.start_date || "", end_date: o.end_date || "", application_deadline: o.application_deadline || "" })).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [id]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, volunteers_required: Number(form.volunteers_required) || 1 };
      ["start_date", "end_date", "application_deadline"].forEach((k) => { if (payload[k] === "") payload[k] = null; });
      if (id) await api.put(`/opportunities/${id}`, payload);
      else await api.post("/opportunities", payload);
      push(id ? "Opportunity updated" : "Opportunity published", "success");
      nav("/ngo/opportunities");
    } catch (err: any) { push(err.message, "error"); } finally { setSaving(false); }
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} />;

  const input = "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-950 text-sm";
  return (
    <div className="max-w-3xl">
      <PageHeader title={id ? "Edit opportunity" : "Create opportunity"} subtitle="All fields feed into the volunteer-facing listing and AI matching engine." />
      <form onSubmit={submit}>
        <Card className="p-6 space-y-4">
          <Field label="Title"><input className={input} value={form.title} onChange={(e) => set("title", e.target.value)} required /></Field>
          <Field label="Description"><textarea rows={4} className={input} value={form.description} onChange={(e) => set("description", e.target.value)} required /></Field>

          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-emerald-600" />
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Cover image</p>
            </div>
            <div className="mt-3 grid gap-4 sm:grid-cols-[1fr_180px]">
              <div>
                <input
                  className={input}
                  type="url"
                  value={form.cover_image || ""}
                  onChange={(e) => set("cover_image", e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                />
                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
                  Paste a hosted image URL. Leave blank to use the default photography for the
                  selected category.
                </p>
              </div>
              <div className="h-24 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                <img
                  src={form.cover_image || getCategoryImage(form.category)}
                  alt="Cover preview"
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.src = getCategoryImage(form.category);
                  }}
                />
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Category">
              <select className={input} value={form.category} onChange={(e) => set("category", e.target.value)} required>
                {EVENT_CATEGORIES.map((category) => (
                  <option key={category.name} value={category.name}>{category.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Mode"><select className={input} value={form.mode} onChange={(e) => set("mode", e.target.value)}><option value="on-site">On-site</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option></select></Field>
            <Field label="Required skills (comma-separated)"><input className={input} value={form.required_skills || ""} onChange={(e) => set("required_skills", e.target.value)} /></Field>
            <Field label="Preferred skills"><input className={input} value={form.preferred_skills || ""} onChange={(e) => set("preferred_skills", e.target.value)} /></Field>
            <Field label="Experience required"><input className={input} value={form.experience_required || ""} onChange={(e) => set("experience_required", e.target.value)} placeholder="Beginner / Intermediate / Advanced" /></Field>
            <Field label="Location"><input className={input} value={form.location || ""} onChange={(e) => set("location", e.target.value)} /></Field>
            <Field label="Start date"><input type="date" className={input} value={form.start_date || ""} onChange={(e) => set("start_date", e.target.value)} /></Field>
            <Field label="End date"><input type="date" className={input} value={form.end_date || ""} onChange={(e) => set("end_date", e.target.value)} /></Field>
            <Field label="Available days"><input className={input} value={form.available_days || ""} onChange={(e) => set("available_days", e.target.value)} placeholder="Saturday,Sunday" /></Field>
            <Field label="Working hours"><input className={input} value={form.working_hours || ""} onChange={(e) => set("working_hours", e.target.value)} placeholder="10:00-13:00" /></Field>
            <Field label="Volunteers required"><input type="number" min={1} className={input} value={form.volunteers_required} onChange={(e) => set("volunteers_required", e.target.value)} /></Field>
            <Field label="Application deadline"><input type="date" className={input} value={form.application_deadline || ""} onChange={(e) => set("application_deadline", e.target.value)} /></Field>
            <Field label="Status"><select className={input} value={form.status} onChange={(e) => set("status", e.target.value)}><option value="open">Open</option><option value="draft">Draft</option><option value="closed">Closed</option></select></Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => nav("/ngo/opportunities")} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold">Cancel</button>
            <button disabled={saving} className="px-5 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold disabled:opacity-60">{saving ? "Saving..." : id ? "Save changes" : "Publish opportunity"}</button>
          </div>
        </Card>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">{label}</label>{children}</div>;
}
