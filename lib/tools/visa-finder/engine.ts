import { CLOSED_VISA_DISPLAY } from "./config";
import { VISAS } from "./visas";
import type { AgeBand, Answers, Question, ToolConfig, ToolId, VisaOption } from "./types";

// ───────── Question flows ─────────

const AGE_OPTIONS = [
  { value: "under18", label: "Under 18", help: "Most working holiday visas have a minimum age of 18." },
  { value: "18_30", label: "18 to 30", help: "The standard age range for working holiday visas." },
  { value: "31_35", label: "31 to 35", help: "Some passports are eligible up to age 35 for subclass 417." },
  { value: "over35", label: "Over 35", help: "Working holiday visas generally have an upper age limit." },
];

const visit: ToolConfig = {
  id: "visit",
  title: "Visit and Tourism Visa Finder",
  leadName: "Visit Visa Finder",
  questions: [
    {
      id: "purpose", label: "What's the main purpose of your visit?", type: "single", filters: true,
      options: [
        { value: "holiday", label: "A holiday", help: "Sightseeing, leisure travel or a general tourist trip." },
        { value: "family", label: "Visiting family or friends", help: "Spending time with relatives or friends who live in Australia." },
        { value: "transit", label: "Transit", help: "Passing through Australia on the way to another country." },
        { value: "working_holiday", label: "Working holiday", help: "A holiday where you also want to work for part of the time." },
        { value: "event", label: "Attending an event", help: "For example a wedding, festival or sporting event." },
        { value: "conference", label: "Attending a conference or expo", help: "Business events, trade shows and professional gatherings." },
        { value: "business", label: "Business visitor activities", help: "Short business meetings or negotiations, with no ongoing work." },
        { value: "medical", label: "Medical treatment", help: "Receiving treatment, supporting someone who is, or donating an organ." },
        { value: "volunteer", label: "Volunteer work", help: "Short unpaid volunteering while visiting." },
        { value: "cruise", label: "A cruise", help: "Travelling on or joining a cruise ship that visits Australia." },
      ],
    },
    { id: "passport", label: "What's your country of passport?", type: "country", filters: false },
    {
      id: "ageBand", label: "How old are you?", type: "single", filters: false,
      showIf: (a) => a.purpose === "working_holiday", options: AGE_OPTIONS,
    },
  ],
};

const study: ToolConfig = {
  id: "study",
  title: "Study Visa Finder",
  leadName: "Study Visa Finder",
  questions: [
    {
      id: "goal", label: "I want to come to Australia to:", type: "single", filters: true,
      options: [
        { value: "full_time", label: "Study full time", help: "Enrol in a registered course at an Australian education provider." },
        { value: "guardian", label: "Accompany a student as their guardian", help: "Support a student who is usually under 18." },
        { value: "training", label: "Complete workplace-based or professional development training", help: "Structured training in an Australian workplace." },
      ],
    },
    {
      id: "studentAge", label: "How old is the student?", type: "single", filters: false, alwaysAsk: true,
      showIf: (a) => a.goal !== "training",
      options: [
        { value: "under6", label: "Under 6", help: "The Student visa generally needs the student to be 6 or older." },
        { value: "6_17", label: "6 to 17", help: "Students under 18 have extra welfare requirements." },
        { value: "18plus", label: "18 or over", help: "Adult students." },
      ],
    },
    {
      id: "location", label: "Where are you now?", type: "single", filters: false, alwaysAsk: true,
      options: [
        { value: "offshore", label: "Outside Australia", help: "You are currently overseas." },
        { value: "onshore", label: "In Australia", help: "You are currently in Australia." },
      ],
    },
  ],
};

