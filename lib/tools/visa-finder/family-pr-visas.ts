import { EXTERNAL_LINKS } from "@/lib/links";
import { CATALOGUE_REVIEWED_ON, CATALOGUE_REVIEWED_BY } from "./config";
import type { ToolId, VisaOption } from "./types";

/**
 * Join Family Visa Finder + PR Pathway Explorer catalogue.
 * VERIFY: every record must be confirmed against the official Home Affairs
 * visa listing by the registered agent before launch (see config.ts).
 * Fees are not hard-coded here: family/PR charges vary widely by stream and
 * stage, so cards point users to the official Visa Pricing Estimator.
 */

const LISTING = "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing";
const HUMANITARIAN = "https://immi.homeaffairs.gov.au/what-we-do/refugee-and-humanitarian-program";

const tag = (tool: ToolId, q: string, ...values: string[]) => values.map((x) => `${tool}.${q}:${x}`);

type Input = Partial<VisaOption> & Pick<VisaOption, "id" | "subclass" | "name" | "tools" | "summary" | "stay">;

function v(p: Input): VisaOption {
  return {
    tags: [],
    highlights: [],
    location: "either",
    status: "open",
    agentCanAssist: true,
    officialUrl: LISTING,
    feeFromAud: null,
    feeNote: "See Visa Pricing Estimator",
    lastReviewed: CATALOGUE_REVIEWED_ON,
    reviewedBy: CATALOGUE_REVIEWED_BY,
    ...p,
  };
}

const F: ToolId = "family";
const PR: ToolId = "pr";

// ── Family tag helpers ──
const reason = (...x: string[]) => tag(F, "reason", ...x);
const stay = (...x: string[]) => tag(F, "stay", ...x);
const rel = (...x: string[]) => tag(F, "relationship", ...x);
/** Location tags derived from where you can apply. */
const loc = (where: "onshore" | "offshore" | "either") =>
  where === "either" ? tag(F, "location", "onshore", "offshore") : tag(F, "location", where);

const QUEUED_NOTE =
  "Capped and queued: waiting times can be many years, and some of these visas may close to new applicants. Confirm the current status with a registered agent.";

/** Shared visitor option so every family reason has a temporary pathway. */
const familyVisitor = v({
  id: "600-family-visit", subclass: "600", name: "Visitor", stream: "Visit family (short stay)", tools: [F],
  tags: [...reason("child", "parents", "other_family", "carer"), ...stay("temporary"), ...loc("either")],
  summary: "A short-stay visa to visit or support family in Australia. It does not allow you to settle permanently.",
  highlights: ["Short stays, usually up to 3, 6 or 12 months", "No work rights", "Can be a first step while you plan a longer-term option"],
  stay: "3, 6 or 12 months", feeFromAud: 250, feeNote: undefined,
});

// ── PR tag helpers ──
const goal = (...x: string[]) => tag(PR, "goal", ...x, "not_sure");
const route = (...x: string[]) => tag(PR, "route", ...x);

