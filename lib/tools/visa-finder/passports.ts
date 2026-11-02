/**
 * DRAFT passport eligibility lists.
 *
 * The PRD says these lists change often and must come from current official
 * sources reviewed by the agent. They are included here only so the engine
 * can narrow results (e.g. Pakistan + holiday => 600 Tourist only).
 * Every visa using these lists carries `passportListUnverified: true`, which
 * shows a "check eligible passports" note on the result card.
 *
 * TO UPDATE: edit the arrays below, then set the `passportListUnverified`
 * flag to false in visas.ts once Ali has confirmed them.
 */

// eVisitor (651): European passports
export const EVISITOR_COUNTRIES = [
  "Andorra", "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czech Republic", "Denmark",
  "Estonia", "Finland", "France", "Germany", "Greece", "Hungary", "Iceland", "Ireland", "Italy",
  "Latvia", "Liechtenstein", "Lithuania", "Luxembourg", "Malta", "Monaco", "Netherlands", "Norway",
  "Poland", "Portugal", "Romania", "San Marino", "Slovakia", "Slovenia", "Spain", "Sweden",
  "Switzerland", "United Kingdom", "Vatican City",
];

// ETA (601)
export const ETA_COUNTRIES = [
  "Brunei", "Canada", "Hong Kong (SAR)", "Japan", "Malaysia", "Singapore", "South Korea",
  "Taiwan", "United States",
];

// Working Holiday (417)
export const WORKING_HOLIDAY_417_COUNTRIES = [
  "Belgium", "Canada", "Cyprus", "Denmark", "Estonia", "Finland", "France", "Germany",
  "Hong Kong (SAR)", "Ireland", "Italy", "Japan", "Malta", "Netherlands", "Norway", "South Korea",
  "Sweden", "Taiwan", "United Kingdom",
];

// Work and Holiday (462)
export const WORK_AND_HOLIDAY_462_COUNTRIES = [
  "Argentina", "Austria", "Bangladesh", "Chile", "China", "Ecuador", "Greece", "Hungary", "India",
  "Indonesia", "Israel", "Luxembourg", "Malaysia", "Mongolia", "Peru", "Poland", "Portugal",
  "San Marino", "Slovakia", "Slovenia", "Spain", "Thailand", "Turkey", "United States", "Uruguay",
  "Vietnam",
];

// 600 Frequent Traveller (from the PRD)
export const FREQUENT_TRAVELLER_COUNTRIES = [
  "China", "Brunei", "Cambodia", "Philippines", "Laos", "Indonesia", "Malaysia", "Singapore",
  "Thailand", "Vietnam", "Timor-Leste",
];

// 600 Approved Destination Status: PRC citizens (excl. SARs)
export const ADS_COUNTRIES = ["China"];

export const NEW_ZEALAND = ["New Zealand"];