const work: ToolConfig = {
  id: "work",
  title: "Work Visa Finder",
  leadName: "Work Visa Finder",
  questions: [
    {
      id: "workType", label: "What kind of work will you do?", type: "single", filters: true,
      options: [
        { value: "crew", label: "Air or sea crew", help: "Working on an aircraft or vessel that visits Australia." },
        { value: "event", label: "Attend or work at a special event or activity", help: "Entertainment, sporting, religious or invited events." },
        { value: "business", label: "Business or investment", help: "Owning, developing or investing in a business." },
        { value: "diplomatic", label: "Foreign government, foreign language teaching or domestic work (diplomatic or consular)", help: "Work connected to a foreign government or diplomatic household." },
        { value: "research", label: "Participate in a research project", help: "Short-term research work." },
        { value: "post_study", label: "Post-study work, training and internship", help: "Work or training after you finish studying." },
        { value: "skilled", label: "Skilled or highly specialised work", help: "Work that needs specific skills, usually with an employer or sponsor." },
        { value: "working_holiday", label: "Working holiday or seasonal work", help: "Holiday with the right to work for part of your stay." },
        { value: "exchange", label: "Youth, school or staff exchange program", help: "Structured exchange arrangements." },
        { value: "palm", label: "Work in a PALM scheme specified industry", help: "Pacific Australia Labour Mobility scheme work." },
      ],
    },
    {
      id: "stay", label: "How long do you intend to stay?", type: "single", filters: true,
      showIf: (a) => a.workType === "skilled",
      options: [
        { value: "short", label: "Up to 3 months", help: "A short, specialised assignment." },
        { value: "medium", label: "Up to 5 years", help: "A temporary or provisional stay." },
        { value: "permanent", label: "Permanently", help: "Permanent residence." },
      ],
    },
    {
      id: "route", label: "How do you intend to apply?", type: "single", filters: true,
      showIf: (a) => a.workType === "skilled" && a.stay === "permanent",
      options: [
        { value: "sponsored", label: "Someone is sponsoring you", help: "An employer or a state or territory government nominates you." },
        { value: "independent", label: "You are applying independently", help: "No sponsor. Usually points-tested or recognised talent." },
      ],
    },
    { id: "passport", label: "What's your country of passport?", type: "country", filters: false, showIf: (a) => a.workType === "working_holiday" },
    {
      id: "ageBand", label: "How old are you?", type: "single", filters: false,
      showIf: (a) => a.workType === "working_holiday", options: AGE_OPTIONS,
    },
  ],
};

const LOCATION_OPTIONS = [
  { value: "onshore", label: "In Australia", help: "You will be in Australia when the application is lodged." },
  { value: "offshore", label: "Outside Australia", help: "You will be overseas when the application is lodged." },
];

const family: ToolConfig = {
  id: "family",
  title: "Join Family Visa Finder",
  leadName: "Join Family Visa Finder",
  helperText: "Asking for a relative? Answer as if you were the person who will apply.",
  questions: [
    {
      id: "reason", label: "Why do you want to come to Australia?", type: "single", filters: true,
      options: [
        { value: "partner", label: "To be with my partner or spouse", help: "Your partner is in Australia, or you are engaged to marry them." },
        { value: "child", label: "To be with my child or children", help: "Your adult child lives in Australia (parent visas)." },
        { value: "parents", label: "To live with my parents", help: "You are a child of a parent living in Australia (child visas)." },
        { value: "other_family", label: "To join another family member", help: "For example a brother, sister, grandparent, uncle or aunt." },
        { value: "carer", label: "To care for a sick relative", help: "A relative in Australia needs long-term care for a medical condition." },
      ],
    },
    {
      id: "stay", label: "How long do you want to stay?", type: "single", filters: true,
      options: [
        { value: "temporary", label: "For a while (temporarily)", help: "A visit or a stay for a set period." },
        { value: "permanent", label: "Permanently", help: "You want to live in Australia long term." },
      ],
    },
    {
      id: "relationship", label: "What is your relationship with your partner?", type: "single", filters: true,
      showIf: (a) => a.reason === "partner",
      options: [
        { value: "married_defacto", label: "Married or de facto", help: "You are married, or living together in a committed relationship." },
        { value: "engaged", label: "Engaged to be married", help: "You plan to marry your partner in Australia." },
      ],
    },
    {
      id: "sponsor", label: "Your family member in Australia is:", type: "single", filters: false, alwaysAsk: true,
      options: [
        { value: "citizen", label: "An Australian citizen", help: "Born or naturalised in Australia." },
        { value: "pr", label: "An Australian permanent resident", help: "Holds a permanent visa." },
        { value: "nz", label: "An eligible New Zealand citizen", help: "A New Zealand citizen who meets the eligibility rules." },
        { value: "other", label: "None of these / not sure", help: "For example they hold a temporary visa." },
      ],
    },
    {
      id: "location", label: "When you apply, where will you be?", type: "single", filters: true,
      options: LOCATION_OPTIONS,
    },
  ],
  resultBanner: (a) =>
    a.sponsor === "other"
      ? {
          tone: "info",
          title: "Most family visas need an eligible sponsor",
          text: "Your family member usually needs to be an Australian citizen, permanent resident or eligible New Zealand citizen to sponsor you. A registered agent can check whether another pathway fits.",
        }
      : null,
};

