import { EXTERNAL_LINKS } from "@/lib/links";
import { CATALOGUE_REVIEWED_ON, CATALOGUE_REVIEWED_BY } from "./config";
import type { ToolId, VisaOption } from "./types";
import { FAMILY_PR_VISAS } from "./family-pr-visas";
import {
  ADS_COUNTRIES, ETA_COUNTRIES, EVISITOR_COUNTRIES, FREQUENT_TRAVELLER_COUNTRIES,
  NEW_ZEALAND, WORKING_HOLIDAY_417_COUNTRIES, WORK_AND_HOLIDAY_462_COUNTRIES,
} from "./passports";

const LISTING = "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing";

/** Tag helper: tag("visit","purpose","holiday") => ["visit.purpose:holiday"] */
const tag = (tool: ToolId, q: string, ...values: string[]) => values.map((x) => `${tool}.${q}:${x}`);

type Input = Partial<VisaOption> &
  Pick<VisaOption, "id" | "subclass" | "name" | "tools" | "summary" | "stay" | "feeFromAud">;

function v(p: Input): VisaOption {
  return {
    tags: [],
    highlights: [],
    location: "either",
    status: "open",
    agentCanAssist: true,
    officialUrl: LISTING,
    lastReviewed: CATALOGUE_REVIEWED_ON,
    reviewedBy: CATALOGUE_REVIEWED_BY,
    ...p,
  };
}

const V: ToolId = "visit";
const W: ToolId = "work";
const S: ToolId = "study";

const P = (...values: string[]) => tag(V, "purpose", ...values);
const WT = (...values: string[]) => tag(W, "workType", ...values);

const CLOSED_NOTE =
  "Reported closed to new applicants or replaced. Confirm current status with a registered agent before relying on it.";

