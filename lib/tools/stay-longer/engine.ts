/**
 * Stay Longer Planner: pure triage logic (no React), so it can be unit-tested.
 * General information only — wording reviewed by the registered agent (VERIFY).
 */

export const STAY_LONGER_REVIEWED_ON = "2026-11-09";

/** Config-driven urgent contact (AC3.3). */
export const URGENT_CONTACT = {
  phoneDisplay: "+61 435 321 219",
  phoneHref: "tel:+61435321219",
  whatsappHref: "https://wa.me/61435321219",
};

/** Official sources (checked live 2026-11-09; IOM/DFAT block automated checks but are linked by Home Affairs). */
const HA = "https://immi.homeaffairs.gov.au";
export const OFFICIAL_LINKS = {
  vevo: `${HA}/visas/already-have-a-visa/check-visa-details-and-conditions/check-conditions-online/visa-holders`,
  visaConditions: `${HA}/visas/already-have-a-visa/check-visa-details-and-conditions/see-your-visa-conditions`,
  checkEta: `${HA}/visas/getting-a-visa/visa-listing/electronic-travel-authority-601#HowTo`,
  stayLonger: `${HA}/visas/visa-about-to-expire/stay-longer`,
  noValidVisa: `${HA}/visas/visa-about-to-expire/if-you-dont-have-a-valid-visa`,
  bridgingA: `${HA}/visas/getting-a-visa/visa-listing/bridging-visa-a-010`,
  bridgingB: `${HA}/visas/getting-a-visa/visa-listing/bridging-visa-b-020`,
  iom: "https://australia.iom.int/",
  embassies: "https://www.dfat.gov.au/about-us/foreign-embassies/pages/foreign-embassies-and-consulates-in-australia",
};

export const COMMON_VISAS = [
  { value: "visitor", label: "Visitor (600), eVisitor (651) or ETA (601)" },
  { value: "student", label: "Student (500)" },
  { value: "graduate", label: "Temporary Graduate (485)" },
  { value: "whm", label: "Working Holiday (417) or Work and Holiday (462)" },
  { value: "skilled_temp", label: "Skills in Demand / Temporary Skill Shortage (482)" },
  { value: "regional_prov", label: "Regional provisional (491 or 494)" },
  { value: "partner_temp", label: "Partner (820 or 309)" },
  { value: "bridging", label: "A bridging visa" },
  { value: "other", label: "Another visa" },
  { value: "unsure", label: "I'm not sure" },
] as const;

export type YesNo = "yes" | "no";
export type YesNoUnsure = YesNo | "unsure";

export interface StayLongerAnswers {
  visa?: string;
  /** YYYY-MM-DD, or undefined when the user doesn't know */
  expiry?: string;
  nfs?: YesNoUnsure;
  lodged?: YesNo;
  travel?: YesNo;
}

/**
 * A: cannot apply onshore (No Further Stay)
 * B: can apply before expiry
 * C: applied, waiting (bridging visa)
 * D: visa expired
 */
export type Situation = "A" | "B" | "C" | "D";
export type Urgency = "ok" | "soon" | "urgent" | "unknown";

export interface StayLongerResult {
  situation: Situation;
  /** Whole days until expiry (0 = expires today, negative = expired). null if unknown. */
  daysLeft: number | null;
  urgency: Urgency;
  showBridgingTravelWarning: boolean;
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parse YYYY-MM-DD as a date-only value (UTC midnight) so time zones never shift the day. */
export function parseDateOnly(value?: string): number | null {
  const m = value ? DATE_RE.exec(value) : null;
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = Date.UTC(y, mo - 1, d);
  const check = new Date(t);
  // Reject impossible dates like 2026-02-31
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) return null;
  return t;
}

/** Today's calendar date in the user's own timezone, as a date-only value. */
export function todayDateOnly(now: Date = new Date()): number {
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
}

export function daysUntil(expiry: string | undefined, today: number = todayDateOnly()): number | null {
  const t = parseDateOnly(expiry);
  if (t === null) return null;
  return Math.round((t - today) / 86_400_000);
}

export function urgencyFor(daysLeft: number | null): Urgency {
  if (daysLeft === null) return "unknown";
  if (daysLeft < 30) return "urgent";
  if (daysLeft <= 90) return "soon";
  return "ok";
}