const pr: ToolConfig = {
  id: "pr",
  title: "PR Pathway Explorer",
  leadName: "PR Pathway Explorer",
  helperText: "Asking for someone else? Answer as if you were that person.",
  questions: [
    {
      id: "goal", label: "What best describes why you want to settle in Australia?", type: "single", filters: true,
      options: [
        { value: "family", label: "My partner or family is in Australia", help: "A partner, child, parent or relative who is a citizen or permanent resident." },
        { value: "skills", label: "My work and skills", help: "Skilled work, with or without a sponsor." },
        { value: "talent", label: "Exceptional talent or achievement", help: "An internationally recognised record of achievement." },
        { value: "pacific", label: "I'm from a Pacific Island country or Timor-Leste", help: "Ballot-based permanent residence." },
        { value: "returning", label: "I lived in Australia before", help: "Former or current permanent residents returning to Australia." },
        { value: "retirement", label: "I hold a retirement visa", help: "Long-term holders of a Retirement (405) or Investor Retirement (410) visa." },
        { value: "humanitarian", label: "I need protection", help: "Refugee and humanitarian pathways." },
        { value: "not_sure", label: "I'm not sure", help: "Show me all the main pathways." },
      ],
    },
    {
      id: "route", label: "How would you apply as a skilled worker?", type: "single", filters: true,
      showIf: (a) => a.goal === "skills",
      options: [
        { value: "employer", label: "An Australian employer will sponsor me", help: "An employer is willing to nominate you for a permanent or regional role." },
        { value: "state", label: "A state, territory or regional relative would nominate me", help: "State or territory nomination, or a family member in a regional area." },
        { value: "independent", label: "No sponsor", help: "Points-tested, with no employer, state or family sponsor." },
      ],
    },
    {
      id: "location", label: "Where are you now?", type: "single", filters: false, alwaysAsk: true,
      options: [
        { value: "onshore", label: "In Australia on a visa", help: "You currently hold an Australian visa." },
        { value: "offshore", label: "Outside Australia", help: "You are currently overseas." },
      ],
    },
    {
      id: "nfs", label: "Does your current visa have a 'No Further Stay' condition?", type: "single", filters: false, alwaysAsk: true,
      showIf: (a) => a.location === "onshore",
      options: [
        { value: "no", label: "No", help: "Your visa has no 8503, 8534 or 8535 condition." },
        { value: "yes", label: "Yes", help: "For example condition 8503 on your grant letter or in VEVO." },
        { value: "unsure", label: "I don't know", help: "Check your visa grant letter or VEVO." },
      ],
    },
  ],
  resultBanner: (a) => {
    if (a.nfs === "yes") {
      return {
        tone: "warning",
        title: "Your 'No Further Stay' condition may stop you applying in Australia",
        text: "With this condition you generally cannot apply for most other visas while in Australia, including many permanent visas. You may need to leave and apply from outside Australia, or ask for a waiver in limited cases. Get advice before your visa expires.",
        link: { href: "/tools/stay-longer-planner?nfs=yes", label: "Open the Stay Longer Planner" },
      };
    }
    if (a.nfs === "unsure") {
      return {
        tone: "info",
        title: "Check your visa conditions first",
        text: "A 'No Further Stay' condition can stop you applying for another visa in Australia. You can check your conditions in VEVO or on your visa grant letter.",
        link: { href: "/tools/stay-longer-planner", label: "Open the Stay Longer Planner" },
      };
    }
    return null;
  },
  hideLeadForm: (a) => a.goal === "humanitarian",
};

export const TOOL_CONFIGS: Record<ToolId, ToolConfig> = { visit, study, work, family, pr };

// ───────── Matching ─────────

const BAND_RANGE: Record<AgeBand, [number, number]> = {
  under18: [0, 17], "18_30": [18, 30], "31_35": [31, 35], over35: [36, 120],
};

function matchesRequiredTags(v: VisaOption, tool: ToolId, answers: Answers): boolean {
  return TOOL_CONFIGS[tool].questions.every((q) => {
    if (!q.filters) return true;
    const a = answers[q.id];
    if (!a || (q.showIf && !q.showIf(answers))) return true;
    return v.tags.includes(`${tool}.${q.id}:${a}`);
  });
}

function passesPassportRule(v: VisaOption, passport?: string): boolean {
  if (!passport || !v.passportRule) return true; // unanswered: never hide
  const inList = v.passportRule.countries.includes(passport);
  return v.passportRule.mode === "only" ? inList : !inList;
}

function passesAgeRule(v: VisaOption, band?: string): boolean {
  if (!band || !v.ageRule) return true;
  const range = BAND_RANGE[band as AgeBand];
  if (!range) return true;
  const { min = 0, max = 120 } = v.ageRule;
  return range[0] <= max && range[1] >= min;
}

function isHiddenClosed(v: VisaOption): boolean {
  return CLOSED_VISA_DISPLAY === "hide" && (v.status === "closed" || v.status === "transitional");
}

