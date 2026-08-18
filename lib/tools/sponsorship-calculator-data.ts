/**
 * Sponsorship Calculators Data and Helper Functions
 * Includes configuration for:
 * 1. "Can My Business Sponsor?" Eligibility Quick-Check
 * 2. Sponsorship Cost Estimator (Subclass 482, 186, 494)
 */

export interface FeeConfig {
  nominationFeePerWorker: number;
  safLevyUnder10M: number; // For 482: per year of stay. For 186/494: flat one-off
  safLevy10MOrMore: number; // For 482: per year of stay. For 186/494: flat one-off
  vacPrimary: number;
  vacAdult18Plus: number;
  vacChildUnder18: number;
  isSafPerYear: boolean;
  name: string;
  subclassNumber: string;
  description: string;
}

// Config object for government charges (indexed annually ~1 July)
export const FEES: Record<'482' | '186' | '494', FeeConfig> = {
  '482': {
    nominationFeePerWorker: 330,
    safLevyUnder10M: 1200, // per year of stay
    safLevy10MOrMore: 1800, // per year of stay
    vacPrimary: 4015,
    vacAdult18Plus: 4015,
    vacChildUnder18: 1005,
    isSafPerYear: true,
    name: 'Skills in Demand Visa',
    subclassNumber: '482',
    description: 'Temporary employer-sponsored visa for up to 4 years.',
  },
  '186': {
    nominationFeePerWorker: 540, // may be waived for regional / labour agreements
    safLevyUnder10M: 3000, // flat one-off
    safLevy10MOrMore: 5000, // flat one-off
    vacPrimary: 6140,
    vacAdult18Plus: 3070,
    vacChildUnder18: 1535,
    isSafPerYear: false,
    name: 'Employer Nomination Scheme',
    subclassNumber: '186',
    description: 'Direct Permanent Residency pathway for skilled workers.',
  },
  '494': {
    nominationFeePerWorker: 0, // None
    safLevyUnder10M: 3000, // flat one-off
    safLevy10MOrMore: 5000, // flat one-off
    vacPrimary: 6140,
    vacAdult18Plus: 3070,
    vacChildUnder18: 1535,
    isSafPerYear: false,
    name: 'Skilled Employer Sponsored Regional (Provisional)',
    subclassNumber: '494',
    description: 'Provisional regional visa with a pathway to permanent residence.',
  },
};

export const CORE_SKILLS_INCOME_THRESHOLD = 79499; // TSMIT / CSIT in AUD

export const INDUSTRIES = [
  { value: 'trades_construction', label: 'Trades & Construction' },
  { value: 'health_medical', label: 'Health & Medical' },
  { value: 'aged_disability', label: 'Aged & Disability Care' },
  { value: 'hospitality_food', label: 'Hospitality & Food Services' },
  { value: 'childcare_early_learning', label: 'Childcare & Early Learning' },
  { value: 'agriculture', label: 'Agriculture & Primary Production' },
  { value: 'information_tech', label: 'Information Technology & Tech' },
  { value: 'professional_services', label: 'Professional, Scientific & Technical' },
  { value: 'manufacturing_logistics', label: 'Manufacturing & Logistics' },
  { value: 'other', label: 'Other Industry' },
];

export const LOCATIONS = [
  { value: 'NSW_METRO', label: 'New South Wales - Sydney Metro', isRegional: false, isDama: false },
  { value: 'NSW_REGIONAL', label: 'New South Wales - Regional / Designated Area', isRegional: true, isDama: true },
  { value: 'VIC_METRO', label: 'Victoria - Melbourne Metro', isRegional: false, isDama: false },
  { value: 'VIC_REGIONAL', label: 'Victoria - Regional / Designated Area (e.g. Great South Coast)', isRegional: true, isDama: true },
  { value: 'QLD_METRO', label: 'Queensland - Brisbane Metro / Gold Coast', isRegional: false, isDama: false },
  { value: 'QLD_REGIONAL', label: 'Queensland - Regional (e.g. Cairns / Far North QLD / Townsville)', isRegional: true, isDama: true },
  { value: 'WA_METRO', label: 'Western Australia - Perth Metro', isRegional: false, isDama: false },
  { value: 'WA_REGIONAL', label: 'Western Australia - Regional / DAMA (e.g. Goldfields / Pilbara / South West)', isRegional: true, isDama: true },
  { value: 'SA_ALL', label: 'South Australia - All Regions (DAMA Eligible)', isRegional: true, isDama: true },
  { value: 'TAS_ALL', label: 'Tasmania - All Regions', isRegional: true, isDama: false },
  { value: 'NT_ALL', label: 'Northern Territory - All Regions (DAMA Eligible)', isRegional: true, isDama: true },
  { value: 'ACT_ALL', label: 'Australian Capital Territory - Canberra', isRegional: false, isDama: false },
];

