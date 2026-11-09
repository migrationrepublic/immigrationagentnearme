"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle, ArrowRight, Check, ChevronLeft, ExternalLink, Info, Loader2, RotateCcw, Search, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolDisclaimer } from "@/components/tools/shared/tool-disclaimer";
import { submitToolLead } from "@/app/actions/tools";
import {
  TOOL_CONFIGS, describeAnswers, foldResults, getActiveQuestions, getVisaNotes, matchVisas, pruneAnswers,
} from "@/lib/tools/visa-finder/engine";
import { COUNTRIES } from "@/lib/tools/visa-finder/countries";
import {
  BOOK_CONSULTATION_URL, CATALOGUE_REVIEWED_ON, MARN, OMARA_REGISTER_URL, VISA_PRICING_ESTIMATOR_URL,
} from "@/lib/tools/visa-finder/config";
import type { Answers, Question, ResultBanner, ToolId, VisaOption } from "@/lib/tools/visa-finder/types";

const DISCLAIMER =
  "This tool gives general information only and is not migration advice. It does not list every visa, consider secondary applicants, or assess eligibility, which depends on legislation, including health and character requirements. Visa rules, fees and eligible countries change. Information is adapted from the Australian Government Department of Home Affairs and is not endorsed by it.";

function track(event: string, params: Record<string, string | number>) {
  try {
    const w = window as unknown as { gtag?: (...a: unknown[]) => void };
    w.gtag?.("event", event, params);
  } catch { /* analytics must never break the tool */ }
}

/** Build a link to a related tool, carrying selected answers across as query params. */
function relatedHref(visa: VisaOption, answers: Answers): string | undefined {
  if (!visa.relatedTool) return undefined;
  const params = new URLSearchParams();
  visa.relatedTool.carry?.forEach((k) => { const val = answers[k]; if (val) params.set(k, val); });
  const qs = params.toString();
  return qs ? `${visa.relatedTool.href}?${qs}` : visa.relatedTool.href;
}

