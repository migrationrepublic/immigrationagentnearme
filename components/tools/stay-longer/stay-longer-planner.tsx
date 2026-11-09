"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, ExternalLink, Info, Loader2, MessageCircle,
  Phone, Plane, Printer, RotateCcw, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolDisclaimer } from "@/components/tools/shared/tool-disclaimer";
import { submitToolLead } from "@/app/actions/tools";
import { handleError } from "@/lib/errors";
import {
  COMMON_VISAS, OFFICIAL_LINKS, STAY_LONGER_REVIEWED_ON, URGENT_CONTACT,
  describeStayLongerAnswers, evaluateStayLonger, getSituationContent, parseDateOnly,
  type StayLongerAnswers, type StayLongerResult, type SituationContent,
} from "@/lib/tools/stay-longer/engine";
import { MARN, OMARA_REGISTER_URL } from "@/lib/tools/visa-finder/config";

const LEAD_NAME = "Stay Longer Planner";
const DISCLAIMER =
  "This planner gives general information only and is not migration advice. It does not assess your eligibility for any visa. Your situation depends on your exact visa, its conditions and the law at the time. Information is adapted from the Australian Government Department of Home Affairs and is not endorsed by it.";

const URL_KEYS = ["visa", "expiry", "nfs", "lodged", "travel"] as const;

function track(event: string, params: Record<string, string | number>) {
  try {
    const w = window as unknown as { gtag?: (...a: unknown[]) => void };
    w.gtag?.("event", event, params);
  } catch { /* analytics must never break the tool */ }
}

function countdownText(days: number | null): string {
  if (days === null) return "Expiry date not known";
  if (days < 0) return `Expired ${Math.abs(days)} day${days === -1 ? "" : "s"} ago`;
  if (days === 0) return "Expires today";
  return `${days} day${days === 1 ? "" : "s"} left`;
}

const TONE: Record<SituationContent["tone"], string> = {
  info: "border-blue-200 bg-blue-50/60",
  warning: "border-amber-300 bg-amber-50",
  danger: "border-red-300 bg-red-50",
  success: "border-green-200 bg-green-50/70",
};