export interface CostCalculationInput {
  visa: '482' | '186' | '494';
  turnover: 'under_10m' | '10m_or_more';
  numWorkers: number;
  yearsOfStay?: number; // 1 to 4 (default 4) for 482
  adults18Plus: number;
  childrenUnder18: number;
}

export interface CostCalculationBreakdown {
  nominationFeePerWorker: number;
  totalNominationFees: number;
  safLevyRatePerWorker: number;
  totalSafLevy: number;
  primaryVacPerWorker: number;
  totalPrimaryVac: number;
  adultVacRate: number;
  totalAdultVac: number;
  childVacRate: number;
  totalChildVac: number;
  perWorkerTotal: number;
  familyTotal: number;
  grandTotal: number;
}

export function calculateSponsorshipCosts(input: CostCalculationInput): CostCalculationBreakdown {
  const feeConfig = FEES[input.visa] || FEES['482'];
  const numWorkers = Math.max(1, input.numWorkers || 1);
  const years = input.visa === '482' ? Math.max(1, Math.min(4, input.yearsOfStay || 4)) : 1;
  const isSmallBiz = input.turnover === 'under_10m';

  // 1. Nomination fee
  const nominationFeePerWorker = feeConfig.nominationFeePerWorker;
  const totalNominationFees = nominationFeePerWorker * numWorkers;

  // 2. SAF levy
  const baseSaf = isSmallBiz ? feeConfig.safLevyUnder10M : feeConfig.safLevy10MOrMore;
  const safLevyRatePerWorker = feeConfig.isSafPerYear ? baseSaf * years : baseSaf;
  const totalSafLevy = safLevyRatePerWorker * numWorkers;

  // 3. Primary applicant VAC
  const primaryVacPerWorker = feeConfig.vacPrimary;
  const totalPrimaryVac = primaryVacPerWorker * numWorkers;

  // Per worker government total
  const perWorkerTotal = nominationFeePerWorker + safLevyRatePerWorker + primaryVacPerWorker;

  // 4. Family dependants VAC
  const adults18Plus = Math.max(0, input.adults18Plus || 0);
  const childrenUnder18 = Math.max(0, input.childrenUnder18 || 0);

  const adultVacRate = feeConfig.vacAdult18Plus;
  const totalAdultVac = adults18Plus * adultVacRate;

  const childVacRate = feeConfig.vacChildUnder18;
  const totalChildVac = childrenUnder18 * childVacRate;

  const familyTotal = totalAdultVac + totalChildVac;

  // Grand total
  const grandTotal = (perWorkerTotal * numWorkers) + familyTotal;

  return {
    nominationFeePerWorker,
    totalNominationFees,
    safLevyRatePerWorker,
    totalSafLevy,
    primaryVacPerWorker,
    totalPrimaryVac,
    adultVacRate,
    totalAdultVac,
    childVacRate,
    totalChildVac,
    perWorkerTotal,
    familyTotal,
    grandTotal,
  };
}

export interface EligibilityEvaluationInput {
  sponsorStatus: 'first_time' | 'approved';
  lawfullyTrading: 'yes' | 'no' | 'setting_up';
  financialCapacity: 'yes' | 'not_sure' | 'no';
  industry: string;
  salary: number;
  lmtStatus: 'already_done' | 'not_yet_willing' | 'not_sure';
  location: string;
  complianceIssues?: 'no' | 'not_sure' | 'yes';
}

export interface EligibilityFlag {
  type: 'hard_stop' | 'fixable' | 'bonus';
  title: string;
  detail: string;
  actionItem?: string;
}

export interface EligibilityResult {
  tier: 'hard_stop' | 'possible' | 'strong_candidate';
  badgeTitle: string;
  badgeColor: 'red' | 'amber' | 'green';
  headline: string;
  summary: string;
  flags: EligibilityFlag[];
}

