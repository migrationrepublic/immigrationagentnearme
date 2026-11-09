export type ToolId = "visit" | "study" | "work" | "family" | "pr";
export type VisaStatus = "open" | "restricted" | "closed" | "transitional";
export type AgeBand = "under18" | "18_30" | "31_35" | "over35";

/** Answers keyed by question id. Passport holds a country name. */
export type Answers = Record<string, string | undefined>;

export interface VisaOption {
  id: string;
  subclass: string | null;
  name: string;
  stream?: string;
  /** Small label above the name. Defaults to "Subclass X" (or "Authority" when no subclass). */
  kicker?: string;
  tools: ToolId[];
  /** Match tags, format `${tool}.${questionId}:${value}` */
  tags: string[];
  summary: string;
  highlights: string[];
  stay: string;
  feeFromAud: number | null;
  feeNote?: string;
  location: "onshore" | "offshore" | "either";
  status: VisaStatus;
  statusNote?: string;
  passportRule?: { mode: "only" | "exclude"; countries: string[] };
  /** true when the passport list still needs the agent to confirm it */
  passportListUnverified?: boolean;
  ageRule?: { min?: number; max?: number; note?: string };
  /** false for ETA: drives the CTA */
  agentCanAssist: boolean;
  guideUrl?: string;
  officialUrl: string;
  /** Internal link to another tool, carrying some answers across (e.g. PR → Join Family) */
  relatedTool?: { href: string; label: string; carry?: string[] };
  /** Group key so 2nd/3rd working holiday cards fold under the first */
  foldUnder?: string;
  lastReviewed: string;
  reviewedBy: string;
}

export interface QuestionOption {
  value: string;
  label: string;
  help: string;
}

export interface Question {
  id: string;
  label: string;
  type: "single" | "country";
  options?: QuestionOption[];
  /** If true the answer narrows results via tags. If false it is for lead qualification / notes only. */
  filters: boolean;
  /** Ask even when the answer would not change results (lead qualification). */
  alwaysAsk?: boolean;
  showIf?: (answers: Answers) => boolean;
}

export interface ResultBanner {
  tone: "warning" | "info";
  title: string;
  text: string;
  link?: { href: string; label: string };
}

export interface ToolConfig {
  id: ToolId;
  title: string;
  leadName: string;
  questions: Question[];
  /** Line under each question. Defaults to the traveller wording. */
  helperText?: string;
  /** Prominent notice above the results (e.g. "No Further Stay" warning). */
  resultBanner?: (answers: Answers) => ResultBanner | null;
  /** Hide the consultation form (e.g. humanitarian results: no sales push). */
  hideLeadForm?: (answers: Answers) => boolean;
}