// ───────── Small form controls ─────────
function Choice<T extends string>({
  name, label, help, value, options, onChange,
}: {
  name: string; label: string; help?: string; value?: T;
  options: { value: T; label: string }[]; onChange: (v: T) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-bold text-brand-primary">{label}</legend>
      {help && <p className="text-xs text-gray-500 -mt-1">{help}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const selected = value === o.value;
          return (
            <label
              key={o.value}
              className={`min-h-11 inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 cursor-pointer text-sm transition-all focus-within:ring-2 focus-within:ring-brand-primary ${
                selected ? "border-brand-primary bg-brand-soft font-bold text-brand-primary" : "border-gray-200 hover:border-brand-primary/30 text-gray-700"
              }`}
            >
              <input type="radio" name={name} value={o.value} checked={selected} onChange={() => onChange(o.value)} className="w-4 h-4 accent-[#012269]" />
              {o.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

// ───────── Lead form ─────────
function PlannerLeadForm({ answers, result }: { answers: StayLongerAnswers; result: StayLongerResult }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const content = getSituationContent(result, answers);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (fd.get("website")) return; // honeypot
    if (!fd.get("consent")) { setError("Please tick the consent box so we can contact you."); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await submitToolLead({
        tool_name: LEAD_NAME,
        user_name: String(fd.get("name") ?? ""),
        user_email: String(fd.get("email") ?? ""),
        user_phone: String(fd.get("phone") ?? ""),
        results: {
          finder_tool: "stay-longer",
          finder_answers: describeStayLongerAnswers(answers),
          matched_visas: [`Situation ${result.situation}: ${content.title}`, countdownText(result.daysLeft)],
          matched_count: 1,
          urgency: result.urgency,
          message: String(fd.get("message") ?? ""),
          consent_given: "Yes",
        },
      });
      if (!res.success) throw new Error(res.error);
      setDone(true);
      track("sl_lead_submit", { situation: result.situation });
    } catch (err) {
      setError(handleError("StayLongerPlanner.lead", err, "We couldn't send your enquiry. Please try again, or call us."));
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center print:hidden">
        <h3 className="font-bold text-green-900">Thank you! Your enquiry has been sent.</h3>
        <p className="text-green-700 text-sm mt-1">A Migration Republic registered agent will be in touch about your situation.</p>
      </div>
    );
  }

  const input = "w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-primary outline-none text-base sm:text-sm bg-white";
  return (
    <form onSubmit={onSubmit} className="bg-slate-50 border border-gray-200 rounded-2xl p-5 sm:p-6 space-y-3.5 print:hidden">
      <div>
        <h3 className="text-lg font-bold text-brand-primary">Talk to a registered migration agent</h3>
        <p className="text-gray-500 text-xs sm:text-sm">Your answers are sent with your enquiry so we can help faster.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <input name="name" required placeholder="Full Name *" aria-label="Full name" className={input} />
        <input name="email" type="email" required placeholder="Email Address *" aria-label="Email" className={input} />
      </div>
      <input name="phone" type="tel" required placeholder="Phone or WhatsApp *" aria-label="Phone or WhatsApp" className={input} />
      <textarea name="message" rows={2} placeholder="Anything else we should know? (optional)" aria-label="Message" className={input} />
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <label className="flex gap-2 text-xs text-gray-600 cursor-pointer">
        <input name="consent" type="checkbox" className="mt-0.5 w-4 h-4 accent-[#012269]" />
        <span>I agree that Migration Republic may contact me about my enquiry and store my answers for that purpose.</span>
      </label>
      {error && <p role="alert" className="text-red-600 text-xs">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full bg-[#e40229] hover:bg-[#e40229]/95 text-white py-4 text-sm font-bold rounded-xl">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Book a Consultation"}
      </Button>
    </form>
  );
}

// ───────── Main planner ─────────
export function StayLongerPlanner() {
  const [answers, setAnswers] = useState<StayLongerAnswers>({});
  const [expiryUnknown, setExpiryUnknown] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const resultRef = useRef<HTMLHeadingElement>(null);

  // Restore from URL (shareable, survives refresh)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const restored: StayLongerAnswers = {};
    const visa = p.get("visa");
    if (visa && COMMON_VISAS.some((v) => v.value === visa)) restored.visa = visa;
    const expiry = p.get("expiry");
    if (expiry && parseDateOnly(expiry) !== null) restored.expiry = expiry;
    const nfs = p.get("nfs");
    if (nfs === "yes" || nfs === "no" || nfs === "unsure") restored.nfs = nfs;
    const lodged = p.get("lodged");
    if (lodged === "yes" || lodged === "no") restored.lodged = lodged;
    const travel = p.get("travel");
    if (travel === "yes" || travel === "no") restored.travel = travel;
    if (Object.keys(restored).length === 0) return;
    // One-time hydration from the URL (window is unavailable during SSR)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnswers(restored);
    const complete = restored.nfs && restored.lodged && restored.travel;
    if (complete) {
      setExpiryUnknown(!restored.expiry);
      setSubmitted(true);
    }
  }, []);

  // Keep URL in sync once a plan is shown (answers only, never contact details)
  useEffect(() => {
    if (!submitted) return;
    const p = new URLSearchParams();
    URL_KEYS.forEach((k) => { const v = answers[k]; if (v) p.set(k, v); });
    window.history.replaceState(null, "", `?${p.toString()}`);
  }, [answers, submitted]);

  const result = useMemo(() => evaluateStayLonger(answers), [answers]);
  const content = useMemo(() => getSituationContent(result, answers), [result, answers]);

  function set<K extends keyof StayLongerAnswers>(k: K, v: StayLongerAnswers[K]) {
    setAnswers((prev) => ({ ...prev, [k]: v }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!answers.expiry && !expiryUnknown) { setFormError("Please enter your visa expiry date, or tick “I don't know”."); return; }
    if (answers.expiry && parseDateOnly(answers.expiry) === null) { setFormError("Please enter a valid expiry date."); return; }
    if (!answers.nfs || !answers.lodged || !answers.travel) { setFormError("Please answer all the questions so we can build your plan."); return; }
    setFormError(null);
    setSubmitted(true);
    track("sl_plan_view", { situation: result.situation, urgency: result.urgency });
    requestAnimationFrame(() => {
      resultRef.current?.focus();
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function reset() {
    setAnswers({});
    setExpiryUnknown(false);
    setSubmitted(false);
    setFormError(null);
    window.history.replaceState(null, "", window.location.pathname);
  }

  const showUrgent = submitted && result.situation !== "C" && result.urgency === "urgent";

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 pb-8 space-y-5">
      {/* ── Form ── */}
      <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-xs border border-gray-200 p-4 sm:p-7 space-y-6 print:hidden" noValidate>
        <p className="text-xs text-gray-500">Asking for someone else? Answer as if you were the visa holder.</p>

        <div className="space-y-2">
          <label htmlFor="sl-visa" className="text-sm font-bold text-brand-primary block">What visa do you hold now?</label>
          <select
            id="sl-visa"
            value={answers.visa ?? ""}
            onChange={(e) => set("visa", e.target.value || undefined)}
            className="w-full min-h-11 px-3.5 py-2.5 rounded-xl border-2 border-gray-200 focus:border-brand-primary outline-none text-base sm:text-sm bg-white"
          >
            <option value="">Select your visa (optional)</option>
            {COMMON_VISAS.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="sl-expiry" className="text-sm font-bold text-brand-primary block">When does your visa expire?</label>
          <p className="text-xs text-gray-500 -mt-1">
            Find it in{" "}
            <a href={OFFICIAL_LINKS.vevo} target="_blank" rel="noopener noreferrer" className="underline font-semibold text-brand-primary">VEVO or the myVEVO app</a>
            {" "}or on your visa grant letter. ETA holders can{" "}
            <a href={OFFICIAL_LINKS.checkEta} target="_blank" rel="noopener noreferrer" className="underline font-semibold text-brand-primary">check their ETA</a>.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <input
              id="sl-expiry"
              type="date"
              value={answers.expiry ?? ""}
              disabled={expiryUnknown}
              onChange={(e) => set("expiry", e.target.value || undefined)}
              className="min-h-11 px-3.5 py-2.5 rounded-xl border-2 border-gray-200 focus:border-brand-primary outline-none text-base sm:text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400"
            />
            <label className="min-h-11 inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={expiryUnknown}
                onChange={(e) => { setExpiryUnknown(e.target.checked); if (e.target.checked) set("expiry", undefined); }}
                className="w-4 h-4 accent-[#012269]"
              />
              I don&apos;t know
            </label>
          </div>
        </div>

        <Choice
          name="nfs" label="Does your visa have a 'No Further Stay' condition?"
          help="For example condition 8503, 8534 or 8535. It's listed in VEVO and on your grant letter."
          value={answers.nfs} onChange={(v) => set("nfs", v)}
          options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }, { value: "unsure", label: "I don't know" }]}
        />
        <Choice
          name="lodged" label="Have you already lodged a new visa application?"
          value={answers.lodged} onChange={(v) => set("lodged", v)}
          options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]}
        />
        <Choice
          name="travel" label="Do you plan to travel outside Australia while you wait?"
          value={answers.travel} onChange={(v) => set("travel", v)}
          options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]}
        />

        {formError && <p role="alert" className="text-sm text-red-600 font-medium">{formError}</p>}

        <div className="flex flex-col sm:flex-row gap-2">
          <Button type="submit" className="flex-1 bg-brand-primary hover:bg-brand-primary/90 text-white py-4 rounded-xl font-bold text-sm">
            See my plan <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
          {submitted && (
            <Button type="button" variant="outline" onClick={reset} className="rounded-xl text-sm py-4">
              <RotateCcw className="w-4 h-4 mr-1" /> Start again
            </Button>
          )}
        </div>
      </form>

      {/* ── Result ── */}
      {submitted && (
        <section aria-live="polite" className="space-y-4">
          {showUrgent && (
            <div role="alert" className="rounded-2xl border-2 border-red-300 bg-red-50 p-4 sm:p-5">
              <p className="font-extrabold text-red-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                {result.situation === "D" ? "Get help now" : "Urgent: less than 30 days left"}
              </p>
              <p className="text-sm text-red-900 mt-1">Speak to a registered migration agent as soon as possible.</p>
              <div className="flex flex-col sm:flex-row gap-2 mt-3 print:hidden">
                <a href={URGENT_CONTACT.phoneHref} onClick={() => track("sl_urgent_call", { situation: result.situation })}
                  className="min-h-11 inline-flex items-center justify-center gap-2 px-4 rounded-xl bg-[#e40229] text-white text-sm font-bold">
                  <Phone className="w-4 h-4" /> Call {URGENT_CONTACT.phoneDisplay}
                </a>
                <a href={URGENT_CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" onClick={() => track("sl_urgent_whatsapp", { situation: result.situation })}
                  className="min-h-11 inline-flex items-center justify-center gap-2 px-4 rounded-xl bg-green-600 text-white text-sm font-bold">
                  <MessageCircle className="w-4 h-4" /> WhatsApp us
                </a>
              </div>
            </div>
          )}

          <article className={`rounded-2xl border-2 p-5 sm:p-7 ${TONE[content.tone]}`}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-brand-primary">
                <CalendarClock className="w-4 h-4" /> {countdownText(result.daysLeft)}
              </span>
              <button type="button" onClick={() => window.print()} className="print:hidden inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary underline cursor-pointer">
                <Printer className="w-4 h-4" /> Print checklist
              </button>
            </div>
            <h2 ref={resultRef} tabIndex={-1} className="text-xl sm:text-2xl font-extrabold text-brand-primary outline-none mb-2">
              {content.title}
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">{content.summary}</p>
            <h3 className="text-sm font-bold text-brand-primary mb-2">What to do next</h3>
            <ol className="space-y-2">
              {content.steps.map((step, i) => (
                <li key={step} className="flex gap-3 text-sm text-gray-800">
                  <span className="w-6 h-6 rounded-full bg-brand-primary text-white text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </article>

          {result.showBridgingTravelWarning && (
            <div role="status" className="rounded-2xl border border-amber-300 bg-amber-50 p-4 sm:p-5 flex gap-3">
              <Plane className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900 space-y-1">
                <p className="font-bold">Travelling while you wait? Read this first</p>
                <p>A Bridging visa A ends as soon as you leave Australia, and you may not be able to come back. To travel and return, apply for a Bridging visa B before you leave, after your Bridging visa A has been granted.</p>
                <a href={OFFICIAL_LINKS.bridgingB} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold underline">
                  Bridging visa B (official) <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {(result.situation === "A" || result.situation === "B") && (
            <div className="grid sm:grid-cols-2 gap-3 print:hidden">
              <Link href="/tools/pr-pathway-explorer" className="group bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md hover:border-brand-primary/30 transition-all">
                <p className="font-bold text-brand-primary text-sm group-hover:text-brand-accent">PR Pathway Explorer</p>
                <p className="text-xs text-gray-500 mt-0.5">See permanent residence pathways worth exploring.</p>
              </Link>
              <Link href="/tools/join-family-visa-finder" className="group bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md hover:border-brand-primary/30 transition-all">
                <p className="font-bold text-brand-primary text-sm group-hover:text-brand-accent">Join Family Visa Finder</p>
                <p className="text-xs text-gray-500 mt-0.5">Partner, parent, child and other family visas.</p>
              </Link>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5">
            <p className="text-sm font-bold text-brand-primary mb-2 flex items-center gap-1.5"><Info className="w-4 h-4" /> Official sources</p>
            <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              {[
                { href: OFFICIAL_LINKS.vevo, label: "Check your visa in VEVO / myVEVO" },
                { href: OFFICIAL_LINKS.visaConditions, label: "See your visa conditions" },
                { href: OFFICIAL_LINKS.stayLonger, label: "Staying longer in Australia" },
                { href: OFFICIAL_LINKS.bridgingA, label: "Bridging visa A" },
                ...(result.situation === "D"
                  ? [
                      { href: OFFICIAL_LINKS.noValidVisa, label: "If you don't have a valid visa" },
                      { href: OFFICIAL_LINKS.embassies, label: "Embassies and consulates in Australia" },
                      { href: OFFICIAL_LINKS.iom, label: "International Organization for Migration (IOM)" },
                    ]
                  : [{ href: OFFICIAL_LINKS.checkEta, label: "Check an ETA" }]),
              ].map((l) => (
                <li key={l.href}>
                  <a href={l.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-primary underline">
                    {l.label} <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <PlannerLeadForm answers={answers} result={result} />

          <ToolDisclaimer customText={DISCLAIMER} extraClause={`Migration Republic, MARN ${MARN}. Last reviewed: ${STAY_LONGER_REVIEWED_ON}.`} />
          <p className="text-xs text-gray-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-brand-primary" />
            <a href={OMARA_REGISTER_URL} target="_blank" rel="noopener noreferrer" className="underline font-semibold text-brand-primary">Verify on the OMARA register</a>
            <span>· Content adapted from the Australian Government Department of Home Affairs.</span>
          </p>
        </section>
      )}

      {!submitted && (
        <p className="text-xs text-gray-500 flex items-start gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-brand-primary shrink-0" />
          Your answers stay in your browser. Nothing is sent unless you choose to book a consultation.
        </p>
      )}
    </div>
  );
}
