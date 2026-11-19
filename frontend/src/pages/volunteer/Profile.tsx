import React, { useEffect, useState } from "react";
import { api } from "../../api/client";
import { errorMessage } from "../../api/types";
import { useToast } from "../../components/Toast";
import { Card, PageHeader, Spinner, ErrorState, Progress } from "../../components/UI";
import { Save, ShieldCheck } from "lucide-react";

type ProfileValue = string | boolean | number | null;
type Profile = {
  [key: string]: ProfileValue | string[] | undefined;
  completion_percentage?: number;
  missing_sections?: string[];
};

const categories = [
  "NGOs and Social Work", "Concerts and Music Festivals", "College Fests", "Cultural Events",
  "Government Events", "Political Events and Campaigns", "Sports Events and Marathons",
  "Conferences and Summits", "Carnivals and Exhibitions", "Religious Events",
  "Environmental Campaigns", "Education and Teaching", "Blood Donation Camps",
  "Community Development", "Public Awareness Campaigns", "Other Events",
];
const skills = [
  "Crowd Management", "Event Management", "Teaching", "Mathematics", "Science",
  "Communication", "Public Speaking", "Photography", "Videography", "Graphic Design",
  "Social Media Management", "Marketing", "First Aid", "Registration Management",
  "Guest Management", "Hospitality", "Logistics", "Technical Support", "Computer Skills",
  "Programming", "Content Writing", "Leadership", "Coordination", "Fundraising",
  "Security Awareness",
];
const professions = [
  "School Student", "College Student", "Working Professional", "Freelancer", "Self-employed",
  "Teacher", "Professor", "Government Employee", "Private Sector Employee", "Unemployed", "Other",
];
const professionFields: Record<string, Array<[string, string, string?]>> = {
  "School Student": [["institution_name", "School name"], ["course", "Course / grade"], ["current_year", "Current year"], ["department", "Department"]],
  "College Student": [["institution_name", "College name"], ["course", "Course / degree"], ["current_year", "Current year / semester"], ["department", "Department"]],
  "Working Professional": [["company", "Company / organization"], ["job_title", "Job title"], ["industry", "Industry"], ["work_experience", "Work experience"]],
  "Government Employee": [["company", "Department / organization"], ["job_title", "Job title"], ["industry", "Area of work"], ["work_experience", "Work experience"]],
  "Private Sector Employee": [["company", "Company / organization"], ["job_title", "Job title"], ["industry", "Industry"], ["work_experience", "Work experience"]],
  Freelancer: [["professional_skills", "Professional skills"], ["work_category", "Work category"], ["portfolio_url", "Portfolio URL", "url"], ["experience", "Experience"]],
  "Self-employed": [["professional_skills", "Professional skills"], ["work_category", "Work category"], ["portfolio_url", "Portfolio URL", "url"], ["experience", "Experience"]],
  Teacher: [["institution_name", "Institution name"], ["subject_specialization", "Subject specialization"], ["teaching_experience", "Teaching experience"], ["qualifications", "Educational qualifications"]],
  Professor: [["institution_name", "Institution name"], ["subject_specialization", "Subject specialization"], ["teaching_experience", "Teaching experience"], ["qualifications", "Educational qualifications"]],
};
const tabs = [
  "Personal information", "Professional details", "Skills & experience", "Volunteering preferences",
  "Availability", "Address", "Identity & trust", "Consent & declarations",
];
const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950";