const statusRank = (v: VisaOption) => (v.status === "open" ? 0 : v.status === "restricted" ? 1 : 2);

export function matchVisas(tool: ToolId, answers: Answers, catalogue: VisaOption[] = VISAS): VisaOption[] {
  const order = new Map(catalogue.map((v, i) => [v.id, i]));
  return catalogue
    .filter((v) => v.tools.includes(tool))
    .filter((v) => !isHiddenClosed(v))
    .filter((v) => matchesRequiredTags(v, tool, answers))
    .filter((v) => passesPassportRule(v, answers.passport))
    .filter((v) => passesAgeRule(v, answers.ageBand))
    .sort((a, b) => statusRank(a) - statusRank(b) || order.get(a.id)! - order.get(b.id)!);
}

// ───────── Flow ─────────

/** Would asking this question change the shown results? */
function questionChangesResults(tool: ToolId, q: Question, answers: Answers): boolean {
  if (q.alwaysAsk) return true;
  if (q.type === "country") {
    const pool = matchVisas(tool, { ...answers, passport: undefined });
    const countries = new Set<string>(["__other__"]);
    pool.forEach((v) => v.passportRule?.countries.forEach((c) => countries.add(c)));
    const sig = (p: string) => matchVisas(tool, { ...answers, passport: p }).map((v) => v.id).join("|");
    const base = sig("__other__");
    return Array.from(countries).some((c) => sig(c) !== base);
  }
  if (!q.options) return false;
  const sig = (val?: string) => matchVisas(tool, { ...answers, [q.id]: val }).map((v) => v.id).join("|");
  return new Set(q.options.map((o) => sig(o.value))).size > 1;
}

/** Questions that apply to the current answers (answered ones included). */
export function getActiveQuestions(tool: ToolId, answers: Answers): Question[] {
  const active: Question[] = [];
  for (const q of TOOL_CONFIGS[tool].questions) {
    if (q.showIf && !q.showIf(answers)) continue;
    const answered = answers[q.id] !== undefined;
    if (answered || questionChangesResults(tool, q, answers)) active.push(q);
  }
  return active;
}

/** Drop answers whose question no longer applies (after a user changes an earlier answer). */
export function pruneAnswers(tool: ToolId, answers: Answers): Answers {
  const out: Answers = { ...answers };
  for (const q of TOOL_CONFIGS[tool].questions) {
    if (q.showIf && !q.showIf(out)) delete out[q.id];
  }
  return out;
}

// ───────── Per-card notes (never remove a visa) ─────────

export function getVisaNotes(tool: ToolId, answers: Answers, v: VisaOption): string[] {
  const notes: string[] = [];
  if (tool === "study" && v.id === "500" && answers.studentAge === "under6") {
    notes.push("The Student visa generally requires the student to be 6 or older.");
  }
  if (v.ageRule && answers.ageBand === "31_35" && v.id.startsWith("417")) {
    notes.push("Ages 31 to 35 are only eligible for some passports. Confirm yours.");
  }
  if (tool === "family" && v.location === "onshore") {
    notes.push("A 'No Further Stay' condition (such as 8503) on your current visa can stop you applying in Australia.");
  }
  if (tool === "family" && answers.reason === "partner" && answers.sponsor === "nz") {
    notes.push("Your New Zealand citizen partner must meet the 'eligible New Zealand citizen' rules to sponsor you.");
  }
  if (v.passportListUnverified) {
    notes.push("Eligible passports change often. Check the current list before applying.");
  }
  if (v.statusNote) notes.push(v.statusNote);
  return notes;
}

// ───────── Option labels for leads / summaries ─────────

export function describeAnswers(tool: ToolId, answers: Answers): Record<string, string> {
  const out: Record<string, string> = {};
  for (const q of TOOL_CONFIGS[tool].questions) {
    const a = answers[q.id];
    if (!a) continue;
    out[q.label] = q.options?.find((o) => o.value === a)?.label ?? a;
  }
  return out;
}

/** Group 2nd/3rd working holiday cards under the first. */
export function foldResults(results: VisaOption[]): { primary: VisaOption; folded: VisaOption[] }[] {
  const groups: { primary: VisaOption; folded: VisaOption[] }[] = [];
  const byKey = new Map<string, { primary: VisaOption; folded: VisaOption[] }>();
  for (const v of results) {
    if (v.foldUnder) {
      const g = byKey.get(v.foldUnder);
      if (g) { g.folded.push(v); continue; }
      const ng = { primary: v, folded: [] as VisaOption[] };
      byKey.set(v.foldUnder, ng);
      groups.push(ng);
    } else {
      groups.push({ primary: v, folded: [] });
    }
  }
  return groups;
}