export const VISAS: VisaOption[] = [
  // ───────── VISIT ─────────
  v({
    id: "600-ads", subclass: "600", name: "Visitor", stream: "Approved Destination Status", tools: [V],
    tags: P("holiday"), location: "offshore",
    summary: "A group tourist visa for citizens of the People's Republic of China travelling on an organised tour.",
    highlights: ["Organised group tour", "PRC passport holders (excl. SARs)"],
    stay: "As granted", feeFromAud: 250,
    passportRule: { mode: "only", countries: ADS_COUNTRIES },
  }),
  v({
    id: "600-tourist-offshore", subclass: "600", name: "Visitor", stream: "Tourist (apply outside Australia)", tools: [V],
    tags: P("holiday", "family", "event", "volunteer", "cruise"), location: "offshore",
    summary: "For tourism or visiting family and friends when you are outside Australia at application and decision.",
    highlights: ["Stay of 3, 6 or 12 months", "Apply from outside Australia"],
    stay: "3, 6 or 12 months", feeFromAud: 250,
  }),
  v({
    id: "600-tourist-onshore", subclass: "600", name: "Visitor", stream: "Tourist (apply in Australia)", tools: [V],
    tags: P("holiday", "family", "event", "volunteer", "cruise"), location: "onshore",
    summary: "For tourism or visiting family and friends when you are already in Australia at application and decision.",
    highlights: ["Stay of up to 12 months", "You must be in Australia"],
    stay: "Up to 12 months", feeFromAud: 630,
  }),
  v({
    id: "651", subclass: "651", name: "eVisitor", tools: [V],
    tags: P("holiday", "family", "event", "conference", "business", "volunteer", "cruise"), location: "offshore",
    summary: "A free online visa for tourism or business visits for citizens of eligible European passports.",
    highlights: ["No application charge", "Up to 3 months per visit", "Apply outside Australia"],
    stay: "3 months per entry", feeFromAud: 0, feeNote: "Free",
    passportRule: { mode: "only", countries: EVISITOR_COUNTRIES }, passportListUnverified: true,
  }),
  v({
    id: "601", subclass: "601", name: "Electronic Travel Authority (ETA)", tools: [V],
    tags: P("holiday", "family", "event", "conference", "business", "volunteer", "cruise"), location: "offshore",
    summary: "An app-based travel authority for eligible passports visiting for tourism or business.",
    highlights: ["Apply through the Australian ETA app", "Up to 3 months per visit"],
    stay: "3 months per entry", feeFromAud: 20, feeNote: "AUD20 service charge",
    passportRule: { mode: "only", countries: ETA_COUNTRIES }, passportListUnverified: true,
    agentCanAssist: false,
    statusNote: "ETAs currently cannot be lodged through a migration agent. Apply directly using the official app.",
  }),
  v({
    id: "600-frequent-traveller", subclass: "600", name: "Visitor", stream: "Frequent Traveller", tools: [V],
    tags: P("holiday", "family", "conference", "business"),
    summary: "A long-validity visa for frequent visitors from selected countries.",
    highlights: ["Valid up to 10 years", "Up to 3 months per entry"],
    stay: "Up to 10 years, 3 months per entry", feeFromAud: 1845,
    passportRule: { mode: "only", countries: FREQUENT_TRAVELLER_COUNTRIES },
  }),
  v({
    id: "600-sponsored-family", subclass: "600", name: "Visitor", stream: "Sponsored Family", tools: [V],
    tags: P("family"),
    summary: "For visiting family when an eligible Australian citizen or permanent resident family member sponsors you.",
    highlights: ["Sponsor must be an eligible family member", "A bond may be requested"],
    stay: "Up to 12 months", feeFromAud: 250,
  }),
  v({
    id: "444", subclass: "444", name: "Special Category", tools: [V, W],
    tags: P("holiday", "family", "event", "business", "volunteer", "cruise"),
    summary: "A visa granted on arrival to New Zealand citizens.",
    highlights: ["New Zealand passport holders", "No application charge"],
    stay: "While in Australia", feeFromAud: 0, feeNote: "Free",
    passportRule: { mode: "only", countries: NEW_ZEALAND },
  }),
  v({
    id: "771", subclass: "771", name: "Transit", tools: [V],
    tags: P("transit"),
    summary: "For passing through Australia on the way to another country.",
    highlights: ["Up to 72 hours", "Grant can end most other visas you hold"],
    stay: "Up to 72 hours", feeFromAud: 0, feeNote: "Free",
  }),
  ...([
    ["417-first", "417", "Working Holiday", "First Working Holiday", 840, "417", ["Ages 18 to 30 (35 for some countries)", "Work rights during your stay"], "Holiday and work for up to a year for young people from partner countries."],
    ["417-second", "417", "Working Holiday", "Second Working Holiday", 1000, "417", ["Requires 3 months of specified work"], "A second year for first-visa holders who completed specified work."],
    ["417-third", "417", "Working Holiday", "Third Working Holiday", 1000, "417", ["Requires 6 months of specified work"], "A third year for second-visa holders who completed more specified work."],
    ["462-first", "462", "Work and Holiday", "First Work and Holiday", 840, "462", ["Ages 18 to 30", "Ballot applies for some countries (e.g. China, India, Vietnam)"], "Holiday and work for up to a year for young people from eligible partner countries."],
    ["462-second", "462", "Work and Holiday", "Second Work and Holiday", 1000, "462", ["Requires 3 months of specified work"], "A second year for first-visa holders who completed specified work."],
    ["462-third", "462", "Work and Holiday", "Third Work and Holiday", 1000, "462", ["Requires 6 months of specified work"], "A third year for second-visa holders who completed more specified work."],
  ] as [string, string, string, string, number, string, string[], string][]).map(
    ([id, subclass, name, stream, fee, fold, highlights, summary]) =>
      v({
        id, subclass, name, stream, tools: [V, W],
        tags: [...P("working_holiday"), ...WT("working_holiday")],
        summary, highlights, stay: "12 months", feeFromAud: fee, foldUnder: fold,
        ageRule: fold === "417" ? { min: 18, max: 35, note: "Ages 18 to 30, or up to 35 for some passports." } : { min: 18, max: 30 },
        passportRule: {
          mode: "only",
          countries: fold === "417" ? WORKING_HOLIDAY_417_COUNTRIES : WORK_AND_HOLIDAY_462_COUNTRIES,
        },
        passportListUnverified: true,
      })
  ),
  v({
    id: "600-business", subclass: "600", name: "Visitor", stream: "Business Visitor", tools: [V],
    tags: P("conference", "business"),
    summary: "For short business visits such as meetings, conferences or negotiations. No work or selling goods or services.",
    highlights: ["Up to 3 months", "Business visitor activities only"],
    stay: "Up to 3 months", feeFromAud: 250,
  }),
  v({
    id: "602", subclass: "602", name: "Medical Treatment", tools: [V],
    tags: P("medical"),
    summary: "For receiving medical treatment, supporting someone who is, or donating an organ.",
    highlights: ["Treatment, support or organ donation", "Health requirements apply"],
    stay: "Temporary", feeFromAud: 0, feeNote: "Free offshore, AUD480 onshore",
  }),

  // ───────── STUDY ─────────
  v({
    id: "500", subclass: "500", name: "Student", tools: [S],
    tags: tag(S, "goal", "full_time"),
    summary: "For full-time study in an Australian registered course.",
    highlights: ["Stay in line with your enrolment", "Student must be 6 or older"],
    stay: "Up to 6 years, in line with enrolment", feeFromAud: 2500,
  }),
  v({
    id: "590", subclass: "590", name: "Student Guardian", tools: [S],
    tags: tag(S, "goal", "guardian"),
    summary: "For a parent or relative to stay in Australia to support a student who is usually under 18.",
    highlights: ["Tied to the student's stay and age"],
    stay: "Tied to the student's stay and age", feeFromAud: 2500,
  }),
  v({
    id: "407", subclass: "407", name: "Training", tools: [S, W],
    tags: [...tag(S, "goal", "training"), ...WT("post_study")],
    summary: "For workplace-based training or professional development in Australia. Not for people who mainly want to work.",
    highlights: ["Up to 2 years", "Needs a training plan"],
    stay: "Up to 2 years", feeFromAud: 535,
  }),

  // ───────── WORK ─────────
  v({
    id: "cta", subclass: null, name: "Crew Travel Authority", tools: [W],
    tags: WT("crew"),
    summary: "Travel authority for air or sea crew arriving in Australia.",
    highlights: ["30 days, or 5 days for positioning crew"],
    stay: "30 days (5 days positioning crew)", feeFromAud: 0, feeNote: "Free",
  }),
  v({
    id: "988", subclass: "988", name: "Maritime Crew", tools: [W],
    tags: WT("crew"),
    summary: "For non-citizen maritime crew working on a vessel in Australian waters.",
    highlights: ["Valid while you are a crew member"],
    stay: "While a crew member", feeFromAud: 0, feeNote: "Free",
  }),
  ...([
    ["superyacht", "Superyacht Crew", ["crew"]],
    ["entertainment", "Entertainment", ["event"]],
    ["sporting", "Sporting", ["event"]],
    ["religious", "Religious Work", ["event"]],
    ["invited", "Invited Participant", ["event"]],
    ["special", "Special Program", ["event", "exchange"]],
    ["research", "Research", ["research"]],
    ["exchange", "Exchange Arrangements", ["exchange"]],
  ] as [string, string, string[]][]).map(([key, stream, types]) =>
    v({
      id: `408-${key}`, subclass: "408", name: "Temporary Activity", stream, tools: [W],
      tags: WT(...types),
      summary: `A temporary visa for the ${stream.toLowerCase()} activity stream.`,
      highlights: ["Short-term activity-based stay"],
      stay: "3 months to 2 years", feeFromAud: 535,
    })
  ),
  v({
    id: "188", subclass: "188", name: "Business Innovation and Investment (Provisional)", tools: [W],
    tags: WT("business"), status: "closed", statusNote: CLOSED_NOTE,
    summary: "A provisional visa for business owners and investors, with a pathway to the 888.",
    highlights: ["Listed on the official tool but reported closed"],
    stay: "Temporary", feeFromAud: 1505,
  }),
  v({
    id: "888", subclass: "888", name: "Business Innovation and Investment (Permanent)", tools: [W],
    tags: WT("business"),
    summary: "A permanent visa for provisional business and investor visa holders who meet requirements.",
    highlights: ["Permanent residence"],
    stay: "Permanent", feeFromAud: 4375,
  }),
  ...([
    ["domestic", "Domestic Worker (Diplomatic or Consular)", ["diplomatic"]],
    ["foreign-gov", "Foreign Government Agency", ["diplomatic"]],
    ["palm", "Pacific Australia Labour Mobility (PALM) scheme", ["palm"]],
    ["parent", "International Relations (parent listing)", ["diplomatic"]],
  ] as [string, string, string[]][]).map(([key, stream, types]) =>
    v({
      id: `403-${key}`, subclass: "403", name: "International Relations", stream, tools: [W],
      tags: WT(...types),
      summary: `For the ${stream} stream of the International Relations visa.`,
      highlights: ["Up to 4 years depending on stream"],
      stay: "Up to 4 years by stream", feeFromAud: 315, feeNote: "AUD315 to AUD470 depending on listing",
      guideUrl: EXTERNAL_LINKS.subclass403,
    })
  ),
  v({
    id: "485", subclass: "485", name: "Temporary Graduate", tools: [W],
    tags: WT("post_study"),
    summary: "For recent international graduates who want to live and work in Australia after study.",
    highlights: ["Graduate Work stream: 18 months", "Post-Study Work stream: 2 to 4 years"],
    stay: "18 months, or 2 to 4 years (post-study)", feeFromAud: 1680,
  }),
  v({
    id: "400", subclass: "400", name: "Short Stay Specialist", tools: [W],
    tags: [...WT("skilled"), ...tag(W, "stay", "short")],
    summary: "For short-term, highly specialised, non-ongoing work in Australia.",
    highlights: ["Up to 6 months"],
    stay: "Up to 6 months", feeFromAud: 535,
  }),
  v({
    id: "489", subclass: "489", name: "Skilled Regional (Provisional)", tools: [W],
    tags: [...WT("skilled"), ...tag(W, "stay", "medium")],
    status: "transitional", statusNote: CLOSED_NOTE,
    summary: "A provisional regional skilled visa listed on the official tool, reported replaced by the 491.",
    highlights: ["Regional pathway"],
    stay: "Up to 4 years", feeFromAud: 6140,
  }),
  v({
    id: "491", subclass: "491", name: "Skilled Work Regional (Provisional)", tools: [W],
    tags: [...WT("skilled"), ...tag(W, "stay", "medium")],
    summary: "A provisional visa for skilled workers nominated by a state or sponsored by an eligible relative to live in regional Australia.",
    highlights: ["Regional Australia", "State nomination availability varies"],
    stay: "Up to 5 years", feeFromAud: 6140, feeNote: "Check current state nomination status",
  }),
  v({
    id: "494", subclass: "494", name: "Skilled Employer Sponsored Regional (Provisional)", tools: [W],
    tags: [...WT("skilled"), ...tag(W, "stay", "medium")],
    summary: "A regional visa for skilled workers sponsored by an employer in regional Australia.",
    highlights: ["Employer sponsored", "Regional Australia"],
    stay: "5 years", feeFromAud: 6140, guideUrl: EXTERNAL_LINKS.subclass494,
  }),
  v({
    id: "482", subclass: "482", name: "Skills in Demand", tools: [W],
    tags: [...WT("skilled"), ...tag(W, "stay", "medium")],
    summary: "A temporary employer-sponsored visa for skilled workers.",
    highlights: ["Employer sponsored", "Up to 4 years"],
    stay: "Up to 4 years", feeFromAud: 4015, guideUrl: EXTERNAL_LINKS.skillsInDemand,
  }),
  v({
    id: "186", subclass: "186", name: "Employer Nomination Scheme", tools: [W],
    tags: [...WT("skilled"), ...tag(W, "stay", "permanent"), ...tag(W, "route", "sponsored")],
    summary: "A permanent visa for skilled workers nominated by their employer.",
    highlights: ["Permanent residence", "Employer nominated"],
    stay: "Permanent", feeFromAud: 6140, guideUrl: EXTERNAL_LINKS.subclass186,
  }),
  v({
    id: "187", subclass: "187", name: "Regional Sponsored Migration Scheme", tools: [W],
    tags: [...WT("skilled"), ...tag(W, "stay", "permanent"), ...tag(W, "route", "sponsored")],
    status: "transitional", statusNote: CLOSED_NOTE,
    summary: "A permanent regional employer-sponsored visa listed on the official tool, reported replaced by the 494 pathway.",
    highlights: ["Permanent residence", "Regional employer"],
    stay: "Permanent", feeFromAud: 6140,
  }),
  v({
    id: "190", subclass: "190", name: "Skilled Nominated", tools: [W],
    tags: [...WT("skilled"), ...tag(W, "stay", "permanent"), ...tag(W, "route", "sponsored")],
    summary: "A permanent points-tested visa for skilled workers nominated by a state or territory.",
    highlights: ["Permanent residence", "State or territory nomination"],
    stay: "Permanent", feeFromAud: 6140, guideUrl: EXTERNAL_LINKS.subclass190,
  }),
  v({
    id: "189", subclass: "189", name: "Skilled Independent", tools: [W],
    tags: [...WT("skilled"), ...tag(W, "stay", "permanent"), ...tag(W, "route", "independent")],
    summary: "A permanent points-tested visa for skilled workers without a sponsor.",
    highlights: ["Permanent residence", "No employer or state sponsor"],
    stay: "Permanent", feeFromAud: 6135, guideUrl: EXTERNAL_LINKS.subclass189,
  }),
  v({
    id: "124", subclass: "124", name: "Distinguished Talent", tools: [W],
    tags: [...WT("skilled"), ...tag(W, "stay", "permanent"), ...tag(W, "route", "independent")],
    summary: "A permanent visa for people with an exceptional and outstanding record of achievement.",
    highlights: ["Permanent residence", "Internationally recognised achievement"],
    stay: "Permanent", feeFromAud: 0, feeNote: "Nil",
  }),
  v({
    id: "858", subclass: "858", name: "National Innovation", tools: [W],
    tags: [...WT("skilled"), ...tag(W, "stay", "permanent"), ...tag(W, "route", "independent")],
    summary: "A permanent visa for people with internationally recognised achievements in targeted fields.",
    highlights: ["Permanent residence"],
    stay: "Permanent", feeFromAud: 6235,
  }),
  // PRD open question #3: 887 has no stay/route tags, so it only shows under "all skilled".
  v({
    id: "887", subclass: "887", name: "Skilled Regional", tools: [W],
    tags: WT("skilled"),
    summary: "A permanent visa for eligible holders of certain regional provisional visas.",
    highlights: ["Permanent residence", "Requires prior regional visa"],
    stay: "Permanent", feeFromAud: 630,
  }),

  // ───────── JOIN FAMILY + PR PATHWAY (see family-pr-visas.ts) ─────────
  ...FAMILY_PR_VISAS,
];