export function evaluateBusinessSponsorEligibility(input: EligibilityEvaluationInput): EligibilityResult {
  const flags: EligibilityFlag[] = [];

  // Check Hard Stops
  // 1. Lawfully operating / trading
  if (input.lawfullyTrading === 'no') {
    flags.push({
      type: 'hard_stop',
      title: 'Business Trading Status Requirement',
      detail: 'An active Australian business entity (ABN/ACN) trading lawfully is a statutory prerequisite for Standard Business Sponsorship.',
      actionItem: 'Establish the trading entity in Australia or set up an overseas business sponsorship pipeline before proceeding.'
    });
  }

  // 2. Prior compliance issues (First-time sponsors only)
  if (input.sponsorStatus === 'first_time' && input.complianceIssues === 'yes') {
    flags.push({
      type: 'hard_stop',
      title: 'Prior Compliance History Review Needed',
      detail: 'Past workplace relations or immigration compliance history requires an upfront legal strategy review.',
      actionItem: 'This is not an automatic bar, but requires direct consultation to present mitigation and satisfy the Department.'
    });
  }

  // Check Fixable Flags
  // 3. Salary threshold check
  const offeredSalary = Number(input.salary) || 0;
  if (offeredSalary > 0 && offeredSalary < CORE_SKILLS_INCOME_THRESHOLD) {
    flags.push({
      type: 'fixable',
      title: 'Offered Salary Below Core Skills Threshold ($79,499 AUD)',
      detail: `The offered annual salary of $${offeredSalary.toLocaleString()} is below the current Core Skills Income Threshold ($${CORE_SKILLS_INCOME_THRESHOLD.toLocaleString()}).`,
      actionItem: 'Increase the offered salary to at least $79,499 AUD, or check whether the role sits under a designated Labour Agreement or DAMA with approved salary concessions.'
    });
  }

  // 4. Financial capacity
  if (input.financialCapacity === 'not_sure' || input.financialCapacity === 'no') {
    flags.push({
      type: 'fixable',
      title: 'Financial Viability & Capacity Documentation',
      detail: 'The Department requires evidence that the business can sustain the nomination and meet all statutory employment costs.',
      actionItem: "We'll review this properly as part of the sponsorship application — it's rarely a dead end, just something to document with financial statements and BAS."
    });
  }

  // 5. Labour market testing (LMT)
  if (input.lmtStatus === 'not_yet_willing' || input.lmtStatus === 'not_sure') {
    flags.push({
      type: 'fixable',
      title: 'Labour Market Testing (Local Advertising)',
      detail: 'Under Australian immigration law, most employer-sponsored nominations require advertising the role locally across approved platforms for at least 4 weeks.',
      actionItem: "You'll generally need to advertise the role locally before nominating — we can guide you through the exact compliant format, wording, and platform requirements."
    });
  }

  // Check Bonus Regional / DAMA Flag
  const matchedLocation = LOCATIONS.find(l => l.value === input.location);
  if (matchedLocation?.isDama) {
    flags.push({
      type: 'bonus',
      title: 'Regional / DAMA Concession Opportunities Available',
      detail: `${matchedLocation.label} is eligible for regional concessions and Designated Area Migration Agreements (DAMA).`,
      actionItem: 'Your business may access concessions on age limits, English requirements, occupation eligibility, and salary thresholds.'
    });
  }

  // Determine overall tier
  const hardStops = flags.filter(f => f.type === 'hard_stop');
  const fixableFlags = flags.filter(f => f.type === 'fixable');

  if (hardStops.length > 0) {
    return {
      tier: 'hard_stop',
      badgeTitle: 'Sponsorship Challenging / Action Required',
      badgeColor: 'red',
      headline: 'Sponsorship isn’t likely to work immediately without resolving key prerequisites',
      summary: 'Your business has one or more critical areas that must be addressed before an application can be lodged. Review the specific guidance below.',
      flags,
    };
  }

  if (fixableFlags.length > 0) {
    return {
      tier: 'possible',
      badgeTitle: 'Possible — With a Few Things to Sort Out',
      badgeColor: 'amber',
      headline: 'Your business shows good potential for sponsorship with actionable steps to complete',
      summary: 'You meet core sponsorship criteria, and the identified items below can be systematically resolved during application preparation.',
      flags,
    };
  }

  return {
    tier: 'strong_candidate',
    badgeTitle: 'Looks Like a Strong Candidate',
    badgeColor: 'green',
    headline: 'Your business appears fully primed to sponsor overseas workers',
    summary: 'Based on your answers, your business satisfies all preliminary sponsorship and nomination criteria for Australian employer-sponsored visas.',
    flags,
  };
}