export const FAMILY_PR_VISAS: VisaOption[] = [
  // ───────── JOIN FAMILY: partner ─────────
  v({
    id: "820-801", subclass: "820", kicker: "Subclass 820 / 801", name: "Partner", stream: "Apply in Australia", tools: [F],
    tags: [...reason("partner"), ...stay("temporary", "permanent"), ...rel("married_defacto"), ...loc("onshore")],
    location: "onshore",
    summary: "For the married or de facto partner of an Australian citizen, permanent resident or eligible New Zealand citizen, applying while in Australia. You apply once for the temporary (820) and permanent (801) stages.",
    highlights: ["Temporary visa first, then permanent", "Work and study rights while you wait", "Relationship must be genuine and continuing"],
    stay: "Temporary, then permanent", guideUrl: EXTERNAL_LINKS.subclass820_801,
  }),
  v({
    id: "309-100", subclass: "309", kicker: "Subclass 309 / 100", name: "Partner", stream: "Apply outside Australia", tools: [F],
    tags: [...reason("partner"), ...stay("temporary", "permanent"), ...rel("married_defacto"), ...loc("offshore")],
    location: "offshore",
    summary: "For the married or de facto partner of an Australian citizen, permanent resident or eligible New Zealand citizen, applying from outside Australia. One application covers the provisional (309) and permanent (100) stages.",
    highlights: ["Provisional visa first, then permanent", "Can travel to Australia once the 309 is granted", "Relationship must be genuine and continuing"],
    stay: "Provisional, then permanent", guideUrl: EXTERNAL_LINKS.partner309,
  }),
  v({
    id: "300", subclass: "300", name: "Prospective Marriage", tools: [F],
    tags: [...reason("partner"), ...stay("temporary", "permanent"), ...rel("engaged"), ...loc("offshore")],
    location: "offshore",
    summary: "For people engaged to an Australian citizen, permanent resident or eligible New Zealand citizen who plan to marry in Australia, then apply for a partner visa.",
    highlights: ["Marry within the visa period (9 to 15 months)", "Apply from outside Australia", "Leads to the onshore partner visa"],
    stay: "9 to 15 months, then partner visa", guideUrl: EXTERNAL_LINKS.subclass300,
  }),

  // ───────── JOIN FAMILY: join my child (parent visas) ─────────
  v({
    id: "103", subclass: "103", name: "Parent", tools: [F],
    tags: [...reason("child"), ...stay("permanent"), ...loc("either")],
    summary: "A permanent visa for parents of a settled Australian citizen, permanent resident or eligible New Zealand citizen, with a lower application charge.",
    highlights: ["Permanent residence", "Balance of family test applies", "Lower charge but very long queue"],
    stay: "Permanent", status: "restricted", statusNote: QUEUED_NOTE,
  }),
  v({
    id: "143", subclass: "143", name: "Contributory Parent", tools: [F],
    tags: [...reason("child"), ...stay("permanent"), ...loc("either")],
    summary: "A permanent visa for parents of a settled Australian citizen, permanent resident or eligible New Zealand citizen. Higher charges, generally shorter waits than the Parent visa.",
    highlights: ["Permanent residence", "Balance of family test applies", "Higher second instalment charge"],
    stay: "Permanent", status: "restricted", statusNote: QUEUED_NOTE,
  }),
  v({
    id: "173", subclass: "173", name: "Contributory Parent (Temporary)", tools: [F],
    tags: [...reason("child"), ...stay("temporary"), ...loc("either")],
    summary: "A 2-year temporary visa that lets parents spread the cost of the Contributory Parent visa before applying for the permanent 143.",
    highlights: ["Stay up to 2 years", "Can later apply for the permanent 143", "Balance of family test applies"],
    stay: "Up to 2 years", status: "restricted", statusNote: QUEUED_NOTE,
  }),
  v({
    id: "804", subclass: "804", name: "Aged Parent", tools: [F],
    tags: [...reason("child"), ...stay("permanent"), ...loc("onshore")],
    location: "onshore",
    summary: "A permanent visa for parents old enough for the Australian age pension who are in Australia when they apply.",
    highlights: ["Permanent residence", "Must be in Australia to apply", "Must meet the age pension age"],
    stay: "Permanent", status: "restricted", statusNote: QUEUED_NOTE, guideUrl: EXTERNAL_LINKS.agedParent804,
  }),
  v({
    id: "864", subclass: "864", name: "Contributory Aged Parent", tools: [F],
    tags: [...reason("child"), ...stay("permanent"), ...loc("onshore")],
    location: "onshore",
    summary: "A permanent visa for parents of age pension age, applying in Australia, with higher charges and generally shorter waits than the Aged Parent visa.",
    highlights: ["Permanent residence", "Must be in Australia to apply", "Higher second instalment charge"],
    stay: "Permanent", status: "restricted", statusNote: QUEUED_NOTE,
  }),
  v({
    id: "884", subclass: "884", name: "Contributory Aged Parent (Temporary)", tools: [F],
    tags: [...reason("child"), ...stay("temporary"), ...loc("onshore")],
    location: "onshore",
    summary: "A 2-year temporary visa for aged parents in Australia, as a step towards the permanent 864.",
    highlights: ["Stay up to 2 years", "Must be in Australia to apply", "Can later apply for the permanent 864"],
    stay: "Up to 2 years", status: "restricted", statusNote: QUEUED_NOTE,
  }),
  v({
    id: "870", subclass: "870", name: "Sponsored Parent (Temporary)", tools: [F],
    tags: [...reason("child"), ...stay("temporary"), ...loc("offshore")],
    location: "offshore",
    summary: "Lets parents visit their children in Australia for longer periods without needing the balance of family test. Your child must first be approved as a sponsor.",
    highlights: ["Stay 3 or 5 years per visa", "No work rights", "Child must be an approved parent sponsor"],
    stay: "3 or 5 years", guideUrl: EXTERNAL_LINKS.subclass870,
  }),

  // ───────── JOIN FAMILY: live with my parents (child visas) ─────────
  v({
    id: "101", subclass: "101", name: "Child", stream: "Apply outside Australia", tools: [F],
    tags: [...reason("parents"), ...stay("permanent"), ...loc("offshore")],
    location: "offshore",
    summary: "A permanent visa for a dependent child of an Australian citizen, permanent resident or eligible New Zealand citizen, applying from outside Australia.",
    highlights: ["Permanent residence", "Child must be dependent and generally under 25", "Apply from outside Australia"],
    stay: "Permanent",
  }),
  v({
    id: "802", subclass: "802", name: "Child", stream: "Apply in Australia", tools: [F],
    tags: [...reason("parents"), ...stay("permanent"), ...loc("onshore")],
    location: "onshore",
    summary: "A permanent visa for a dependent child of an Australian citizen, permanent resident or eligible New Zealand citizen, applying in Australia.",
    highlights: ["Permanent residence", "Child must be dependent and generally under 25", "Apply in Australia"],
    stay: "Permanent",
  }),
  v({
    id: "102", subclass: "102", name: "Adoption", tools: [F],
    tags: [...reason("parents"), ...stay("permanent"), ...loc("offshore")],
    location: "offshore",
    summary: "A permanent visa for a child under 18 adopted, or being adopted, by an Australian citizen, permanent resident or eligible New Zealand citizen.",
    highlights: ["Permanent residence", "Child must be under 18", "Adoption rules are strict and vary by country"],
    stay: "Permanent",
  }),
  v({
    id: "445", subclass: "445", name: "Dependent Child", tools: [F],
    tags: [...reason("parents"), ...stay("temporary"), ...loc("either")],
    summary: "A temporary visa for the dependent child of a parent who holds a temporary partner visa, so the child can join them while the partner visa is processed.",
    highlights: ["Temporary stay with your parent", "Parent must hold a temporary partner visa", "Can lead to permanent residence with the parent"],
    stay: "Temporary",
  }),

  // ───────── JOIN FAMILY: other family ─────────
  v({
    id: "115", subclass: "115", name: "Remaining Relative", stream: "Apply outside Australia", tools: [F],
    tags: [...reason("other_family"), ...stay("permanent"), ...loc("offshore")],
    location: "offshore",
    summary: "For people whose only near relatives are a sibling, parent or child living in Australia as a citizen, permanent resident or eligible New Zealand citizen.",
    highlights: ["Permanent residence", "Your only near relatives must be in Australia"],
    stay: "Permanent", status: "restricted", statusNote: QUEUED_NOTE,
  }),
  v({
    id: "835", subclass: "835", name: "Remaining Relative", stream: "Apply in Australia", tools: [F],
    tags: [...reason("other_family"), ...stay("permanent"), ...loc("onshore")],
    location: "onshore",
    summary: "The in-Australia version of the Remaining Relative visa.",
    highlights: ["Permanent residence", "Your only near relatives must be in Australia"],
    stay: "Permanent", status: "restricted", statusNote: QUEUED_NOTE,
  }),
  v({
    id: "114", subclass: "114", name: "Aged Dependent Relative", stream: "Apply outside Australia", tools: [F],
    tags: [...reason("other_family"), ...stay("permanent"), ...loc("offshore")],
    location: "offshore",
    summary: "For older, single relatives who depend financially on a relative who is an Australian citizen, permanent resident or eligible New Zealand citizen.",
    highlights: ["Permanent residence", "Must be old enough for the age pension", "Must be financially dependent on your sponsor"],
    stay: "Permanent", status: "restricted", statusNote: QUEUED_NOTE,
  }),
  v({
    id: "838", subclass: "838", name: "Aged Dependent Relative", stream: "Apply in Australia", tools: [F],
    tags: [...reason("other_family"), ...stay("permanent"), ...loc("onshore")],
    location: "onshore",
    summary: "The in-Australia version of the Aged Dependent Relative visa.",
    highlights: ["Permanent residence", "Must be old enough for the age pension", "Must be financially dependent on your sponsor"],
    stay: "Permanent", status: "restricted", statusNote: QUEUED_NOTE,
  }),
  v({
    id: "117", subclass: "117", name: "Orphan Relative", stream: "Apply outside Australia", tools: [F],
    tags: [...reason("other_family"), ...stay("permanent"), ...loc("offshore")],
    location: "offshore",
    summary: "For a child under 18 who cannot be cared for by their parents and has a relative in Australia who can look after them.",
    highlights: ["Permanent residence", "Child must be under 18", "Sponsor must be a relative in Australia"],
    stay: "Permanent",
  }),
  v({
    id: "837", subclass: "837", name: "Orphan Relative", stream: "Apply in Australia", tools: [F],
    tags: [...reason("other_family"), ...stay("permanent"), ...loc("onshore")],
    location: "onshore",
    summary: "The in-Australia version of the Orphan Relative visa.",
    highlights: ["Permanent residence", "Child must be under 18", "Sponsor must be a relative in Australia"],
    stay: "Permanent",
  }),

  // ───────── JOIN FAMILY: care for a sick relative ─────────
  v({
    id: "116", subclass: "116", name: "Carer", stream: "Apply outside Australia", tools: [F],
    tags: [...reason("carer"), ...stay("permanent"), ...loc("offshore")],
    location: "offshore",
    summary: "For people who will provide long-term care to a relative in Australia with a medical condition that their family cannot meet another way.",
    highlights: ["Permanent residence", "The need for care must be assessed medically", "Care must be ongoing"],
    stay: "Permanent", status: "restricted", statusNote: QUEUED_NOTE,
  }),
  v({
    id: "836", subclass: "836", name: "Carer", stream: "Apply in Australia", tools: [F],
    tags: [...reason("carer"), ...stay("permanent"), ...loc("onshore")],
    location: "onshore",
    summary: "The in-Australia version of the Carer visa.",
    highlights: ["Permanent residence", "The need for care must be assessed medically", "Care must be ongoing"],
    stay: "Permanent", status: "restricted", statusNote: QUEUED_NOTE,
  }),

  familyVisitor,

  // ───────── PR PATHWAY EXPLORER ─────────
  v({
    id: "pr-family", subclass: null, kicker: "Pathway", name: "Family-stream permanent visas", tools: [PR],
    tags: goal("family"),
    summary: "Partners, children, parents and some other relatives of Australian citizens, permanent residents or eligible New Zealand citizens may have a permanent pathway.",
    highlights: ["Partner, child, parent and other relative visas", "Usually needs an eligible family sponsor", "Some visas start with a temporary stage"],
    stay: "Permanent (some via a temporary stage)",
    relatedTool: { href: "/tools/join-family-visa-finder", label: "Find family visas", carry: ["location"] },
  }),
  v({
    id: "pr-186", subclass: "186", name: "Employer Nomination Scheme", tools: [PR],
    tags: [...goal("skills"), ...route("employer")],
    summary: "A permanent visa for skilled workers nominated by an approved Australian employer.",
    highlights: ["Permanent residence", "Employer nomination needed", "Skills, English and age requirements apply"],
    stay: "Permanent", guideUrl: EXTERNAL_LINKS.subclass186,
  }),
  v({
    id: "pr-494", subclass: "494", kicker: "Subclass 494 → 191", name: "Skilled Employer Sponsored Regional", tools: [PR],
    tags: [...goal("skills"), ...route("employer")],
    summary: "A provisional visa for skilled workers sponsored by a regional employer. After living and working regionally, holders may apply for the permanent 191.",
    highlights: ["Provisional, then permanent (191)", "Live and work in regional Australia", "Regional employer sponsorship needed"],
    stay: "5 years, then permanent", guideUrl: EXTERNAL_LINKS.subclass494,
  }),
  v({
    id: "pr-190", subclass: "190", name: "Skilled Nominated", tools: [PR],
    tags: [...goal("skills"), ...route("state")],
    summary: "A permanent, points-tested visa for skilled workers nominated by an Australian state or territory government.",
    highlights: ["Permanent residence", "State or territory nomination needed", "Points-tested, invitation only"],
    stay: "Permanent", guideUrl: EXTERNAL_LINKS.subclass190,
  }),
  v({
    id: "pr-491", subclass: "491", kicker: "Subclass 491 → 191", name: "Skilled Work Regional (Provisional)", tools: [PR],
    tags: [...goal("skills"), ...route("state")],
    summary: "A provisional, points-tested visa for skilled workers nominated by a state or territory, or sponsored by an eligible relative in a regional area. It can lead to the permanent 191.",
    highlights: ["Provisional, then permanent (191)", "Live and work in regional Australia", "Points-tested, invitation only"],
    stay: "5 years, then permanent",
  }),
  v({
    id: "pr-189", subclass: "189", name: "Skilled Independent", tools: [PR],
    tags: [...goal("skills"), ...route("independent")],
    summary: "A permanent, points-tested visa for skilled workers who are not sponsored by an employer, state or family member.",
    highlights: ["Permanent residence", "No sponsor needed", "Points-tested, invitation only"],
    stay: "Permanent", guideUrl: EXTERNAL_LINKS.subclass189,
  }),
  v({
    id: "pr-858", subclass: "858", name: "National Innovation", tools: [PR],
    tags: goal("talent"),
    summary: "A permanent visa for people with an internationally recognised record of exceptional achievement in a targeted field. You need an invitation to apply.",
    highlights: ["Permanent residence", "By invitation only", "Exceptional, internationally recognised achievement"],
    stay: "Permanent",
    statusNote: "Invitation only: you must first lodge an Expression of Interest and be invited.",
  }),
  v({
    id: "pr-humanitarian", subclass: null, kicker: "Program", name: "Refugee and Humanitarian Program", tools: [PR],
    tags: goal("humanitarian"),
    summary: "Australia offers protection to people who are refugees or at risk of serious harm. Please use official information and support services for your situation.",
    highlights: ["Protection and resettlement pathways", "Free support services are available"],
    stay: "Varies", feeNote: "Varies",
    agentCanAssist: false, officialUrl: HUMANITARIAN,
  }),
  v({
    id: "pr-retirement", subclass: null, kicker: "Pathway", name: "Retirement visa pathway", tools: [PR],
    tags: goal("retirement"),
    summary: "A permanent pathway for long-term holders of the Retirement (405) or Investor Retirement (410) visas. Eligibility is narrow.",
    highlights: ["For existing 405 or 410 visa holders only", "Permanent residence", "Not open to new retirees"],
    stay: "Permanent",
  }),
  v({
    id: "pr-192", subclass: "192", name: "Pacific Engagement", tools: [PR],
    tags: goal("pacific"),
    summary: "A permanent visa for citizens of eligible Pacific Island countries and Timor-Leste, selected through an annual ballot.",
    highlights: ["Permanent residence", "Selected by ballot", "Eligible Pacific countries and Timor-Leste only"],
    stay: "Permanent",
    statusNote: "Places are allocated through a ballot. You must be selected before you can apply.",
  }),
  v({
    id: "pr-151", subclass: "151", name: "Former Resident", tools: [PR],
    tags: goal("returning"),
    summary: "A permanent visa for some former Australian permanent residents, including those with long past residence or Australian Defence Force service.",
    highlights: ["Permanent residence", "For people who previously lived in Australia", "Close ties to Australia needed"],
    stay: "Permanent",
  }),
  v({
    id: "pr-155", subclass: "155", kicker: "Subclass 155 / 157", name: "Resident Return", tools: [PR],
    tags: goal("returning"),
    summary: "For current or former permanent residents whose travel facility has expired and who want to keep returning to Australia as a permanent resident.",
    highlights: ["Keeps your permanent resident status for travel", "For current or former Australian PRs", "Residence or ties tests apply"],
    stay: "Up to 5 years travel facility",
  }),
];