export function evaluateStayLonger(a: StayLongerAnswers, today: number = todayDateOnly()): StayLongerResult {
  const daysLeft = daysUntil(a.expiry, today);
  const expired = daysLeft !== null && daysLeft < 0;

  let situation: Situation;
  if (a.lodged === "yes") situation = "C";
  else if (expired) situation = "D";
  else if (a.nfs === "yes") situation = "A";
  else situation = "B";

  return {
    situation,
    daysLeft,
    urgency: situation === "D" ? "urgent" : urgencyFor(daysLeft),
    showBridgingTravelWarning: a.travel === "yes" && (situation === "B" || situation === "C"),
  };
}

export interface SituationContent {
  title: string;
  summary: string;
  steps: string[];
  tone: "info" | "warning" | "danger" | "success";
}

export function getSituationContent(r: StayLongerResult, a: StayLongerAnswers): SituationContent {
  switch (r.situation) {
    case "A":
      return {
        tone: "warning",
        title: "You generally can't apply for a new visa in Australia",
        summary:
          "Your visa has a 'No Further Stay' condition. This usually means you cannot apply for most other visas while you are in Australia, and you need to leave before your visa expires. You can apply for other visas after you leave. In limited cases the condition can be waived.",
        steps: [
          "Confirm the condition in VEVO or on your grant letter (for example 8503, 8534 or 8535).",
          "Plan to leave Australia before your visa expires.",
          "Talk to a registered migration agent early about whether a waiver may be possible, and about applying from outside Australia.",
          "Explore the options you could apply for after leaving, using the PR Pathway Explorer or Join Family Visa Finder.",
        ],
      };
    case "B":
      return {
        tone: r.urgency === "urgent" ? "danger" : "info",
        title: r.daysLeft === null ? "You may be able to apply for a new visa before yours expires" : "You can still act before your visa expires",
        summary:
          "If your visa has no condition stopping you, you can usually apply for a new visa while in Australia. Lodging a valid application before your current visa expires usually gives you a Bridging visa A (BVA), which lets you stay lawfully while it is processed.",
        steps: [
          ...(r.daysLeft === null ? ["Find your exact expiry date in VEVO, the myVEVO app or your visa grant letter."] : []),
          ...(a.nfs === "unsure" ? ["Check your visa conditions in VEVO. A 'No Further Stay' condition would stop you applying in Australia."] : []),
          "Work out which visa fits your plans. Our PR Pathway Explorer and Join Family Visa Finder can help you see your options.",
          "Prepare your documents early. Some visas need tests, skills assessments or health checks that take time.",
          "Lodge your new visa application before your current visa expires.",
          "Expect a Bridging visa A, which usually keeps you lawful until a decision is made.",
        ],
      };
    case "C":
      return {
        tone: "success",
        title: "You've applied: a bridging visa usually keeps you lawful",
        summary:
          "If you lodged a valid application before your previous visa expired, you have usually been granted a Bridging visa A (BVA). It generally lets you stay in Australia lawfully after your old visa ends, until a decision is made.",
        steps: [
          "Check in VEVO that a bridging visa has been granted and note its conditions.",
          ...(r.daysLeft !== null && r.daysLeft < 0
            ? ["Your previous visa has expired. If you lodged after it expired, you may not hold a bridging visa. Check VEVO now and get advice urgently."]
            : []),
          "Don't leave Australia on a Bridging visa A: it ends when you depart.",
          "If you need to travel, apply for a Bridging visa B (BVB) after your BVA is granted, and before you leave.",
          "Respond quickly to any requests for information from the Department.",
        ],
      };
    case "D":
      return {
        tone: "danger",
        title: "Your visa appears to have expired",
        summary:
          "If you don't hold a valid visa, you are unlawful in Australia and are expected to leave. You may be detained and removed, and it can affect future visa applications. Your options are limited, so please get help now.",
        steps: [
          "Check VEVO straight away to confirm your current visa status. You may still hold a bridging visa.",
          "Contact a registered migration agent urgently about your options.",
          "Your embassy or high commission can help with travel documents if you need to leave.",
          "Free help to return home may be available through the Homeward Return Program and the International Organization for Migration (IOM).",
        ],
      };
  }
}

/** Readable answers for the lead email / admin panel. */
export function describeStayLongerAnswers(a: StayLongerAnswers): Record<string, string> {
  const yn = (x?: string) => (x === "yes" ? "Yes" : x === "no" ? "No" : x === "unsure" ? "Not sure" : "Not answered");
  return {
    "Current visa": COMMON_VISAS.find((v) => v.value === a.visa)?.label ?? "Not answered",
    "Expiry date": a.expiry ?? "Not sure",
    "No Further Stay condition": yn(a.nfs),
    "New application lodged": yn(a.lodged),
    "Plans to travel while waiting": yn(a.travel),
  };
}
