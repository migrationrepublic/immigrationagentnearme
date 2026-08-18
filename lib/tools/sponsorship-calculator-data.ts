/**
 * Sponsorship Calculators Data and Helper Functions
 * Implements the exact statutory logic, fee matrices, diagnostics, and wording from sponsorship-calculators_3.html
 */

export interface FeeConfig {
  nomination: number;
  saf: { small: number; large: number };
  safPerYear: boolean;
  vacPrimary: number;
  vacAdult: number;
  vacChild: number;
  name: string;
  subclassNumber: string;
  description: string;
}

// Config object for government charges (current as verified in July 2026)
export const FEES: Record<'482' | '186' | '494', FeeConfig> = {
  '482': {
    nomination: 330,
    saf: { small: 1200, large: 1800 },
    safPerYear: true,
    vacPrimary: 4015,
    vacAdult: 4015,
    vacChild: 1005,
    name: '482 — Skills in Demand',
    subclassNumber: '482',
    description: 'Temporary employer-sponsored visa for up to 4 years. SAF levy charged per year.',
  },
  '186': {
    nomination: 540,
    saf: { small: 3000, large: 5000 },
    safPerYear: false,
    vacPrimary: 6140,
    vacAdult: 3070,
    vacChild: 1535,
    name: '186 — Employer Nomination Scheme',
    subclassNumber: '186',
    description: 'Direct Permanent Residency pathway. One-off flat SAF levy.',
  },
  '494': {
    nomination: 0,
    saf: { small: 3000, large: 5000 },
    safPerYear: false,
    vacPrimary: 6140,
    vacAdult: 3070,
    vacChild: 1535,
    name: '494 — Regional',
    subclassNumber: '494',
    description: 'Provisional regional visa with pathway to PR. Nil nomination fee.',
  },
};

export const CSIT = 79499; // Core Skills Income Threshold (AUD)

export const INDUSTRIES = [
  'Trades & Construction',
  'Health & Medical',
  'Aged & Disability Care',
  'Hospitality & Food',
  'Childcare & Early Learning',
  'Agriculture',
  'Other',
];

export const REGIONS = [
  { value: 'metro', label: 'Metro / other area', isRegional: false },
  { value: 'regional-wa', label: 'Regional WA', isRegional: true },
  { value: 'regional-qld', label: 'Regional QLD', isRegional: true },
  { value: 'regional-sa', label: 'Regional SA', isRegional: true },
  { value: 'regional-vic', label: 'Regional VIC', isRegional: true },
  { value: 'regional-nsw', label: 'Regional NSW', isRegional: true },
  { value: 'regional-nt', label: 'Regional NT', isRegional: true },
  { value: 'unsure', label: 'Not sure', isRegional: false },
];

export interface CostCalculationInput {
  visa: '482' | '186' | '494';
  turnover: 'small' | 'large';
  workers: number;
  years?: number; // 1, 2, 3, or 4 for 482
  adults: number;
  children: number;
}

export interface CostCalculationBreakdown {
  nominationFeeRate: number;
  nominationTotal: number;
  safRate: number;
  safTotal: number;
  vacPrimaryRate: number;
  vacPrimaryTotal: number;
  vacAdultRate: number;
  vacChildRate: number;
  vacFamilyTotal: number;
  grandTotal: number;
  visaLabel: string;
  yearsNote: string;
  waiverNote: string;
}

export function calculateSponsorshipCosts(input: CostCalculationInput): CostCalculationBreakdown {
  const visa = input.visa || '482';
  const turnover = input.turnover || 'small';
  const workers = Math.max(1, input.workers || 1);
  const adults = Math.max(0, input.adults || 0);
  const children = Math.max(0, input.children || 0);
  const years = visa === '482' ? (input.years || 4) : 1;

  const f = FEES[visa];
  const safRate = turnover === 'large' ? f.saf.large : f.saf.small;
  const safPerWorker = f.safPerYear ? safRate * years : safRate;

  const nominationTotal = f.nomination * workers;
  const safTotal = safPerWorker * workers;
  const vacPrimaryTotal = f.vacPrimary * workers;
  const vacFamilyTotal = (adults * f.vacAdult) + (children * f.vacChild);

  const grandTotal = nominationTotal + safTotal + vacPrimaryTotal + vacFamilyTotal;

  const visaLabel = {
    '482': '482 — Skills in Demand',
    '186': '186 — Employer Nomination Scheme',
    '494': '494 — Regional'
  }[visa];

  const yearsNote = visa === '482' ? ` (SAF levy calculated over ${years} year${years > 1 ? 's' : ''} of stay)` : '';

  const waiverNote = visa === '186'
    ? 'Some regional or labour agreement nominations may qualify for a nomination fee waiver — we\'ll check this for you.'
    : '';

  return {
    nominationFeeRate: f.nomination,
    nominationTotal,
    safRate,
    safTotal,
    vacPrimaryRate: f.vacPrimary,
    vacPrimaryTotal,
    vacAdultRate: f.vacAdult,
    vacChildRate: f.vacChild,
    vacFamilyTotal,
    grandTotal,
    visaLabel,
    yearsNote,
    waiverNote,
  };
}