function textValue(value: unknown): string {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function split(value: unknown) {
  return textValue(value).split(",").map((item) => item.trim()).filter(Boolean);
}

export default function VolunteerProfile() {
  const { push } = useToast();
  const [form, setForm] = useState<Profile>({});
  const [completion, setCompletion] = useState(0);
  const [missing, setMissing] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState(tabs[0]);
  const [declarations, setDeclarations] = useState({
    registration_accurate: false, processing_consent: false, terms_accepted: false,
    privacy_accepted: false, safety_guidelines_accepted: false,
    organizer_sharing_consent: false, additional_verification_consent: false,
  });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const profile = await api.get<Profile>("/profiles/volunteer/me");
      setForm(profile);
      setCompletion(profile.completion_percentage || 0);
      setMissing(profile.missing_sections || []);
    } catch (error: unknown) {
      setError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const set = (key: string, value: ProfileValue) => setForm((current) => ({ ...current, [key]: value }));
  const professionData: Record<string, string> = (() => {
    try {
      const parsed: unknown = JSON.parse(textValue(form.profession_details) || "{}");
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
      return Object.fromEntries(
        Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
      );
    } catch {
      const details = textValue(form.profession_details);
      return details ? { other_profession_details: details } : {};
    }
  })();
  const setProfessionDetail = (key: string, value: string) => {
    const updated = { ...professionData, [key]: value };
    set("profession_details", JSON.stringify(updated));
  };
  const toggleCsv = (key: string, value: string) => {
    const selected = split(form[key]);
    set(key, selected.includes(value) ? selected.filter((item) => item !== value).join(", ") : [...selected, value].join(", "));
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const profile = await api.put<Profile>("/profiles/volunteer/me", form);
      setForm(profile);
      setCompletion(profile.completion_percentage || 0);
      setMissing(profile.missing_sections || []);
      push("Profile saved. Your recommendations will use the updated information.", "success");
    } catch (error: unknown) {
      push(errorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };
  const submitConsent = async () => {
    try {
      await api.post("/profiles/volunteer/consent", declarations);
      push("Your declarations and consent choices have been recorded.", "success");
    } catch (error: unknown) {
      push(errorMessage(error), "error");
    }
  };
  const updateSafetyAnswer = async (answer: string) => {
    try {
      await api.patch("/profiles/volunteer/safety-declaration", { answer });
      set("safety_declaration", answer);
      push("Safety declaration saved. This is not a police background check.", "success");
    } catch (error: unknown) {
      push(errorMessage(error), "error");
    }
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const textField = (key: string, label: string, options: { placeholder?: string; type?: string } = {}) => (
    <label key={key} className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      <input type={options.type || "text"} value={textValue(form[key])} onChange={(event) => set(key, event.target.value)} placeholder={options.placeholder} className={inputClass} />
    </label>
  );
  const textarea = (key: string, label: string, placeholder = "") => (
    <label key={key} className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      <textarea rows={3} value={textValue(form[key])} onChange={(event) => set(key, event.target.value)} placeholder={placeholder} className={inputClass} />
    </label>
  );

  return (
    <div>
      <PageHeader title="Volunteer profile" subtitle="Complete your profile to apply to opportunities. You can browse while your profile is incomplete." />
      <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">Profile completion</h2>
              <p className="mt-1 text-sm text-slate-500">{missing.length ? `Still needed: ${missing.join(", ")}` : "Required profile sections are complete."}</p>
            </div>
            <span className="text-2xl font-extrabold text-emerald-600">{completion}%</span>
          </div>
          <Progress value={completion} className="mt-3" />
          <p className="mt-3 text-xs text-slate-500">Identity verification is separate and is not required just to browse or complete your profile.</p>
        </Card>
        <Card className="flex items-center gap-3 p-5">
          <ShieldCheck className="h-8 w-8 shrink-0 text-emerald-600" />
          <div><p className="font-bold text-slate-900 dark:text-white">Verification status</p><p className="text-sm capitalize text-slate-500">{textValue(form.verification_status) || "Not submitted"}</p></div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex gap-2 overflow-x-auto border-b border-slate-200 p-3 dark:border-slate-800">
          {tabs.map((item) => <button key={item} type="button" onClick={() => setTab(item)} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold ${tab === item ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}>{item}</button>)}
        </div>

        {tab === "Consent & declarations" ? (
          <section className="space-y-5 p-5">
            <div><h2 className="font-bold text-slate-900 dark:text-white">Consent & declarations</h2><p className="mt-1 text-sm text-slate-500">Policy version 2026-01. Your choices are saved with a server timestamp.</p></div>
            {([
              ["registration_accurate", "I confirm that the information provided is accurate."],
              ["processing_consent", "I consent to processing of my information for volunteer registration and matching."],
              ["terms_accepted", "I agree to the platform's Terms and Conditions."],
              ["privacy_accepted", "I have read and accept the Privacy Policy."],
              ["safety_guidelines_accepted", "I understand the safety and conduct guidelines."],
              ["organizer_sharing_consent", "I authorize relevant information to be shared with an organizer only after required mutual acceptance and consent."],
              ["additional_verification_consent", "Optional: I consent to additional identity or background verification if required for a role."],
            ] as const).map(([key, label]) => <label key={key} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" checked={declarations[key]} onChange={(event) => setDeclarations((current) => ({ ...current, [key]: event.target.checked }))} className="mt-1 accent-emerald-600" />{label}</label>)}
            <button type="button" onClick={submitConsent} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white">Save consent</button>
          </section>
        ) : tab === "Identity & trust" ? (
          <section className="space-y-5 p-5">
            <div><h2 className="font-bold text-slate-900 dark:text-white">Identity & trust verification</h2><p className="mt-1 text-sm text-slate-500">Verification is optional unless an event has a lawful, role-specific requirement. Self-declaration is not a police clearance.</p></div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">For your safety, this version does not upload identity documents or accept Aadhaar numbers/images. Use only a legally permitted, secure verification process; never submit an unmasked Aadhaar document here.</div>
            <label className="block max-w-sm"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Safety declaration</span><select value={textValue(form.safety_declaration)} onChange={(event) => updateSafetyAnswer(event.target.value)} className={inputClass}><option value="">Choose a response</option><option value="yes">Yes</option><option value="no">No</option><option value="confidential">Prefer to discuss confidentially</option></select></label>
            <p className="text-xs text-slate-500">A declaration is stored confidentially and does not establish whether a person has a criminal record or FIR.</p>
          </section>
        ) : (
          <form onSubmit={save} className="space-y-5 p-5">
            {tab === "Personal information" && <div className="grid gap-4 sm:grid-cols-2">
              {textField("full_name", "Full name")}
              <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Email</span><input value={textValue(form.email)} disabled className={`${inputClass} bg-slate-50 text-slate-500 dark:bg-slate-800`} /></label>
              {textField("phone", "Mobile number", { type: "tel" })}
              {textField("date_of_birth", "Date of birth", { type: "date" })}
              <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Gender (optional)</span><select value={textValue(form.gender)} onChange={(event) => set("gender", event.target.value)} className={inputClass}><option value="">Prefer not to say</option><option>Woman</option><option>Man</option><option>Non-binary</option><option>Self-describe</option></select></label>
              {textField("profile_image", "Profile photo URL (optional)", { type: "url" })}
            </div>}
            {tab === "Professional details" && <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">What best describes your current profession?</span>
                <select value={textValue(form.profession)} onChange={(event) => set("profession", event.target.value)} className={inputClass}>
                  <option value="">Select profession</option>
                  {professions.map((profession) => <option key={profession} value={profession}>{profession}</option>)}
                </select>
              </label>
              {textField("education", "Education / qualification")}
              {(professionFields[textValue(form.profession)] || [["other_profession_details", "Professional details"]]).map(([key, label, type]) => (
                <label key={key} className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
                  <input type={type || "text"} value={professionData[key] || ""} onChange={(event) => setProfessionDetail(key, event.target.value)} className={inputClass} />
                </label>
              ))}
              <p className="text-xs text-slate-500 sm:col-span-2">Only provide information relevant to volunteering. Student or employment documents are not needed for profile completion.</p>
            </div>}
            {tab === "Skills & experience" && <div className="space-y-5">
              <fieldset><legend className="mb-3 text-sm font-bold">Select your skills</legend><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{skills.map((skill) => <label key={skill} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" checked={split(form.skills).includes(skill)} onChange={() => toggleCsv("skills", skill)} className="accent-emerald-600" />{skill}</label>)}</div></fieldset>
              {textField("skills", "Add custom skills (comma separated)", { placeholder: "e.g. Translation, Data entry" })}
              {textField("skill_proficiency", "Skill proficiency (skill: level)", { placeholder: "Teaching: Advanced, First Aid: Beginner" })}
              {textarea("experience", "Previous volunteering and event experience")}
              {textField("languages", "Languages known", { placeholder: "Hindi, English" })}
              {textarea("description", "Short personal introduction")}
            </div>}
            {tab === "Volunteering preferences" && <div className="space-y-5">
              <fieldset><legend className="mb-3 text-sm font-bold">Where would you like to volunteer?</legend><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{categories.map((category) => <label key={category} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" checked={split(form.preferred_categories).includes(category)} onChange={() => toggleCsv("preferred_categories", category)} className="accent-emerald-600" />{category}</label>)}</div></fieldset>
              <div className="grid gap-4 sm:grid-cols-2">
                {textField("maximum_travel_distance", "Maximum travel distance (km)", { type: "number" })}
                <label className="flex items-center gap-2 self-end pb-3 text-sm"><input type="checkbox" checked={!!form.willing_to_travel} onChange={(event) => set("willing_to_travel", event.target.checked)} className="accent-emerald-600" />Willing to travel</label>
                <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Paid / unpaid preference</span><select value={textValue(form.volunteering_preference)} onChange={(event) => set("volunteering_preference", event.target.value)} className={inputClass}><option value="">No preference</option><option value="unpaid">Unpaid</option><option value="paid">Paid</option><option value="benefits">Benefits-based</option><option value="any">Any</option></select></label>
              </div>
            </div>}
            {tab === "Availability" && <div className="grid gap-4 sm:grid-cols-2">
              {textField("availability_days", "Available days", { placeholder: "Saturday, Sunday" })}
              {textField("available_time_slots", "Preferred time slots", { placeholder: "Morning, Afternoon" })}
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.weekday_availability} onChange={(event) => set("weekday_availability", event.target.checked)} className="accent-emerald-600" />Weekdays</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.weekend_availability} onChange={(event) => set("weekend_availability", event.target.checked)} className="accent-emerald-600" />Weekends</label>
              <label className="block sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Remote / on-site / hybrid</span><select value={textValue(form.remote_preference)} onChange={(event) => set("remote_preference", event.target.value)} className={inputClass}><option value="">Select preference</option><option value="any">Any</option><option value="on-site">On-site</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option></select></label>
            </div>}
            {tab === "Address" && <div className="space-y-4">
              <p className="text-sm text-slate-500">Your residential address is private and is not shown in public opportunities or recommendation results.</p>
              {textarea("address", "Current residential address")}
              <div className="grid gap-4 sm:grid-cols-3">{textField("city", "City")}{textField("state", "State")}{textField("pincode", "PIN code")}</div>
            </div>}
            <div className="flex justify-end border-t border-slate-100 pt-4 dark:border-slate-800">
              <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"><Save className="h-4 w-4" />{saving ? "Saving..." : "Save changes"}</button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