function Banner({ banner }: { banner: ResultBanner }) {
  const warning = banner.tone === "warning";
  return (
    <div
      role={warning ? "alert" : "status"}
      className={`rounded-2xl border p-4 sm:p-5 flex gap-3 ${warning ? "bg-amber-50 border-amber-300 text-amber-900" : "bg-blue-50 border-blue-200 text-blue-900"}`}
    >
      {warning ? <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" /> : <Info className="w-5 h-5 shrink-0 mt-0.5 text-blue-700" />}
      <div className="text-sm space-y-1.5">
        <p className="font-bold">{banner.title}</p>
        <p className="leading-relaxed">{banner.text}</p>
        {banner.link && (
          <Link href={banner.link.href} className="inline-flex items-center gap-1 font-bold underline">
            {banner.link.label} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}

const money = (n: number | null) =>
  n === null ? "Varies" : n === 0 ? "Free" : `AUD ${n.toLocaleString("en-AU")}`;

// ───────── Country combobox ─────────
function CountryCombobox({ value, onSelect }: { value?: string; onSelect: (c: string) => void }) {
  const [query, setQuery] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (q ? COUNTRIES.filter((c) => c.toLowerCase().includes(q)) : COUNTRIES).slice(0, 50);
  }, [query]);

  const choose = (c: string) => { setQuery(c); setOpen(false); onSelect(c); };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          role="combobox"
          aria-expanded={open}
          aria-controls="vf-country-list"
          aria-autocomplete="list"
          aria-label="Country of passport"
          value={query}
          placeholder="Start typing your country"
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(0); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((i) => Math.min(i + 1, matches.length - 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
            else if (e.key === "Enter" && open && matches[active]) { e.preventDefault(); choose(matches[active]); }
            else if (e.key === "Escape") setOpen(false);
          }}
          className="w-full pl-10 pr-3.5 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-primary outline-none text-base sm:text-sm bg-white"
        />
      </div>
      {open && (
        <ul
          id="vf-country-list"
          role="listbox"
          className="absolute z-20 mt-1 w-full max-h-64 overflow-auto bg-white border border-gray-200 rounded-xl shadow-lg"
        >
          {matches.length === 0 && <li className="px-4 py-3 text-sm text-gray-500">No country found</li>}
          {matches.map((c, i) => (
            <li
              key={c}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => { e.preventDefault(); choose(c); }}
              onMouseEnter={() => setActive(i)}
              className={`px-4 py-2.5 text-sm cursor-pointer ${i === active ? "bg-brand-soft text-brand-primary font-semibold" : "text-gray-700"}`}
            >
              {c}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ───────── Result card ─────────
function ResultCard({
  visa, folded, notes, onCta, related,
}: {
  visa: VisaOption; folded: VisaOption[]; notes: string[];
  onCta: (id: string, kind: "guide" | "cta") => void;
  related?: string;
}) {
  const flagged = visa.status === "closed" || visa.status === "transitional";
  return (
    <article className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-xs hover:shadow-md transition-shadow">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-brand-accent">
            {visa.kicker ?? (visa.subclass ? `Subclass ${visa.subclass}` : "Authority")}
          </p>
          <h3 className="text-base sm:text-lg font-bold text-brand-primary leading-tight">
            {visa.name}{visa.stream ? ` — ${visa.stream}` : ""}
          </h3>
        </div>
        {flagged && (
          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 px-2 py-1 rounded">
            Check current status
          </span>
        )}
      </div>

      <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-3">{visa.summary}</p>

      <dl className="grid grid-cols-2 gap-3 text-xs sm:text-sm mb-3">
        <div>
          <dt className="text-gray-400 font-semibold">Stay</dt>
          <dd className="text-gray-800 font-medium">{visa.stay}</dd>
        </div>
        <div>
          <dt className="text-gray-400 font-semibold">Application charge from</dt>
          <dd className="text-gray-800 font-medium">{visa.feeNote ?? money(visa.feeFromAud)}</dd>
        </div>
      </dl>

      {visa.highlights.length > 0 && (
        <ul className="space-y-1 mb-3">
          {visa.highlights.slice(0, 3).map((h) => (
            <li key={h} className="flex gap-2 text-xs sm:text-sm text-gray-600">
              <Check className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" /> {h}
            </li>
          ))}
        </ul>
      )}

      {folded.length > 0 && (
        <details className="mb-3 text-xs sm:text-sm">
          <summary className="cursor-pointer font-semibold text-brand-primary">
            Also available: {folded.map((f) => f.stream).join(", ")}
          </summary>
          <ul className="mt-2 space-y-1 text-gray-600">
            {folded.map((f) => (
              <li key={f.id}><strong>{f.stream}:</strong> {f.highlights[0]} (from {money(f.feeFromAud)})</li>
            ))}
          </ul>
        </details>
      )}

      {notes.length > 0 && (
        <div className="mb-3 bg-slate-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-600 space-y-1">
          {notes.map((n) => (<p key={n} className="flex gap-2"><Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-brand-primary" /> {n}</p>))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-gray-100">
        {related && visa.relatedTool && (
          <Link
            href={related}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary/90"
          >
            {visa.relatedTool.label} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
        {visa.guideUrl && (
          <a
            href={visa.guideUrl} target="_blank" rel="noopener noreferrer"
            onClick={() => onCta(visa.id, "guide")}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-brand-primary/20 text-brand-primary text-xs font-bold hover:bg-brand-soft"
          >
            Read the full guide <ArrowRight className="w-3.5 h-3.5" />
          </a>
        )}
        {visa.agentCanAssist ? (
          <a
            href={BOOK_CONSULTATION_URL} target="_blank" rel="noopener noreferrer"
            onClick={() => onCta(visa.id, "cta")}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-[#e40229] hover:bg-[#e40229]/95 text-white text-xs font-bold shadow-sm"
          >
            Book a Consultation
          </a>
        ) : (
          <a
            href={visa.officialUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50"
          >
            Official guidance <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </article>
  );
}

// ───────── Lead form ─────────
function FinderLeadForm({
  tool, answers, matched,
}: { tool: ToolId; answers: Answers; matched: VisaOption[] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const cfg = TOOL_CONFIGS[tool];

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (fd.get("website")) return; // honeypot
    if (!fd.get("consent")) { setError("Please tick the consent box so we can contact you."); return; }
    setLoading(true);
    setError(null);
    const res = await submitToolLead({
      tool_name: cfg.leadName,
      user_name: String(fd.get("name") ?? ""),
      user_email: String(fd.get("email") ?? ""),
      user_phone: String(fd.get("phone") ?? ""),
      results: {
        finder_tool: tool,
        finder_answers: describeAnswers(tool, answers),
        matched_visas: matched.map((v) => `${v.subclass ?? ""} ${v.name}${v.stream ? ` — ${v.stream}` : ""}`.trim()),
        matched_count: matched.length,
        message: String(fd.get("message") ?? ""),
        consent_given: "Yes",
      },
    });
    setLoading(false);
    if (res.success) { setDone(true); track("vf_lead_submit", { tool }); }
    else setError("Something went wrong. Please try again.");
  }

  if (done) {
    return (
      <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center">
        <h3 className="font-bold text-green-900">Thank you! Your enquiry has been sent.</h3>
        <p className="text-green-700 text-sm mt-1">A Migration Republic registered agent will be in touch about your options.</p>
      </div>
    );
  }

  const input = "w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-primary outline-none text-base sm:text-sm bg-white";
  return (
    <form onSubmit={onSubmit} className="bg-slate-50 border border-gray-200 rounded-2xl p-5 sm:p-6 space-y-3.5">
      <div>
        <h3 className="text-lg font-bold text-brand-primary">Talk to a registered agent about these options</h3>
        <p className="text-gray-500 text-xs sm:text-sm">Your answers and matched visas are sent with your enquiry. Results above are always free to view.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <input name="name" required placeholder="Full Name *" aria-label="Full name" className={input} />
        <input name="email" type="email" required placeholder="Email Address *" aria-label="Email" className={input} />
      </div>
      <input name="phone" type="tel" required placeholder="Contact Number *" aria-label="Phone" className={input} />
      <textarea name="message" rows={2} placeholder="Anything else we should know? (optional)" aria-label="Message" className={input} />
      {/* honeypot */}
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <label className="flex gap-2 text-xs text-gray-600 cursor-pointer">
        <input name="consent" type="checkbox" className="mt-0.5 w-4 h-4 accent-[#012269]" />
        <span>I agree that Migration Republic may contact me about my enquiry and store my answers for that purpose.</span>
      </label>
      {error && <p className="text-red-600 text-xs">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full bg-[#e40229] hover:bg-[#e40229]/95 text-white py-4 text-sm font-bold rounded-xl">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Book a Consultation"}
      </Button>
    </form>
  );
}

// ───────── Main finder ─────────
export function VisaFinder({ tool }: { tool: ToolId }) {
  const cfg = TOOL_CONFIGS[tool];
  const [answers, setAnswers] = useState<Answers>({});
  const [step, setStep] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [started, setStarted] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Restore state from URL (shareable, survives refresh)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const restored: Answers = {};
    cfg.questions.forEach((q) => {
      const val = params.get(q.id);
      // Ignore unknown values (stale or hand-edited URLs)
      const valid = q.type === "country" ? COUNTRIES.includes(val ?? "") : q.options?.some((o) => o.value === val);
      if (val && valid) restored[q.id] = val;
    });
    if (Object.keys(restored).length) {
      const clean = pruneAnswers(tool, restored);
      // One-time hydration from the URL (window is unavailable during SSR)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnswers(clean);
      // Resume at the first unanswered question (or results if all answered)
      const act = getActiveQuestions(tool, clean);
      const firstOpen = act.findIndex((q) => !clean[q.id]);
      setStep(firstOpen === -1 ? act.length : firstOpen);
      setStarted(true);
    }
  }, [tool, cfg.questions]);

  // Keep URL in sync (answers only, never contact details)
  useEffect(() => {
    if (!started) return;
    const params = new URLSearchParams();
    Object.entries(answers).forEach(([k, v]) => v && params.set(k, v));
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [answers, started]);

  const active = useMemo(() => getActiveQuestions(tool, answers), [tool, answers]);
  const results = useMemo(() => matchVisas(tool, answers), [tool, answers]);
  const finished = showAll || step >= active.length;
  const question: Question | undefined = active[step];
  const groups = useMemo(() => foldResults(results), [results]);
  const banner = cfg.resultBanner?.(answers) ?? null;

  // Move focus to the new heading on each step, but not on first load (avoids a scroll jump)
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    headingRef.current?.focus();
  }, [step, finished]);
  useEffect(() => {
    if (finished && started) {
      track("vf_results_view", { tool, result_count: results.length });
      if (results.length === 0) track("vf_zero_results", { tool });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  function answer(q: Question, value: string) {
    if (!started) { setStarted(true); track("vf_start", { tool }); }
    const next = pruneAnswers(tool, { ...answers, [q.id]: value });
    setAnswers(next);
    track("vf_question_answered", { tool, question_id: q.id, step: step + 1 });
    const nextActive = getActiveQuestions(tool, next);
    const idx = nextActive.findIndex((x) => x.id === q.id);
    setStep(idx + 1);
  }

  function back() { setShowAll(false); setStep((s) => Math.max(0, Math.min(s, active.length) - 1)); track("vf_back", { tool, step }); }
  function change(id: string) { setShowAll(false); setStep(Math.max(0, active.findIndex((q) => q.id === id))); }
  function reset() { setAnswers({}); setStep(0); setShowAll(false); setStarted(false); window.history.replaceState(null, "", window.location.pathname); }

  const answered = describeAnswers(tool, answers);
  const answeredList = active.filter((q) => answers[q.id]);

  const Counter = (
    <div aria-live="polite" className="text-sm font-bold text-brand-primary">
      {results.length} {results.length === 1 ? "option" : "options"} may suit you
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 pb-8">
      <div className="grid lg:grid-cols-[1fr_280px] gap-5 items-start">
        <div>
          {!finished && question && (
            <>
              <div className="mb-4">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
                    Question {step + 1} of {active.length}
                  </span>
                  <span className="text-xs text-gray-500">{Math.round(((step + 1) / Math.max(active.length, 1)) * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-accent transition-all duration-500" style={{ width: `${((step + 1) / Math.max(active.length, 1)) * 100}%` }} />
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-4 sm:p-8">
                <fieldset>
                  <legend className="sr-only">{question.label}</legend>
                  <h2 ref={headingRef} tabIndex={-1} className="text-lg sm:text-2xl font-bold text-brand-primary mb-1 outline-none">
                    {question.label}
                  </h2>
                  <p className="text-xs text-gray-500 mb-4">{cfg.helperText ?? "Looking for someone else? Answer as if you were that traveller."}</p>

                  {question.type === "country" ? (
                    <CountryCombobox value={answers[question.id]} onSelect={(c) => answer(question, c)} />
                  ) : (
                    <div className="grid gap-2.5 mt-2">
                      {question.options?.map((o) => {
                        const selected = answers[question.id] === o.value;
                        return (
                          <label
                            key={o.value}
                            className={`flex items-start gap-3 p-3.5 sm:p-4 rounded-xl border-2 cursor-pointer transition-all focus-within:ring-2 focus-within:ring-brand-primary ${
                              selected ? "border-brand-primary bg-brand-soft/80" : "border-gray-100 hover:border-brand-primary/20 hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="radio" name={question.id} value={o.value} checked={selected}
                              onChange={() => answer(question, o.value)}
                              // Radios don't fire onChange when already checked: re-confirming a
                              // pre-filled answer (shared link, hand-off, "Change") must still advance.
                              onClick={() => { if (selected) answer(question, o.value); }}
                              className="mt-1 w-4 h-4 accent-[#012269]"
                            />
                            <span>
                              <span className={`block text-sm sm:text-base ${selected ? "font-bold text-brand-primary" : "font-medium text-gray-800"}`}>{o.label}</span>
                              <span className="block text-xs text-gray-500 mt-0.5">{o.help}</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </fieldset>

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
                  <Button variant="ghost" onClick={back} disabled={step === 0} className="text-gray-500 text-xs font-semibold disabled:opacity-0">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <button type="button" onClick={() => setShowAll(true)} className="text-xs font-semibold text-brand-primary hover:text-brand-accent underline cursor-pointer">
                    Show all {results.length} options
                  </button>
                </div>
              </div>
            </>
          )}

          {finished && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 ref={headingRef} tabIndex={-1} className="text-xl sm:text-2xl font-extrabold text-brand-primary outline-none">
                  {results.length > 0 ? `${results.length} ${results.length === 1 ? "option" : "options"} to explore` : "No listed option matched"}
                </h2>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={back} className="rounded-xl text-xs"><ChevronLeft className="w-4 h-4 mr-1" /> Change answers</Button>
                  <Button variant="outline" onClick={reset} className="rounded-xl text-xs"><RotateCcw className="w-4 h-4 mr-1" /> Start again</Button>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                Fees change, usually from 1 July. Check the{" "}
                <a href={VISA_PRICING_ESTIMATOR_URL} target="_blank" rel="noopener noreferrer" className="text-brand-primary underline font-semibold">Visa Pricing Estimator</a>{" "}
                for current charges.
              </p>

              {banner && <Banner banner={banner} />}

              {results.length === 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6 text-sm text-gray-600">
                  None of the visas in this tool matched your answers. That does not mean there is no option for you. A registered agent can look at your full situation.
                </div>
              )}

              <div className="grid gap-4">
                {groups.map(({ primary, folded }) => (
                  <ResultCard
                    key={primary.id} visa={primary} folded={folded}
                    notes={getVisaNotes(tool, answers, primary)}
                    related={relatedHref(primary, answers)}
                    onCta={(id, kind) => track(kind === "guide" ? "vf_guide_click" : "vf_cta_click", { tool, visa_id: id })}
                  />
                ))}
              </div>

              {!cfg.hideLeadForm?.(answers) && <FinderLeadForm tool={tool} answers={answers} matched={results} />}

              <ToolDisclaimer customText={DISCLAIMER} extraClause={`Migration Republic, MARN ${MARN}. Last reviewed: ${CATALOGUE_REVIEWED_ON}.`} />
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-primary" />
                <a href={OMARA_REGISTER_URL} target="_blank" rel="noopener noreferrer" className="underline font-semibold text-brand-primary">Verify on the OMARA register</a>
                <span>· Content adapted from the Australian Government Department of Home Affairs.</span>
              </p>
            </div>
          )}
        </div>

        {/* Side panel (desktop) */}
        <aside className="hidden lg:block sticky top-24 bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
          {Counter}
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-2">Your answers</p>
            {answeredList.length === 0 ? (
              <p className="text-xs text-gray-400">No answers yet.</p>
            ) : (
              <ul className="space-y-2">
                {answeredList.map((q) => (
                  <li key={q.id} className="text-xs">
                    <span className="block text-gray-400">{q.label}</span>
                    <span className="font-semibold text-gray-800">{answered[q.label]}</span>{" "}
                    <button type="button" onClick={() => change(q.id)} className="text-brand-accent font-semibold underline cursor-pointer">Change</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      {/* Bottom bar (mobile) */}
      {!finished && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-200 px-4 py-2.5 flex items-center justify-between">
          {Counter}
          <button type="button" onClick={() => setShowAll(true)} className="text-xs font-bold text-brand-accent underline cursor-pointer">Show all</button>
        </div>
      )}
      {!finished && <div className="lg:hidden h-12" />}

      <p className="mt-6 text-center text-xs text-gray-400">
        <Link href="/tools/visa-finder" className="underline">All visa finders</Link>
      </p>
    </div>
  );
}