export interface EligibilityEvaluationInput {
  sponsorStatus: 'first' | 'existing';
  trading: 'yes' | 'establishing' | 'no';
  financial: 'yes' | 'notsure' | 'no';
  industry: string;
  salary: number;
  lmt: 'done' | 'willing' | 'unsure';
  region: string;
  compliance?: 'no' | 'notsure' | 'yes';
}

export interface DiagnosticItem {
  title: string;
  body: string;
  type: 'hard_stop' | 'flag' | 'bonus';
}

export interface EligibilityResult {
  tier: 'stop' | 'warn' | 'ok';
  cls: 'stop' | 'warn' | 'ok';
  title: string;
  sub: string;
  items: DiagnosticItem[];
}

export function evaluateBusinessSponsorEligibility(input: EligibilityEvaluationInput): EligibilityResult {
  const hardStops: DiagnosticItem[] = [];
  const flags: DiagnosticItem[] = [];
  let bonus: DiagnosticItem | null = null;

  if (input.trading === 'no') {
    hardStops.push({
      type: 'hard_stop',
      title: 'Business not actively trading in Australia',
      body: 'Standard Business Sponsorship generally requires a lawfully operating, actively trading Australian business (or a clear, evidenced plan to establish one). Let\'s talk through your specific situation before going further.'
    });
  }

  if (input.sponsorStatus === 'first' && input.compliance === 'yes') {
    hardStops.push({
      type: 'hard_stop',
      title: 'Compliance history flagged',
      body: 'This doesn\'t automatically rule sponsorship out, but it needs a proper conversation before any application work starts.'
    });
  }

  if (input.salary > 0 && input.salary < CSIT) {
    flags.push({
      type: 'flag',
      title: 'Offered salary below the Core Skills Income Threshold',
      body: `Increase the offered salary to at least $${CSIT.toLocaleString()}, or check whether the role sits under a labour agreement or DAMA with different salary rules.`
    });
  }

  if (input.financial === 'no' || input.financial === 'notsure') {
    flags.push({
      type: 'flag',
      title: 'Financial capacity needs documenting',
      body: 'We\'ll review this properly as part of the sponsorship application — it\'s rarely a dead end, just something to evidence.'
    });
  }

  if (input.lmt === 'willing' || input.lmt === 'unsure') {
    flags.push({
      type: 'flag',
      title: 'Labour market testing not yet done',
      body: 'You\'ll generally need to advertise the role locally before nominating — we\'ll guide you through exactly what\'s required.'
    });
  }

  if (input.trading === 'establishing') {
    flags.push({
      type: 'flag',
      title: 'Australian operation still being established',
      body: 'Sponsorship is usually assessed once the business is properly set up and trading — we can advise on timing.'
    });
  }

  if (input.region.startsWith('regional')) {
    bonus = {
      type: 'bonus',
      title: 'Regional opportunity',
      body: 'Your region may give you access to broader occupation lists or salary concessions through a Designated Area Migration Agreement or Regional Certifying Body — worth discussing.'
    };
  }

  let tier: 'stop' | 'warn' | 'ok';
  let cls: 'stop' | 'warn' | 'ok';
  let title: string;
  let sub: string;

  if (hardStops.length > 0) {
    tier = 'stop';
    cls = 'stop';
    title = "Sponsorship isn't likely to work right now";
    sub = "Here's why — none of these are necessarily permanent, but they need addressing first.";
  } else if (flags.length > 0) {
    tier = 'warn';
    cls = 'warn';
    title = "Possible, with a few things to sort out first";
    sub = "Nothing here is a hard blocker — here's what to address.";
  } else {
    tier = 'ok';
    cls = 'ok';
    title = "Looks like a strong candidate for sponsorship";
    sub = "Based on what you've told us, there's no obvious barrier to sponsoring this role.";
  }

  const items = [...hardStops, ...flags];
  if (bonus) {
    items.push(bonus);
  }

  return {
    tier,
    cls,
    title,
    sub,
    items,
  };
}
